import { Router } from "express";
import { Op } from "sequelize";
import teacherAuth from "../middleware/teacherAuth.js";
import { Enrollment, Course, Attendance, CourseLocation, Student, AttendanceSession } from "../models/index.js";

const router = Router();

// Default school location (kept for backwards compatibility)
const DEFAULT_SCHOOL_LAT = 4.1533;
const DEFAULT_SCHOOL_LON = 9.2927;
// Radius enforced on server side (meters)
const RADIUS_METERS = 100;
// Minimum sample count before we infer a stable course location
const MIN_SAMPLES_TO_INFER = 5;

// Calculate exact distance in meters for error reporting
function calculateDistance(userLat, userLon, schoolLat, schoolLon) {
  const latDiff = Math.abs(userLat - schoolLat);
  const lonDiff = Math.abs(userLon - schoolLon);
  const latMeters = latDiff * 111000;
  const lonMeters = lonDiff * 111000;
  return Math.sqrt(latMeters ** 2 + lonMeters ** 2);
}

// POST /attendance-sessions/:sessionID/attendance
// Record attendance for a given session (session-aware)
router.post('/attendance-sessions/:sessionID/attendance', async (req, res) => {
  const { sessionID } = req.params;
  // Accept school coordinates from frontend: school_lat, school_lon (optional but recommended)
  const { stdId, fingerprinthash, latitude, longitude, school_lat, school_lon } = req.body;

  try {
    const now = new Date();

    // find session
    const session = await AttendanceSession.findByPk(sessionID);
    if (!session) return res.status(404).json({ message: 'Attendance session not found' });

    // ensure session is open and within opened/closed times
    if (session.status !== 'open') return res.status(400).json({ message: 'Attendance session is not open' });
    if (new Date(session.openedAt) > now) return res.status(400).json({ message: 'Attendance session has not opened yet' });
    if (session.closedAt && new Date(session.closedAt) < now) return res.status(400).json({ message: 'Attendance session is already closed' });

    const courseID = session.courseID;

    // check enrollment
    const isEnrolled = await Enrollment.findOne({ where: { stdId, courseID } });
    if (!isEnrolled) {
      return res.status(403).json({ message: 'Student not enrolled in this course' });
    }

    // ────────────────────────────────────────────────────────────────
    // NEW: Prevent duplicate attendance for the same student + session
    // ────────────────────────────────────────────────────────────────
    const existing = await Attendance.findOne({
      where: {
        stdId,
        sessionId: session.sessionId 
      }
    });

    if (existing) {
      return res.status(409).json({
        message: 'You have already recorded attendance for this session',
        alreadyRecordedAt: existing.timestamp,
        currentStatus: existing.status
      });
    }

    const course = await Course.findByPk(courseID);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Location check (simple radius logic)
    if (!latitude || !longitude) {
      return res.status(400).json({ message: 'Location is required' });
    }

    // Parse numeric values
    const userLat = parseFloat(latitude);
    const userLon = parseFloat(longitude);
    if (Number.isNaN(userLat) || Number.isNaN(userLon)) {
      return res.status(400).json({ message: 'Invalid latitude/longitude' });
    }
    /* Location Strategy: Learn → Enforce
     
     PHASE 1 (< 5 samples): Learning phase
     - Accept any location submission
     - Collect samples to learn actual course location
     - No rejection for location
     
     PHASE 2 (>= 5 samples): Enforcement phase
     - Course location inferred from average of 5+ submissions
     - New submissions must be within RADIUS_METERS of inferred location
     - Clear error message if outside radius
     
     This allows campus diversity while preventing abuse once location is learned.*/
     
    let courseLoc = await CourseLocation.findOne({ where: { courseID } });
    let insideRadius = false;
    let samplesCollected = 0;
    
    if (courseLoc) {
      // PHASE 2: Location already inferred — enforce radius check
      const distance = calculateDistance(userLat, userLon, parseFloat(courseLoc.schoolLat), parseFloat(courseLoc.schoolLon));
      insideRadius = distance <= RADIUS_METERS;
      
      if (!insideRadius) {
        return res.status(400).json({ 
          message: `Your location is ${Math.round(distance)}m away from the course location (${Math.round(RADIUS_METERS)}m allowed). Are you on campus?`,
          distance,
          allowed: RADIUS_METERS,
          courseLocation: { 
            lat: parseFloat(courseLoc.schoolLat), 
            lon: parseFloat(courseLoc.schoolLon) 
          },
          yourLocation: { lat: userLat, lon: userLon }
        });
      }
    } else {
      // PHASE 1: Still learning — collect samples
      const recent = await Attendance.findAll({
        where: {
          courseID,
          latitude: { [Op.ne]: null },
          longitude: { [Op.ne]: null }
        },
        order: [['timestamp', 'DESC']],
        limit: MIN_SAMPLES_TO_INFER - 1
      });

      const samples = [];
      for (const r of recent) {
        const lat = parseFloat(r.latitude);
        const lon = parseFloat(r.longitude);
        if (!Number.isNaN(lat) && !Number.isNaN(lon)) samples.push({ lat, lon });
      }
      samples.push({ lat: userLat, lon: userLon });
      samplesCollected = samples.length;

      if (samples.length >= MIN_SAMPLES_TO_INFER) {
        const sum = samples.reduce((acc, s) => { acc.lat += s.lat; acc.lon += s.lon; return acc; }, { lat: 0, lon: 0 });
        const avgLat = sum.lat / samples.length;
        const avgLon = sum.lon / samples.length;

        try {
          courseLoc = await CourseLocation.create({ 
            courseID, 
            schoolLat: avgLat, 
            schoolLon: avgLon, 
            samples: samples.length 
          });
          console.log(`✓ CourseLocation inferred for courseID ${courseID}: (${avgLat.toFixed(4)}, ${avgLon.toFixed(4)}) from ${samples.length} samples`);
          
          // This submission is part of the learning phase - accept it
          // Only enforce radius for future submissions (when courseLoc already exists)
          insideRadius = true;
        } catch (e) {
          console.warn('Failed to persist inferred course location', e);
          insideRadius = true; // Accept anyway
        }
      } else {
        // Not enough samples yet — accept this submission to grow the sample pool
        insideRadius = true;
        console.log(`→ Location learning phase for courseID ${courseID}: ${samplesCollected}/${MIN_SAMPLES_TO_INFER} samples collected`);
      }
    }

    //Fingerprint presence check (simple mock)
    let attendance;

    if (!fingerprinthash || fingerprinthash.length < 5) {
      // Biometric failed → record as absent
      attendance = await Attendance.create({
        stdId,
        courseID,
        sessionId: session.sessionId,
        fingerprinthash: fingerprinthash || null,
        latitude,
        longitude,
        timestamp: now,
        valid: false,
        status: 'absent',
        markedBy: 'system',
        markedAt: now
      });
      return res.json({ message: 'Biometric failed - recorded as absent', attendance });
    }

    // Biometric success
    attendance = await Attendance.create({
      stdId,
      courseID,
      sessionId: session.sessionId,
      fingerprinthash,
      latitude,
      longitude,
      timestamp: now,
      valid: true,
      status: 'present',
      markedBy: 'biometric',
      markedAt: now
    });

    return res.json({ message: 'Attendance recorded', attendance });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

// POST /course/:courseID/attendance-sessions
router.post('/course/:courseID/attendance-sessions', teacherAuth, async (req, res) => {
  // Add these at the very beginning of your route handler
  console.log('====== SESSION CREATION DEBUG ======');
  console.log('1. Server current time (local):', new Date());
  console.log('2. Server current time (ISO):', new Date().toISOString());
  console.log('3. Server current year:', new Date().getFullYear());
  console.log('4. Server current month:', new Date().getMonth());
  console.log('5. Server current day:', new Date().getDate());
  console.log('6. Received payload:', req.body);
  console.log('====================================');
  
  try {
    const { courseID } = req.params;
    const teacherId = req.teacher.teacherId;
    const { openedAt, closedAt, status = 'open', notes } = req.body;

    // Verify course exists and teacher owns it
    const course = await Course.findByPk(courseID);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    if (parseInt(course.instructorID, 10) !== parseInt(teacherId, 10)) {
      return res.status(403).json({ message: 'Teacher does not own this course' });
    }

    // Validate time format - expecting "HH:mm" from frontend
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!openedAt || !timeRegex.test(openedAt)) {
      return res.status(400).json({ message: 'Invalid openedAt time format. Use HH:mm' });
    }
    if (closedAt && !timeRegex.test(closedAt)) {
      return res.status(400).json({ message: 'Invalid closedAt time format. Use HH:mm' });
    }

    // Get current date
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Get the teacher's timezone offset (in minutes) from frontend
    // Default to 0 if not provided (UTC)
    const teacherTimezoneOffset = req.body.timezoneOffset || 0;

    console.log('Teacher timezone offset:', teacherTimezoneOffset, 'minutes');
    console.log('Today date:', today);

    // Parse openedAt time (which is in teacher's local time)
    const [openedHour, openedMinute] = openedAt.split(':').map(Number);
    
    // Create date in teacher's local time
    const openedDateLocal = new Date(today);
    openedDateLocal.setHours(openedHour, openedMinute, 0, 0);
    
    // Convert to UTC by subtracting the timezone offset
    const openedDateTime = new Date(openedDateLocal.getTime() - (teacherTimezoneOffset * 60000));

    console.log('Opened time conversion:', {
      localTime: `${openedHour}:${openedMinute}`,
      localDate: openedDateLocal,
      utcDate: openedDateTime,
      utcISO: openedDateTime.toISOString()
    });

    // Same for closedAt
    let closedDateTime = null;
    if (closedAt) {
      const [closedHour, closedMinute] = closedAt.split(':').map(Number);
      const closedDateLocal = new Date(today);
      closedDateLocal.setHours(closedHour, closedMinute, 0, 0);
      closedDateTime = new Date(closedDateLocal.getTime() - (teacherTimezoneOffset * 60000));
      
      console.log('Closed time conversion:', {
        localTime: `${closedHour}:${closedMinute}`,
        localDate: closedDateLocal,
        utcDate: closedDateTime,
        utcISO: closedDateTime?.toISOString()
      });
    }

    // Convert times to minutes for comparison with course times
    const timeToMinutes = (timeStr) => {
      const [h, m] = timeStr.split(':').map(Number);
      return h * 60 + m;
    };

    const openedMinutes = timeToMinutes(openedAt);
    const closedMinutes = closedAt ? timeToMinutes(closedAt) : null;
    
    // Parse course times (which are stored as TIME strings like "09:00:00")
    const courseStartMinutes = timeToMinutes(course.startTime.slice(0, 5));
    const courseEndMinutes = timeToMinutes(course.endTime.slice(0, 5));

    // Validation
    if (openedMinutes < courseStartMinutes) {
      return res.status(400).json({ message: 'Session start time must be >= course start time' });
    }
    if (closedMinutes && closedMinutes > courseEndMinutes) {
      return res.status(400).json({ message: 'Session end time must be <= course end time' });
    }
    if (closedMinutes && closedMinutes <= openedMinutes) {
      return res.status(400).json({ message: 'Session end time must be after start time' });
    }

   const session = await AttendanceSession.create({
  courseID: parseInt(courseID, 10),
  teacherId: parseInt(teacherId, 10),
  openedAt: openedDateTime,
  closedAt: closedDateTime,
  status: status === 'open' ? 'open' : 'closed',
  notes: notes || null,
  teacherTimezoneOffset: teacherTimezoneOffset  // ADD THIS
});

    console.log('Session created in database:', {
      sessionId: session.sessionId,
      openedAt: session.openedAt,
      closedAt: session.closedAt,
      openedAtISO: session.openedAt.toISOString?.(),
      closedAtISO: session.closedAt?.toISOString?.(),
      teacherTimezoneOffset: teacherTimezoneOffset 
    });

    return res.status(201).json({ message: 'Attendance session created', session });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// GET /course/:courseID/attendance-sessions/open  (is there an active session?)
router.get('/course/:courseID/attendance-sessions/open', async (req, res) => {
  try {
    const { courseID } = req.params;
    const nowUTC = new Date(); // Server UTC time
    
    console.log('=== OPEN SESSION CHECK ===');
    console.log('Current UTC time:', nowUTC.toISOString());
    
    // Find all open sessions for this course
    const sessions = await AttendanceSession.findAll({
      where: {
        courseID,
        status: 'open'
      },
      order: [['openedAt', 'DESC']]
    });

    if (!sessions || sessions.length === 0) {
      console.log('No open sessions found for course:', courseID);
      return res.json({ active: false });
    }

    // Fetch the course
    const course = await Course.findByPk(courseID);
    if (!course) {
      console.log('Course not found:', courseID);
      return res.json({ active: false });
    }

    // Get course's timezone offset (when the course was created)
    const courseTimezoneOffset = course.teacherTimezoneOffset || 0;
    console.log('Course timezone offset:', courseTimezoneOffset, 'minutes');
    console.log('Course start time:', course.startTime, 'Course end time:', course.endTime);

    // Helper to extract minutes from TIME string
    const timeStringToMinutes = (timeStr) => {
      const timePart = timeStr.slice(0, 5);
      const [h, m] = timePart.split(':').map(Number);
      return h * 60 + m;
    };

    // Get course times in minutes (teacher's local time when course was created)
    const courseStartMinutes = timeStringToMinutes(course.startTime);
    const courseEndMinutes = timeStringToMinutes(course.endTime);

    // Check each open session
    for (const session of sessions) {
      console.log('\nChecking session:', session.sessionId);
      console.log('Session UTC openedAt:', session.openedAt);
      console.log('Session UTC closedAt:', session.closedAt);
      console.log('Session timezone offset:', session.teacherTimezoneOffset, 'minutes');
      
      const openedAtUTC = new Date(session.openedAt);
      const closedAtUTC = session.closedAt ? new Date(session.closedAt) : null;
      
      // Get session's timezone offset (when the session was created)
      const sessionTimezoneOffset = session.teacherTimezoneOffset || 0;
      
      // Convert session UTC times back to teacher's local time (when session was created)
      const openedAtLocal = new Date(openedAtUTC.getTime() + (sessionTimezoneOffset * 60000));
      const closedAtLocal = closedAtUTC ? 
        new Date(closedAtUTC.getTime() + (sessionTimezoneOffset * 60000)) : null;
      
      // IMPORTANT: Convert current UTC time to the session's local time
      const nowLocal = new Date(nowUTC.getTime() + (sessionTimezoneOffset * 60000));
      
      console.log('Session local openedAt:', openedAtLocal.toISOString());
      console.log('Session local closedAt:', closedAtLocal?.toISOString());
      console.log('Current local time (for session):', nowLocal.toISOString());
      
      // Check if session is for today (teacher's local date when session was created)
      const isSameDayLocal = openedAtLocal.getUTCDate() === nowLocal.getUTCDate() &&
                            openedAtLocal.getUTCMonth() === nowLocal.getUTCMonth() &&
                            openedAtLocal.getUTCFullYear() === nowLocal.getUTCFullYear();
      
      if (!isSameDayLocal) {
        console.log('Session is not for today in teacher\'s local time');
        continue;
      }
      
      // Get session times in minutes (teacher's local time)
      const openedMinutesLocal = openedAtLocal.getUTCHours() * 60 + openedAtLocal.getUTCMinutes();
      const closedMinutesLocal = closedAtLocal ? 
        closedAtLocal.getUTCHours() * 60 + closedAtLocal.getUTCMinutes() : null;
      const nowMinutesLocal = nowLocal.getUTCHours() * 60 + nowLocal.getUTCMinutes();
      
      console.log('Session local minutes:', { opened: openedMinutesLocal, closed: closedMinutesLocal });
      console.log('Current local minutes:', nowMinutesLocal);
      console.log('Course minutes:', { start: courseStartMinutes, end: courseEndMinutes });
      
      // CRITICAL: Convert session local times to course's timezone for validation
      // This accounts for teacher traveling to different timezones
      const openedMinutesInCourseTimezone = openedMinutesLocal + (courseTimezoneOffset - sessionTimezoneOffset);
      const closedMinutesInCourseTimezone = closedMinutesLocal ? 
        closedMinutesLocal + (courseTimezoneOffset - sessionTimezoneOffset) : null;
      
      console.log('Session times in course timezone:', { 
        opened: openedMinutesInCourseTimezone, 
        closed: closedMinutesInCourseTimezone 
      });
      
      // Validate against course times (which are in course's original timezone)
      if (openedMinutesInCourseTimezone < courseStartMinutes) {
        console.log('Session starts before course (in course timezone)');
        continue;
      }
      if (closedMinutesInCourseTimezone && closedMinutesInCourseTimezone > courseEndMinutes) {
        console.log('Session ends after course (in course timezone)');
        continue;
      }
      
      // Check if current local time (in session's timezone) is within session bounds
      const isWithinBounds = nowMinutesLocal >= openedMinutesLocal && 
                            (closedMinutesLocal === null || nowMinutesLocal <= closedMinutesLocal);
      
      console.log('Is within session bounds?', isWithinBounds);
      
      if (isWithinBounds) {
        console.log('ACTIVE SESSION FOUND:', session.sessionId);
        return res.json({ 
          active: true, 
          sessionId: session.sessionId,
          courseID: session.courseID,
          teacherId: session.teacherId,
          openedAt: session.openedAt,
          closedAt: session.closedAt,
          status: session.status,
          notes: session.notes
        });
      }
      
      console.log('Session not active right now');
    }

    console.log('No active session found');
    return res.json({ active: false });
  } catch (err) {
    console.error('Error in /open endpoint:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});


// GET /course/:courseID/attendance-sessions  (teacher lists sessions for the course)
router.get('/course/:courseID/attendance-sessions', teacherAuth, async (req, res) => {
  try {
    const { courseID } = req.params;
    const teacherId = req.teacher.teacherId;
    const { page: pageStr = '1', limit: limitStr = '50', status } = req.query;

    // verify course exists and teacher owns it
    const course = await Course.findByPk(courseID);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    if (parseInt(course.instructorID, 10) !== parseInt(teacherId, 10)) return res.status(403).json({ message: 'Teacher does not own this course' });

    let page = parseInt(pageStr, 10);
    let limit = parseInt(limitStr, 10);
    if (Number.isNaN(page) || page < 1) page = 1;
    if (Number.isNaN(limit) || limit < 1 || limit > 200) limit = 50;
    const offset = (page - 1) * limit;

    const where = { courseID: parseInt(courseID, 10) };
    if (status && ['open', 'closed'].includes(status)) where.status = status;

    const { count, rows } = await AttendanceSession.findAndCountAll({
      where,
      order: [['openedAt', 'DESC']],
      limit,
      offset,
      // Include the course to get course time details if needed
      include: [{ 
        model: Course, 
        attributes: ['courseID', 'title', 'startTime', 'endTime'] 
      }]
    });

    return res.json({ 
      data: rows, 
      meta: { 
        page, 
        limit, 
        total: count, 
        totalPages: Math.ceil(count / limit) || 1 
      } 
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// GET /attendance-sessions/:sessionID/attendance  (list attendance for a session)
router.get('/attendance-sessions/:sessionID/attendance', async (req, res) => {
  try {
    const { sessionID } = req.params;
    const { page: pageStr = '1', limit: limitStr = '50' } = req.query;
    let page = parseInt(pageStr, 10);
    let limit = parseInt(limitStr, 10);
    if (Number.isNaN(page) || page < 1) page = 1;
    if (Number.isNaN(limit) || limit < 1 || limit > 200) limit = 50;
    const offset = (page - 1) * limit;

    // First, verify the session exists (optional but good practice)
    const session = await AttendanceSession.findByPk(sessionID);
    if (!session) {
      return res.status(404).json({ message: 'Attendance session not found' });
    }

    const { count, rows } = await Attendance.findAndCountAll({
      where: { sessionId: sessionID },
      order: [['timestamp', 'DESC']],
      limit,
      offset,
      include: [ 
        { 
          model: Student, 
          attributes: ['stdId', 'name', 'email'] 
        }, 
        { 
          model: AttendanceSession,
          include: [{
            model: Course,
            attributes: ['courseID', 'title']
          }]
        }
      ]
    });

    const data = rows.map(r => {
      const item = r.toJSON ? r.toJSON() : r;
      if (item.Student) {
        item.student = { 
          stdId: item.Student.stdId, 
          name: item.Student.name, 
          email: item.Student.email 
        };
        delete item.Student;
      }
      if (item.AttendanceSession) {
        item.session = {
          sessionId: item.AttendanceSession.sessionId,
          openedAt: item.AttendanceSession.openedAt,
          closedAt: item.AttendanceSession.closedAt,
          status: item.AttendanceSession.status,
          course: item.AttendanceSession.Course
        };
        delete item.AttendanceSession;
        if (item.session.course) {
          item.course = item.session.course;
          delete item.session.course;
        }
      }
      return item;
    });

    return res.json({ 
      data, 
      meta: { 
        page, 
        limit, 
        total: count, 
        totalPages: Math.ceil(count / limit) || 1 
      } 
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});


// GET /attendance  (list with filters + pagination)
// All filters are optional: courseID, stdId, status, date
router.get('/', async (req, res) => {
  try {
    const { courseID, date, stdId, status, page: pageStr = '1', limit: limitStr = '20' } = req.query;
    
    // Parse and validate pagination
    let page = parseInt(pageStr, 10);
    let limit = parseInt(limitStr, 10);
    if (Number.isNaN(page) || page < 1) page = 1;
    if (Number.isNaN(limit) || limit < 1 || limit > 100) limit = 20;
    
    // Build where clause dynamically (all filters optional)
    const where = {};
    
    // courseID filter (numeric, optional)
    if (courseID) {
      const parsedCourseID = parseInt(courseID, 10);
      if (!Number.isNaN(parsedCourseID)) where.courseID = parsedCourseID;
    }
    
    // stdId filter (numeric, optional)
    if (stdId) {
      const parsedStdId = parseInt(stdId, 10);
      if (!Number.isNaN(parsedStdId)) where.stdId = parsedStdId;
    }
    
    // status filter (enum validation, optional)
    if (status && ['present', 'absent', 'manual'].includes(status)) {
      where.status = status;
    }
    
    // date filter (format: YYYY-MM-DD, optional)
    if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
      where.timestamp = {
        [Op.between]: [new Date(date + 'T00:00:00Z'), new Date(date + 'T23:59:59Z')]
      };
    }

    const offset = (page - 1) * limit;
    const { count, rows } = await Attendance.findAndCountAll({
      where,
      order: [['timestamp','DESC']],
      limit,
      offset,
      attributes: ['attId','stdId','courseID','fingerprinthash','timestamp','latitude','longitude','valid','createdAt','updatedAt'],
      include: [
        { model: Student, attributes: ['stdId', 'name', 'email'] },
        {model:Course,attributes :['courseID','title']},
      ]
    });

    // map rows to include a flat student object for convenience
    const data = rows.map(r => {
      const item = r.toJSON ? r.toJSON() : r;
      // If Student included, promote name/email to top-level student object
      if (item.Student) {
        item.student = {
          stdId: item.Student.stdId,
          name: item.Student.name,
          email: item.Student.email
        };
        delete item.Student;

        if (item.Course) {
    item.course = {
      courseID: item.Course.courseID,
      title: item.Course.title
    };
    delete item.Course;
  }
      }
      return item;
    });

    const totalPages = Math.ceil(count / limit) || 1;
    return res.json({ data, meta: { page, limit, total: count, totalPages } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// GET /attendance/failed?courseID=1&date=2025-01-15
router.get('/failed', async (req, res) => {
  try {
    const { courseID, date } = req.query;
    if (!courseID) return res.status(400).json({ message: 'courseID is required' });
    const where = { courseID, status: 'absent', markedBy: 'system' };
    if (date) {
      where.timestamp = { [Op.between]: [new Date(date + 'T00:00:00Z'), new Date(date + 'T23:59:59Z')] };
    }
    const fails = await Attendance.findAll({ where, include: [{ model: Student, attributes: ['stdId','name','email'] }] });
    // return unique students
    const students = [];
    const seen = new Set();
    for (const a of fails) {
      if (!seen.has(a.stdId)) {
        seen.add(a.stdId);
        students.push({ stdId: a.stdId, name: a.Student?.name || null, email: a.Student?.email || null });
      }
    }
    return res.json({ students });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// POST /attendance/manual  (teacher override)
router.post('/manual', teacherAuth, async (req, res) => {
  try {
    const { stdId, courseID, notes } = req.body;
    const teacherId = req.teacher.teacherId;
    if (!stdId || !courseID) return res.status(400).json({ message: 'stdId and courseID are required' });

    const course = await Course.findByPk(courseID);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    if (parseInt(course.instructorID, 10) !== parseInt(teacherId, 10)) return res.status(403).json({ message: 'Teacher does not own this course' });

    // check enrollment
    const enrolled = await Enrollment.findOne({ where: { stdId, courseID } });
    if (!enrolled) return res.status(400).json({ message: 'Student not enrolled in course' });

    const now = new Date();
    if (now < new Date(course.startTime) || now > new Date(course.endTime)) return res.status(400).json({ message: 'Cannot mark outside class time' });

    // find existing attendance for this student & course on same day (most recent)
    const existing = await Attendance.findOne({ where: { stdId, courseID }, order: [['timestamp','DESC']] });

    if (existing && (new Date(existing.timestamp)).toDateString() === now.toDateString()) {
      // update
      existing.status = 'manual';
      existing.markedBy = 'teacher';
      existing.teacherId = teacherId;
      existing.markedAt = now;
      if (notes) existing.notes = notes;
      await existing.save();
      return res.json({ message: 'Attendance updated (manual)', attendance: existing });
    }

    // create new manual attendance
    const attendance = await Attendance.create({ stdId, courseID, fingerprinthash: null, latitude: null, longitude: null, timestamp: now, valid: false, status: 'manual', markedBy: 'teacher', teacherId, markedAt: now, notes: notes || null });
    return res.status(201).json({ message: 'Attendance marked manually', attendance });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// GET /attendance/stats/:teacherID?date=YYYY-MM-DD (teacher attendance statistics for a specific date)
router.get('/stats/:teacherID', async (req, res) => {
  console.log("Stats route hit", req.params, req.query); 
  try {
    const { teacherID } = req.params;
    const { date } = req.query;

    if (!teacherID) {
      return res.status(400).json({ message: 'teacherID is required' });
    }
    if (!date) {
      return res.status(400).json({ message: 'date query parameter is required (format: YYYY-MM-DD)' });
    }
    // Get all courses taught by this teacher
    const courses = await Course.findAll({
      where: { instructorID: teacherID }
    });

    if (courses.length === 0) {
      return res.status(404).json({ message: 'No courses found for this teacher' });
    }

    const courseIDs = courses.map(c => c.courseID);

    // Get total students enrolled in all these courses
    const totalStudents = await Enrollment.count({
      where: { courseID: { [Op.in]: courseIDs } },
      distinct: true,
      col: 'stdId'
    });

    // Get attendance records for these courses on the specified date
    const attendanceRecords = await Attendance.findAll({
      where: {
        courseID: { [Op.in]: courseIDs },
        timestamp: {
          [Op.between]: [
            new Date(date + 'T00:00:00Z'),
            new Date(date + 'T23:59:59Z')
          ]
        }
      }
    });

    // Count unique students present and absent on this date
    const uniqueStudents = new Set();
    let presentCount = 0;
    let absentCount = 0;

    for (const record of attendanceRecords) {
      uniqueStudents.add(record.stdId);
      if (record.status === 'present') {
        presentCount++;
      } else {
        absentCount++;
      }
    }

    // Calculate percentages like for all yeah
    const presentPercentage = totalStudents > 0 ? parseFloat((presentCount / totalStudents * 100).toFixed(2)) : 0;
    const absentPercentage = totalStudents > 0 ? parseFloat((absentCount / totalStudents * 100).toFixed(2)) : 0;

    return res.json({
      teacherID: parseInt(teacherID, 10),
      date,
      stats: {
        totalStudents,
        present: presentCount,
        absent: absentCount,
        presentPercentage,
        absentPercentage
      }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /attendance/:attId  (teacher can delete from their own courses)
router.delete('/:attId', teacherAuth, async (req, res) => {
  try {
    const { attId } = req.params;
    const teacherId = req.teacher.teacherId;

    if (!attId) {
      return res.status(400).json({ message: 'attId is required' });
    }

    const attendance = await Attendance.findByPk(attId);
    if (!attendance) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }

    // Get the course to verify teacher ownership
    const course = await Course.findByPk(attendance.courseID);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Verify teacher owns this course
    if (parseInt(course.instructorID, 10) !== parseInt(teacherId, 10)) {
      return res.status(403).json({ message: 'You can only delete attendance from your own courses' });
    }

    // Delete the attendance record
    await attendance.destroy();
    return res.json({ message: 'Attendance record deleted successfully', attId: parseInt(attId, 10) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// DEBUG: GET all CourseLocation records (temporary - remove after debugging)
router.get('/debug/locations', async (req, res) => {
  try {
    const locations = await CourseLocation.findAll();
    return res.json({ locations });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// DEBUG: DELETE CourseLocation record by courseID (temporary - remove after debugging)
router.delete('/debug/locations/:courseID', async (req, res) => {
  try {
    const { courseID } = req.params;
    const deleted = await CourseLocation.destroy({ where: { courseID } });
    return res.json({ message: `Deleted ${deleted} CourseLocation record(s) for courseID ${courseID}` });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});

export default router;

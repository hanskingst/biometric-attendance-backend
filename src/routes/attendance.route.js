import { Router } from "express";
import { Op } from "sequelize";
import sequelize from "../config/database.js";
import teacherAuth from "../middleware/teacherAuth.js";
import { Enrollment, Course, Attendance, CourseLocation, Student } from "../models/index.js";

const router = Router();

// Default school location (kept for backwards compatibility)
const DEFAULT_SCHOOL_LAT = 4.1533;
const DEFAULT_SCHOOL_LON = 9.2927;
// Radius enforced on server side (meters)
const RADIUS_METERS = 100;
// Minimum sample count before we infer a stable course location
const MIN_SAMPLES_TO_INFER = 5;

// Simple distance checker - accepts school coords (passed from frontend)
function isWithinRadius(userLat, userLon, schoolLat = DEFAULT_SCHOOL_LAT, schoolLon = DEFAULT_SCHOOL_LON) {
  const latDiff = Math.abs(userLat - schoolLat);
  const lonDiff = Math.abs(userLon - schoolLon);

  // Rough conversion: 0.0001 ≈ 11 meters (approximate, OK for short distances)
  const latMeters = latDiff * 111000;
  const lonMeters = lonDiff * 111000;

  const distance = Math.sqrt(latMeters ** 2 + lonMeters ** 2);

  return distance <= RADIUS_METERS;
}

router.post("/attendance", async (req, res) => {
  // Accept school coordinates from frontend: school_lat, school_lon (optional but recommended)
  const { stdId, courseID, fingerprinthash, latitude, longitude, school_lat, school_lon } = req.body;

  try {
    const isEnrolled = await Enrollment.findOne({
      where: { stdId, courseID }
    });

    if (!isEnrolled) {
      return res.status(403).json({ message: "Student not enrolled in this course" });
    }

    const course = await Course.findByPk(courseID);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // Location check (simple radius logic)
    if (!latitude || !longitude) {
      return res.status(400).json({ message: "Location is required" });
    }

    // Parse numeric values
    const userLat = parseFloat(latitude);
    const userLon = parseFloat(longitude);
    if (Number.isNaN(userLat) || Number.isNaN(userLon)) {
      return res.status(400).json({ message: 'Invalid latitude/longitude' });
    }

    // Determine authoritative school location for this course.
    // Prefer a stored CourseLocation (inferred from historical attendance). If none exists yet,
    // attempt to infer it from recent attendance samples (including this submission). If not enough
    // samples yet, we will accept the attendance and store it; inference will happen when enough
    // data is collected.
    let courseLoc = await CourseLocation.findOne({ where: { courseID } });
    let insideSchool = false;

    if (courseLoc) {
      insideSchool = isWithinRadius(userLat, userLon, parseFloat(courseLoc.schoolLat), parseFloat(courseLoc.schoolLon));
    } else {
      // gather recent attendance samples (lat/lon present)
      const recent = await Attendance.findAll({
        where: {
          courseID,
          latitude: { [Op.ne]: null },
          longitude: { [Op.ne]: null }
        },
        order: [['timestamp', 'DESC']],
        limit: MIN_SAMPLES_TO_INFER - 1
      });

      // include current sample
      const samples = [];
      for (const r of recent) {
        const lat = parseFloat(r.latitude);
        const lon = parseFloat(r.longitude);
        if (!Number.isNaN(lat) && !Number.isNaN(lon)) samples.push({ lat, lon });
      }
      samples.push({ lat: userLat, lon: userLon });

      if (samples.length >= MIN_SAMPLES_TO_INFER) {
        const sum = samples.reduce((acc, s) => { acc.lat += s.lat; acc.lon += s.lon; return acc; }, { lat: 0, lon: 0 });
        const avgLat = sum.lat / samples.length;
        const avgLon = sum.lon / samples.length;

        // persist inferred location for the course
        try {
          courseLoc = await CourseLocation.create({ courseID, schoolLat: avgLat, schoolLon: avgLon, samples: samples.length });
          insideSchool = isWithinRadius(userLat, userLon, avgLat, avgLon);
        } catch (e) {
          console.warn('Failed to persist inferred course location', e);
          // fallback: evaluate against default
          insideSchool = isWithinRadius(userLat, userLon, DEFAULT_SCHOOL_LAT, DEFAULT_SCHOOL_LON);
        }
      } else {
        // Not enough samples to infer; accept current attendance (store) and let future submissions build the sample set.
        insideSchool = true; // provisional acceptance until we infer
      }
    }
    const now = new Date();
    if (now < new Date(course.startTime) || now > new Date(course.endTime)) {
      return res.status(400).json({ message: "Attendance outside allowed time and outside school" });
    }

    if(!insideSchool){
      return res.status(400).json({message:"location outside school"});
    }

    //Fingerprint presence check (simple mock)
    let attendance;
    if (!fingerprinthash || fingerprinthash.length < 5) {
      // Biometric failed: record absent marked by system (do not reject)
      attendance = await Attendance.create({
        stdId,
        courseID,
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

    // Biometric succeeded
    attendance = await Attendance.create({
      stdId,
      courseID,
      fingerprinthash,
      latitude,
      longitude,
      timestamp: now,
      valid: true,
      status: 'present',
      markedBy: 'biometric',
      markedAt: now
    });

    return res.json({ message: "Attendance recorded", attendance });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

export default router;

// -- Additional endpoints --

// GET /attendance  (list with filters + pagination)
router.get('/', async (req, res) => {
  try {
    const { courseID, date, stdId, status } = req.query;
    let page = parseInt(req.query.page || '1', 10);
    let limit = parseInt(req.query.limit || '20', 10);
    if (Number.isNaN(page) || page < 1) page = 1;
    if (Number.isNaN(limit) || limit < 1) limit = 20;
    const where = {};
    if (!courseID) return res.status(400).json({ message: 'courseID is required' });
    where.courseID = courseID;
    if (stdId) where.stdId = stdId;
    if (status) where.status = status;
    if (date) {
      // filter by date (YYYY-MM-DD)
      where.timestamp = {
        [Op.between]: [new Date(date + 'T00:00:00Z'), new Date(date + 'T23:59:59Z')]
      };
    }

    const offset = (page - 1) * limit;
    const { count, rows } = await Attendance.findAndCountAll({ where, order: [['timestamp','DESC']], limit, offset });

    const totalPages = Math.ceil(count / limit) || 1;
    return res.json({ data: rows, meta: { page, limit, total: count, totalPages } });
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

// GET /attendance/analytics?courseID=1
router.get('/analytics', async (req, res) => {
  try {
    const { courseID } = req.query;
    if (!courseID) return res.status(400).json({ message: 'courseID is required' });

    const totalStudents = await Enrollment.count({ where: { courseID } });

    // group by date
    const rows = await sequelize.query(
      `SELECT date(timestamp) as date,
        SUM(CASE WHEN status='present' THEN 1 ELSE 0 END) as present,
        SUM(CASE WHEN status!='present' THEN 1 ELSE 0 END) as absent
       FROM Attendances
       WHERE courseID = :courseID
       GROUP BY date(timestamp)
       ORDER BY date(timestamp) ASC`,
      { replacements: { courseID }, type: sequelize.QueryTypes.SELECT }
    );

    const totalPresent = rows.reduce((s, r) => s + (parseInt(r.present, 10) || 0), 0);
    const days = rows.length || 1;
    const totalExpected = totalStudents * days || 1;
    const averageAttendance = Math.round((totalPresent / totalExpected) * 100);

    const byDate = rows.map(r => ({ date: r.date, present: parseInt(r.present, 10) || 0, absent: parseInt(r.absent, 10) || 0 }));

    return res.json({ totalStudents, averageAttendance, byDate });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});

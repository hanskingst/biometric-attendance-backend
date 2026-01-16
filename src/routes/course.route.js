import { Router } from "express";
import { Course, Teacher } from "../models/index.js";
import teacherAuth from "../middleware/teacherAuth.js";

const router = Router()


// POST /courses/course  
router.post('/course', teacherAuth, async (req, res) => {
    // Add these at the very beginning of your route handler
console.log('====== COURSE CREATION DEBUG ======');
console.log('1. Server current time (local):', new Date());
console.log('2. Server current time (ISO):', new Date().toISOString());
console.log('3. Server current year:', new Date().getFullYear());
console.log('4. Server current month:', new Date().getMonth());
console.log('5. Server current day:', new Date().getDate());
console.log('6. Received payload:', req.body);
console.log('====================================');

  const { title, startTime, endTime } = req.body;
  const instructorID = req.teacher.teacherId; 

  // Get timezone offset from request body (frontend sends this)
  // Default to 0 (UTC) if not provided
  const teacherTimezoneOffset = req.body.timezoneOffset || 0;
  
  console.log('Teacher timezone offset:', teacherTimezoneOffset, 'minutes');

  if (!title || !startTime || !endTime) {
    return res.status(400).json({ message: 'title, startTime, and endTime are required' });
  }

  // Validate time format - now expecting "HH:mm" format
  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
    return res.status(400).json({ message: 'Invalid time format. Use HH:mm' });
  }

  // Validate end time is after start time
  const [sH, sM] = startTime.split(':').map(Number);
  const [eH, eM] = endTime.split(':').map(Number);
  if (eH * 60 + eM <= sH * 60 + sM) {
    return res.status(400).json({ message: 'End time must be after start time' });
  }

  try {
    // Create the course with teacher's timezone offset
    const course = await Course.create({ 
      title, 
      startTime: startTime,  // Store as "HH:mm:ss" string (TIME type)
      endTime: endTime,      // Store as "HH:mm:ss" string (TIME type)
      instructorID,
      teacherTimezoneOffset  // Store the teacher's timezone offset
    });
    
    console.log('Course created with timezone offset:', course.teacherTimezoneOffset);
    
    res.status(201).json({ 
      message: "course registered successfully", 
      course: {
        ...course.toJSON(),
        // Don't send the timezone offset to frontend unless needed
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get all courses (with pagination) or courses for a specific teacher
router.get('/', async (req, res) => {
    try {
        const { teacherID } = req.query;
        let page = parseInt(req.query.page || '1', 10);
        let limit = parseInt(req.query.limit || '20', 10);
        if (Number.isNaN(page) || page < 1) page = 1;
        if (Number.isNaN(limit) || limit < 1) limit = 20;
        
        const where = {};
        if (teacherID) {
            where.instructorID = teacherID;
        }
        
        const offset = (page - 1) * limit;
        const { count, rows } = await Course.findAndCountAll({ where, limit, offset, order: [['courseID','ASC']] });
        const totalPages = Math.ceil(count / limit) || 1;
        
        if (teacherID) {
            return res.json({ teacherID: parseInt(teacherID, 10), data: rows, meta: { page, limit, total: count, totalPages } });
        }
        return res.json({ data: rows, meta: { page, limit, total: count, totalPages } });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error' });
    }
});

// GET /courses-with-teacher
// Same pagination + optional teacherID filter, but includes teacher name
router.get('/courses-with-teacher', async (req, res) => {
  try {
    const { teacherID } = req.query;
    let page = parseInt(req.query.page || '1', 10);
    let limit = parseInt(req.query.limit || '20', 10);

    if (Number.isNaN(page) || page < 1) page = 1;
    if (Number.isNaN(limit) || limit < 1) limit = 20;

    const where = {};
    if (teacherID) {
      where.instructorID = parseInt(teacherID, 10);
    }

    const offset = (page - 1) * limit;

    const { count, rows } = await Course.findAndCountAll({
      where,
      limit,
      offset,
      order: [['courseID', 'ASC']],
      include: [
        {
          model: Teacher,
          attributes: ['teacherId', 'name'], 
          required: true 
        }
      ]
    });

    const totalPages = Math.ceil(count / limit) || 1;

    // Format response - add teacher name to each course
    const formattedRows = rows.map(course => ({
      courseID: course.courseID,
      title: course.title,
      startTime: course.startTime,
      endTime: course.endTime,
      instructorID: course.instructorID,
      teacherName: course.Teacher?.name || 'Unknown', 
    }));

    // Response similar to what is above
    if (teacherID) {
      return res.json({
        teacherID: parseInt(teacherID, 10),
        data: formattedRows,
        meta: { page, limit, total: count, totalPages }
      });
    }

    return res.json({
      data: formattedRows,
      meta: { page, limit, total: count, totalPages }
    });

  } catch (error) {
    console.error('Error in /courses-with-teacher:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

export default router;
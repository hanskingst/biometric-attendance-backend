import { Router } from "express";
import { Course } from "../models/index.js";
import teacherAuth from "../middleware/teacherAuth.js";

const router = Router()


// POST /courses/course  

router.post('/course', teacherAuth, async (req, res) => {
  const { title, startTime, endTime } = req.body;
  const instructorID = req.teacher.teacherId; 

  if (!title || !startTime || !endTime) {
    return res.status(400).json({ message: 'title, startTime, and endTime are required' });
  }

  try {
    const course = await Course.create({ title, startTime, endTime, instructorID });
    res.status(201).json({ message: "course registered successfully", course });
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

export default router;
import { Router } from "express";
import { Enrollment } from "../models/index.js";

const router = Router()

// Enroll a student in a course
router.post('/', async (req,res)=>{
   try {
    const {stdId, courseID} = req.body;
    const alreadyEnrolled = await Enrollment.findOne({where:{stdId,courseID}});
    if(alreadyEnrolled) return res.status(400).json({ message: "Already enrolled" });

    const enrollement = await Enrollment.create({stdId,courseID});
    res.status(201).json({message:"Enrolled successfully",enrollement});
   } catch (error) {
     console.error(error);
    res.status(500).json({ message: "Server error" });
   }
});

// GET /enrollments?courseID=1  -> list students for a course (name/email/stdId)
router.get('/', async (req, res) => {
   try {
      const { courseID } = req.query;
      if (!courseID) return res.status(400).json({ message: 'courseID is required' });

      // Prefer using Course include to leverage many-to-many association
      const CourseModel = (await import('../models/course.model.js')).default;
      const StudentModel = (await import('../models/student.model.js')).default;

      const course = await CourseModel.findByPk(courseID, {
         include: [{ model: StudentModel, attributes: ['stdId', 'name', 'email'] }]
      });

      if (!course) return res.status(404).json({ message: 'Course not found' });

      // course.Students will be an array of student objects
      const students = (course.Students || []).map(s => ({ stdId: s.stdId, name: s.name, email: s.email }));
      return res.json({ courseID: courseID, students, total: students.length });
   } catch (err) {
      console.error(err);
      return res.status(500).json({ message: 'Server error' });
   }
});

export default router
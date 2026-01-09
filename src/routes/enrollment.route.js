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

// GET /enrollments/course/:courseID  -> list students for a course (name/email/stdId) with total count
router.get('/course/:courseID', async (req, res) => {
   try {
      const { courseID } = req.params;

      
      const CourseModel = (await import('../models/course.model.js')).default;
      const StudentModel = (await import('../models/student.model.js')).default;

      const course = await CourseModel.findByPk(courseID, {
         include: [{ model: StudentModel, attributes: ['stdId', 'name', 'email'] }]
      });

      if (!course) return res.status(404).json({ message: 'Course not found' });

      // course.Students is be an array of student objects
      const students = (course.Students || []).map(s => ({ stdId: s.stdId, name: s.name, email: s.email }));
      const totalStudents = students.length;
      return res.json({ courseID: parseInt(courseID, 10), students, totalStudents });
   } catch (err) {
      console.error(err);
      return res.status(500).json({ message: 'Server error' });
   }
});

// GET /enrollments/student/:stdId  -> list courses for a student
router.get('/student/:stdId', async (req, res) => {
   try {
      const { stdId } = req.params;

      // Import models
      const StudentModel = (await import('../models/student.model.js')).default;
      const CourseModel = (await import('../models/course.model.js')).default;

      const student = await StudentModel.findByPk(stdId, {
         include: [{ model: CourseModel, attributes: ['courseID', 'title', 'instructorID', 'startTime', 'endTime'] }]
      });

      if (!student) return res.status(404).json({ message: 'Student not found' });

      // student.Courses will be an array of course objects
      const courses = (student.Courses || []).map(c => ({ courseID: c.courseID, title: c.title, instructorID: c.instructorID, startTime: c.startTime, endTime: c.endTime }));
      return res.json({ stdId: parseInt(stdId, 10), courses });
   } catch (err) {
      console.error(err);
      return res.status(500).json({ message: 'Server error' });
   }
});

export default router
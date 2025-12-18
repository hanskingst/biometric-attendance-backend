import { Router } from "express";
import { Course } from "../models/index.js";

const router = Router()

// Create a new course
router.post('/course',async (req,res)=>{

        const {title,startTime,endTime,instructorID} = req.body;
        try {

                const course = await Course.create({title,startTime,endTime,instructorID});
                res.status(201).json({message:"course registered successfully",course});
        
        } catch (error) {
                    console.error(error);
                    res.status(500).json({ message: "Server error" });
        }

});

// Get all courses
router.get('/', async (req, res) => {
    try {
        const courses = await Course.findAll({ include: [] });
        return res.json({ courses });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error' });
    }
});

export default router;
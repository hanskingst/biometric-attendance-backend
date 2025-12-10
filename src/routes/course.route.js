import { Router } from "express";
import { Course } from "../models/index.js";

const router = Router()

router.post('/courses',async (req,res)=>{

    const {title,startTime,endTime,instructorID} = req.body;
    try {

        const course = await Course.create({title,startTime,endTime,instructorID});
        res.status(201).json({message:"course registered successfully",course});
        
    } catch (error) {
          console.error(err);
    res.status(500).json({ message: "Server error" });
    }

});

export default router;
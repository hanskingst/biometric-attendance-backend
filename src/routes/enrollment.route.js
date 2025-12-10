import { Router } from "express";
import { Enrollment } from "../models/index.js";

const router = Router()

router.post('/enrollement', async (req,res)=>{
   try {
    const {stdId, courseID} = req.body;
    const alreadyEnrolled = await Enrollment.findOne({where:{stdId,courseID}});
    if(alreadyEnrolled) return res.status(400).json({ message: "Already enrolled" });

    const enrollement =await Enrollment.create({stdId,courseID});
    res.status(201).json({message:"Enrolled successfully",enrollement});
   } catch (error) {
     console.error(err);
    res.status(500).json({ message: "Server error" });
   }
});

export default router
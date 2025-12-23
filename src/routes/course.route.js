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

// Get all courses (with pagination)
router.get('/', async (req, res) => {
    try {
        let page = parseInt(req.query.page || '1', 10);
        let limit = parseInt(req.query.limit || '20', 10);
        if (Number.isNaN(page) || page < 1) page = 1;
        if (Number.isNaN(limit) || limit < 1) limit = 20;
        const offset = (page - 1) * limit;
        const { count, rows } = await Course.findAndCountAll({ limit, offset, order: [['courseID','ASC']] });
        const totalPages = Math.ceil(count / limit) || 1;
        return res.json({ data: rows, meta: { page, limit, total: count, totalPages } });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error' });
    }
});

export default router;
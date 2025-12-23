import { Router } from "express";
import { Student } from "../models/index.js";

const router = Router();

// Get all students (with pagination)
router.get('/', async (req, res) => {
  try {
    let page = parseInt(req.query.page || '1', 10);
    let limit = parseInt(req.query.limit || '20', 10);
    if (Number.isNaN(page) || page < 1) page = 1;
    if (Number.isNaN(limit) || limit < 1) limit = 20;
    const offset = (page - 1) * limit;
    const { count, rows } = await Student.findAndCountAll({ attributes: ['stdId','name','email'], limit, offset });
    const totalPages = Math.ceil(count / limit) || 1;
    return res.json({ data: rows, meta: { page, limit, total: count, totalPages } });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
});

router.post('/register',async (req,res)=>{
    try {

        const {name,email,password} = req.body;
        if(!name || !email || !password){
            return res.status(400).json({message:"All fields are required"});
        }

        const existingUser = await Student.findOne({where:{email}});
        if(existingUser){
            return res.status(400).json({message:"Email already registered"});
        }

        const student = await Student.create({name,email,password});

        res.status(201).json({message:"Student created successfully",student});
        
    } catch (error) {
        console.error(error);
        res.status(500).json({message:"internal server error"});
    }
});


router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
     const student = await Student.findOne({ 
      where: { email },
      attributes: ['stdId', 'name', 'email', 'password']
    });

    if (!student) return res.status(404).json({ message: "Student not found" });


    const storedPassword = student.password;

    if (storedPassword === password) {
         const { password: _, ...studentData } = student.toJSON();
      return res.json({ message: "Login successful", student: studentData });
    } else {
      return res.status(401).json({ message: "Incorrect password" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});


export default router;
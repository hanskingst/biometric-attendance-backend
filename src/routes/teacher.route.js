import { Router } from "express";
import { Teacher } from "../models/index.js";

const router = Router()

// Get all teachers (with pagination)
router.get('/', async (req, res) => {
  try {
    let page = parseInt(req.query.page || '1', 10);
    let limit = parseInt(req.query.limit || '20', 10);
    if (Number.isNaN(page) || page < 1) page = 1;
    if (Number.isNaN(limit) || limit < 1) limit = 20;
    const offset = (page - 1) * limit;
    const { count, rows } = await Teacher.findAndCountAll({ attributes: ['teacherId','name','email'], limit, offset });
    const totalPages = Math.ceil(count / limit) || 1;
    return res.json({ data: rows, meta: { page, limit, total: count, totalPages } });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
});
// sign up logic
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existing = await Teacher.findOne({ where: { email } });
    if (existing) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const teacher = await Teacher.create({ name, email, password });
    res.status(201).json({ message: "Teacher registered successfully", teacher });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// signin logic
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
     const teacher = await Teacher.findOne({ 
      where: { email },
      attributes: ['teacherId', 'name', 'email', 'password']
    });

    if (!teacher) return res.status(404).json({ message: "Teacher not found" });


    const storedPassword = teacher.password;

    if (storedPassword === password) {
         const { password: _, ...teacherData } = teacher.toJSON();
      return res.json({ message: "Login successful", student: teacherData });
    } else {
      return res.status(401).json({ message: "Incorrect password" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
import { Router } from "express";

const router = Router();

import studentRoute from "./student.route.js";
import teacherRoute from "./teacher.route.js";
import enrollmentRoute from "./enrollment.route.js";
import attendanceRoute from "./attendance.route.js";
import courseRoute from "./course.route.js";
import adminRoute from "./admin.route.js";
import docsRoute from "./docs.route.js";

router.use('/students', studentRoute);
router.use('/teachers', teacherRoute);
router.use('/courses', courseRoute);
router.use('/enrollments', enrollmentRoute);
router.use('/attendance',attendanceRoute);

// admin dashboard
router.use('/admin', adminRoute);

// API docs (public, non-admin)
router.use('/docs', docsRoute);

export default router;

import { Router } from "express";

const router = Router();

import studentRoute from "./student.route.js";
import teacherRoute from "./teacher.route.js";
// import attendanceRoute from "./attendance.route.js";
// import courseRoute from "./course.route.js";

router.use('/students',studentRoute);
 router.use('/teachers',teacherRoute);
// router.use('/courses',courseRoute);
// router.use('/attendance',attendanceRoute);

export default router;
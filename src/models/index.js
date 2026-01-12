import sequelize from "../config/database.js";
import Student from "./student.model.js";
import Teacher from "./teacher.model.js";
import Course from "./course.model.js";
import Attendance from "./attendance.model.js";
import Enrollment from "./enrollment.model.js";
import CourseLocation from "./courseLocation.model.js";
import AttendanceSession from "./attendanceSession.model.js";

const syncDB = async () => {
  try {
    const forceSync = process.env.FORCE_SYNC === "true";
    const dialect = process.env.DB_DIALECT || "sqlite";
    
    // For SQLite with alter: true, we need to disable foreign keys temporarily
    if (dialect === "sqlite" && !forceSync) {
      await sequelize.query("PRAGMA foreign_keys = OFF");
    }
    
    const syncOptions = forceSync 
      ? { force: true }  // Destructive: drop and recreate tables
      : { alter: true }; // Safe: alter tables to match models
    
    await sequelize.sync(syncOptions);
    
    // Re-enable foreign keys
    if (dialect === "sqlite" && !forceSync) {
      await sequelize.query("PRAGMA foreign_keys = ON");
    }
    
    console.log("All models synced successfully!", { forceSync, alter: !forceSync });
  } catch (error) {
    console.error("Error syncing models:", error);
  }
};

export { syncDB, Student, Teacher, Course, Enrollment, Attendance, CourseLocation, AttendanceSession };

import sequelize from "../config/database.js";
import Student from "./student.model.js";
import Teacher from "./teacher.model.js";
import Course from "./course.model.js";
import Attendance from "./attendance.model.js";
import Enrollment from "./enrollment.model.js";
import CourseLocation from "./courseLocation.model.js";

const syncDB = async () => {
  try {
    const forceSync = process.env.FORCE_SYNC === "true";
    await sequelize.sync({ force: forceSync });
    console.log("All models synced successfully!", { forceSync });
  } catch (error) {
    console.error("Error syncing models:", error);
  }
};

export { syncDB, Student, Teacher, Course, Enrollment, Attendance, CourseLocation };

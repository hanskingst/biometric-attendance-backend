import sequelize from "../config/database.js";
import Student from "./student.model.js";
import Teacher from "./teacher.model.js";
import Course from "./course.model.js";
import Attendance from "./attendance.model.js";
import Enrollment from "./enrollment.model.js";

const syncDB = async () => {
  try {
    await sequelize.sync({ force: true }); 
    console.log("All models synced successfully!");
  } catch (error) {
    console.error("Error syncing models:", error);
  }
};

export { syncDB, Student, Teacher, Course, Enrollment, Attendance };

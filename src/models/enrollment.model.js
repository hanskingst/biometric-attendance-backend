import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import Student from "./student.model.js";
import Course from "./course.model.js";

const Enrollment = sequelize.define("Enrollment", {
  EnrolId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement:true,
  },
});

// Relationships: Many-to-Many Student  Course
Student.belongsToMany(Course, { through: Enrollment, foreignKey: "stdId" });
Course.belongsToMany(Student, { through: Enrollment, foreignKey: "courseID" });

export default Enrollment;

import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import Teacher from "./teacher.model.js";

const Course = sequelize.define("Course", {
  courseID: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  instructorID: {
    type: DataTypes.INTEGER,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  startTime: {
    type: DataTypes.TIME,  // Changed from STRING(5) to TIME
    allowNull: false,
  },
  endTime: {
    type: DataTypes.TIME,  // Changed from STRING(5) to TIME
    allowNull: false,
  },
  teacherTimezoneOffset: {  // ADD THIS FIELD
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,  // Default to UTC (0 minutes offset)
    comment: "Teacher's timezone offset in minutes from UTC when session was created"
  },
});

// relationships between course and teacher
Course.belongsTo(Teacher, { foreignKey: "instructorID", onDelete: "CASCADE", onUpdate: "CASCADE" });
Teacher.hasMany(Course, { foreignKey: "instructorID", onDelete: "CASCADE", onUpdate: "CASCADE" });

export default Course;
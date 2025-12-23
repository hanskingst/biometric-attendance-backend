import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import Student from "./student.model.js";
import Course from "./course.model.js";

const Attendance = sequelize.define("Attendance", {
  attId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement:true,
  },
  stdId:{
     type:DataTypes.INTEGER,
     allowNull:false,
  },
  courseID:{
    type:DataTypes.INTEGER,
    allowNull:false,
  },
  fingerprinthash: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  timestamp:{
    type:DataTypes.DATE,
    allowNull:false,
  },
  latitude: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  longitude: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  valid: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  // New fields for status, audit and teacher overrides
  status: {
    type: DataTypes.ENUM('present', 'absent', 'manual'),
    defaultValue: 'absent',
  },
  markedBy: {
    type: DataTypes.ENUM('biometric', 'teacher', 'system'),
    defaultValue: 'system',
  },
  markedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  teacherId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
});

// Relationships: Attendance belongs to Student and Course
Attendance.belongsTo(Student, { foreignKey: "stdId" });
Student.hasMany(Attendance, { foreignKey: "stdId" });

Attendance.belongsTo(Course, { foreignKey: "courseID" });
Course.hasMany(Attendance, { foreignKey: "courseID" });

export default Attendance;

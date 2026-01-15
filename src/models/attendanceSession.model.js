import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import Course from "./course.model.js";
import Teacher from "./teacher.model.js";
import Attendance from "./attendance.model.js";

const AttendanceSession = sequelize.define("AttendanceSession", {
  sessionId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  courseID: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  teacherId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  openedAt: {
    type: DataTypes.STRING(5),
    allowNull: false,
  },
  closedAt: {
    type: DataTypes.STRING(5),
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM("open", "closed"),
    defaultValue: "closed",
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
});

// Associations
AttendanceSession.belongsTo(Course, { foreignKey: "courseID",onDelete: "CASCADE", onUpdate: "CASCADE", });
Course.hasMany(AttendanceSession, { foreignKey: "courseID",onDelete: "CASCADE", onUpdate: "CASCADE", });

AttendanceSession.belongsTo(Teacher, { foreignKey: "teacherId",onDelete: "CASCADE", onUpdate: "CASCADE", });
Teacher.hasMany(AttendanceSession, { foreignKey: "teacherId",onDelete: "CASCADE", onUpdate: "CASCADE", });

// Link sessions to attendance records
Attendance.belongsTo(AttendanceSession, { foreignKey: "sessionId",onDelete: "CASCADE", onUpdate: "CASCADE",});
AttendanceSession.hasMany(Attendance, { foreignKey: "sessionId",onDelete: "CASCADE", onUpdate: "CASCADE", });

export default AttendanceSession;

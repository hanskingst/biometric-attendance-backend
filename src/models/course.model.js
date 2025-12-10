import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import Teacher from "./teacher.model.js";

const Course = sequelize.define("Course", {
  courseID: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement:true
  },
  instructorID:{
    type:DataTypes.INTEGER,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  startTime: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  endTime: {
    type: DataTypes.DATE,
    allowNull: false,
  },
});

// relationships between course and teacher
Course.belongsTo(Teacher,{foreignKey:"instructorID"});
Teacher.hasMany(Course,{foreignKey:"instructorID"});

export default Course;

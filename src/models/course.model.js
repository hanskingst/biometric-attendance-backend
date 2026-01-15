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
    type: DataTypes.STRING(5),
    allowNull: false,
  },
  endTime: {
    type: DataTypes.STRING(5),
    allowNull: false,
  },
});

// relationships between course and teacher
Course.belongsTo(Teacher,{foreignKey:"instructorID",onDelete:"CASCADE",onUpdate:"CASCADE",});
Teacher.hasMany(Course,{foreignKey:"instructorID",onDelete:"CASCADE",onUpdate:"CASCADE"});

export default Course;

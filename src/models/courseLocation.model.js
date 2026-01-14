import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import Course from "./course.model.js";

const CourseLocation = sequelize.define("CourseLocation", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  courseID: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
  },
  schoolLat: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  schoolLon: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  samples: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
});

CourseLocation.belongsTo(Course, {
  foreignKey: "courseID",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});
Course.hasOne(CourseLocation, {
  foreignKey: "courseID",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});


export default CourseLocation;

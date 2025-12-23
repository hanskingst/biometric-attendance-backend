import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

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

export default CourseLocation;

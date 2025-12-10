import { Sequelize } from "sequelize";

const sequelize = new Sequelize(
  process.env.DB_NAME || "attendance_db",
  process.env.DB_USER || "root",
  process.env.DB_PASSWORD || "",
  {
    host: process.env.DB_HOST || "localhost",
    dialect: process.env.DB_DIALECT || "sqlite", 
    storage: "./database.sqlite", 
    logging: false,
  }
);

export default sequelize;

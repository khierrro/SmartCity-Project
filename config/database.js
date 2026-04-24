const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: false, // supaya tidak banjir log SQL di console, bisa diaktifkan untuk debugging
    define: {
      timestamps: false, // karena kita pakai created_at manual
      freezeTableName: true, // agar nama model = nama tabel
    },
  }
);

module.exports = sequelize;
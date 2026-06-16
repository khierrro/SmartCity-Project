const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Session = sequelize.define('Session', {
  sid: {
    type: DataTypes.STRING(36),
    primaryKey: true,
  },
  expires: DataTypes.DATE,
  data: DataTypes.TEXT,
}, {
  tableName: 'Sessions',
  timestamps: false,
});

module.exports = Session;
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ReportFlag = sequelize.define('ReportFlag', {
  id:         { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id:    { type: DataTypes.INTEGER, allowNull: false },
  report_id:  { type: DataTypes.INTEGER, allowNull: false },
  reason:     { type: DataTypes.STRING(255), allowNull: true },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, {
  tableName: 'report_flags',
  timestamps: false,
  underscored: true,
});

// Associations (add in models/index.js or right here)
// ReportFlag.belongsTo(User, { foreignKey: 'user_id' });
// Report.hasMany(ReportFlag, { foreignKey: 'report_id' });

module.exports = ReportFlag;
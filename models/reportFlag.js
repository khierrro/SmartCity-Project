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

// Associations setup
ReportFlag.associate = (models) => {
  ReportFlag.belongsTo(models.users, { foreignKey: 'user_id', as: 'User' });
  ReportFlag.belongsTo(models.Report, { foreignKey: 'report_id' });
};

module.exports = ReportFlag;
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const UserReportVote = sequelize.define('UserReportVote', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  report_id: { type: DataTypes.INTEGER, allowNull: false },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
  tableName: 'user_report_votes',
  timestamps: false,
  underscored: true
});

UserReportVote.associate = (models) => {
  UserReportVote.belongsTo(models.users, { foreignKey: 'user_id' });
  UserReportVote.belongsTo(models.Report, { foreignKey: 'report_id' });
};

module.exports = UserReportVote;
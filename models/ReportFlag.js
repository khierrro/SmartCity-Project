'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ReportFlag = sequelize.define('ReportFlag', {
  report_id: { type: DataTypes.INTEGER, allowNull: false },
  user_id:   { type: DataTypes.INTEGER, allowNull: false },
  reason:    { type: DataTypes.STRING(255), allowNull: true },
}, {
  tableName: 'report_flags',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
});

// Associations
ReportFlag.associate = (models) => {
  ReportFlag.belongsTo(models.Report, { foreignKey: 'report_id' });
  ReportFlag.belongsTo(models.User,   { foreignKey: 'user_id', as: 'User' });
};

// ── Hooks to keep Report.flagged in sync ──
ReportFlag.afterCreate(async (flag) => {
  // Access the Report model via sequelize.models to avoid circular require
  await sequelize.models.Report.update(
    { flagged: true },
    { where: { id: flag.report_id } }
  );
});

ReportFlag.afterDestroy(async (flag) => {
  const remaining = await ReportFlag.count({
    where: { report_id: flag.report_id }
  });
  if (remaining === 0) {
    await sequelize.models.Report.update(
      { flagged: false },
      { where: { id: flag.report_id } }
    );
  }
});

module.exports = ReportFlag;

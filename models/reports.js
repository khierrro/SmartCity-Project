const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Report = sequelize.define('Report', {
  title: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  image_path: DataTypes.STRING(255),
  location_text: DataTypes.STRING(255),
  latitude: DataTypes.DECIMAL(10, 8),
  longitude: DataTypes.DECIMAL(11, 8),
  status: {
    type: DataTypes.ENUM('new', 'in_progress', 'resolved', 'hidden'),
    defaultValue: 'new'
  },
  flagged: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  vote_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: 'reports',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

Report.associate = function(models) {
  Report.belongsTo(models.users, { foreignKey: 'user_id' }); // <-- models.users, bukan models.User
  Report.belongsTo(models.Facility, { foreignKey: 'facility_id' });
};

module.exports = Report;
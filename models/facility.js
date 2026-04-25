const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Facility = sequelize.define('Facility', {
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  // tambahkan kolom lain jika diperlukan (type, address, dll.)
  type: {
    type: DataTypes.STRING(50)
  },
  address: {
    type: DataTypes.TEXT
  },
  phone: {
    type: DataTypes.STRING(20)
  },
  operating_hours: {
    type: DataTypes.STRING(100)
  },
  image_path: {
    type: DataTypes.STRING(255)
  },
  latitude: {
    type: DataTypes.DECIMAL(10, 8)
  },
  longitude: {
    type: DataTypes.DECIMAL(11, 8)
  }
}, {
  tableName: 'facilities',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

Facility.associate = function(models) {
  Facility.hasMany(models.Report, { foreignKey: 'facility_id' });
};

module.exports = Facility;
'use strict';
module.exports = (sequelize, DataTypes) => {
  const Comment = sequelize.define('Comment', {
    id:        { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    report_id: { type: DataTypes.INTEGER, allowNull: false },
    user_id:   { type: DataTypes.INTEGER, allowNull: true },
    parent_id: { type: DataTypes.INTEGER, allowNull: true },
    content:   { type: DataTypes.TEXT,    allowNull: false },
    likes:     { type: DataTypes.INTEGER, defaultValue: 0 },
    is_edited: { type: DataTypes.BOOLEAN, defaultValue: false },
  }, {
    tableName:  'comments',
    timestamps: true,
    createdAt:  'created_at',
    updatedAt:  'updated_at',
  });
 
  Comment.associate = (models) => {
    Comment.belongsTo(models.Report,   { foreignKey: 'report_id' });
    Comment.belongsTo(models.users,    { foreignKey: 'user_id',  as: 'Author' });
    Comment.belongsTo(Comment,         { foreignKey: 'parent_id',as: 'Parent' });
    Comment.hasMany(Comment,           { foreignKey: 'parent_id',as: 'Replies' });
  };
 
  return Comment;
};
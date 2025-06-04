const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Folder = sequelize.define(
    'Folder',
    {
      _id: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        index: true,
      },
      createdAt: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      updatedAt: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      createdBy: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      updatedBy: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      tableName: 'folders',
      timestamps: false,
    }
  );

  return Folder;
};

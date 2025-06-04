const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Upload = sequelize.define(
    'Upload',
    {
      _id: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false,
      },
      user: {
        type: DataTypes.JSON,
      },
      remark: {
        type: DataTypes.TEXT,
      },
      size: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      filename: {
        type: DataTypes.STRING,
        allowNull: false,
        index: true,
      },
      folderId: {
        type: DataTypes.STRING,
        allowNull: false,
        index: true,
      },
      mimetype: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      originalname: {
        type: DataTypes.STRING,
        allowNull: false,
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
      tags: {
        type: DataTypes.JSON,
      },
    },
    {
      tableName: 'uploads',
      timestamps: false,
    }
  );

  return Upload;
};

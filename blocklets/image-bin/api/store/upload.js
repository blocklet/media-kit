const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Upload = sequelize.define(
    'Upload',
    {
      id: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false,
        defaultValue: DataTypes.UUIDV4,
      },
      // for backward compatibility
      _id: {
        type: DataTypes.VIRTUAL,
        get() {
          return this.getDataValue('id');
        },
      },
      user: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      remark: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      size: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      filename: {
        type: DataTypes.STRING,
        allowNull: true,
        index: true,
      },
      folderId: {
        type: DataTypes.STRING,
        allowNull: true,
        index: true,
      },
      mimetype: {
        type: DataTypes.STRING,
        allowNull: true,
        index: true,
      },
      originalname: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      createdAt: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      updatedAt: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      createdBy: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      updatedBy: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      tags: {
        type: DataTypes.JSON,
      },
    },
    {
      tableName: 'uploads',
      timestamps: false,
      indexes: [
        {
          fields: ['filename'],
        },
        {
          fields: ['folderId'],
        },
        {
          fields: ['mimetype'],
        },
        {
          fields: ['createdBy'],
        },
        {
          fields: ['createdAt'],
        },
        {
          fields: ['updatedAt'],
        },
      ],
    }
  );

  return Upload;
};

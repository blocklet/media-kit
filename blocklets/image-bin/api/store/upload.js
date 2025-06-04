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
      },
      remark: {
        type: DataTypes.STRING,
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
        index: true,
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

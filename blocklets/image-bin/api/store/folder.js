const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Folder = sequelize.define(
    'Folder',
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
      name: {
        type: DataTypes.STRING,
        index: true,
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
    },
    {
      tableName: 'folders',
      timestamps: false,
      indexes: [
        {
          fields: ['name'],
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

  return Folder;
};

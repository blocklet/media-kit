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

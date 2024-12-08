const { sequelize, DataTypes } = require("../lib/index");

const department = sequelize.define("departments", {
  name: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
  },
});

module.exports = { department };

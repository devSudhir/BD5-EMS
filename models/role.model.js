const { sequelize, DataTypes } = require("../lib/index");
const role = sequelize.define("roles", {
  title: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
  },
});

module.exports = { role };

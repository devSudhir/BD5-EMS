const sq = require("sequelize");
const sequelize = new sq.Sequelize({
  dialect: "sqlite",
  storage: "./database.sqlite",
});

module.exports = { sequelize, DataTypes: sq.DataTypes };
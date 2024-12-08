const { sequelize, DataTypes } = require("../lib/index");
const { employee } = require("./employee.model");
const { role } = require("./role.model");

const employeeRole = sequelize.define("employee_role", {
  employeeId: {
    type: DataTypes.INTEGER,
    references: {
      model: employee,
      key: "id",
    },
    allowNull: false,
  },
  roleId: {
    type: DataTypes.INTEGER,
    references: {
      model: role,
      key: "id",
    },
    allowNull: false,
  },
});

employee.belongsToMany(role, { through: employeeRole });
role.belongsToMany(employee, { through: employeeRole });

module.exports = { employeeRole };

const { sequelize, DataTypes } = require("../lib/index");
const { employee } = require("./employee.model");
const { department } = require("./department.model");

const employeeDepartment = sequelize.define("employee_department", {
  employeeId: {
    type: DataTypes.INTEGER,
    references: {
      model: employee,
      key: "id",
    },
    allowNull: false,
  },
  departmentId: {
    type: DataTypes.INTEGER,
    references: {
      model: department,
      key: "id",
    },
    allowNull: false,
  },
});

employee.belongsToMany(department, { through: employeeDepartment });
department.belongsToMany(employee, { through: employeeDepartment });

module.exports = { employeeDepartment };

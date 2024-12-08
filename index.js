const express = require("express");
const cors = require("cors");
const { sequelize } = require("./lib/index");
const { employee } = require("./models/employee.model");
const { department } = require("./models/department.model");
const { role } = require("./models/role.model");
const { employeeDepartment } = require("./models/employeeDepartment.model");
const { employeeRole } = require("./models/employeeRole.model");
const { Op } = require("sequelize");

const app = express();
const PORT = 3010;

app.use(express.json());
app.use(cors());

app.get("/", async (req, res) => {
  res.status(200).send("Now you are accessing BD5-EMS Backend");
});

// Endpoint to seed database
app.get("/seed_db", async (req, res) => {
  await sequelize.sync({ force: true });

  const departments = await department.bulkCreate([
    { name: "Engineering" },
    { name: "Marketing" },
  ]);

  const roles = await role.bulkCreate([
    { title: "Software Engineer" },
    { title: "Marketing Specialist" },
    { title: "Product Manager" },
  ]);

  const employees = await employee.bulkCreate([
    { name: "Rahul Sharma", email: "rahul.sharma@example.com" },
    { name: "Priya Singh", email: "priya.singh@example.com" },
    { name: "Ankit Verma", email: "ankit.verma@example.com" },
  ]);

  // Associate employees with departments and roles using create method on junction models
  await employeeDepartment.create({
    employeeId: employees[0].id,
    departmentId: departments[0].id,
  });
  await employeeRole.create({
    employeeId: employees[0].id,
    roleId: roles[0].id,
  });

  await employeeDepartment.create({
    employeeId: employees[1].id,
    departmentId: departments[1].id,
  });
  await employeeRole.create({
    employeeId: employees[1].id,
    roleId: roles[1].id,
  });

  await employeeDepartment.create({
    employeeId: employees[2].id,
    departmentId: departments[0].id,
  });
  await employeeRole.create({
    employeeId: employees[2].id,
    roleId: roles[2].id,
  });

  return res.json({ message: "Database seeded!" });
});

async function fetchAllEmployees() {
  return await employee.findAll();
}

async function fetchAllDepartments() {
  return await department.findAll();
}

async function fetchAllRoles() {
  return await role.findAll();
}

async function fetchEmployeeDepartments() {
  return await employeeDepartment.findAll();
}

async function fetchEmployeeRoles() {
  return await employeeRole.findAll();
}

app.get("/records/all", async (req, res) => {
  try {
    const employees = await fetchAllEmployees();
    const departments = await fetchAllDepartments();
    const roles = await fetchAllRoles();
    const employeeDepartments = await fetchEmployeeDepartments();
    const employeeRoles = await fetchEmployeeRoles();

    res.status(200).json({
      employees,
      departments,
      roles,
      employeeDepartments,
      employeeRoles,
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});

//Helper functions

async function getEmployeeRoles(employeeId) {
  const empRoles = await employeeRole.findAll({
    where: { employeeId },
  });

  const roleIds = empRoles.map((ele) => ele.roleId);
  const empRoleDetails = await role.findAll({
    where: {
      id: {
        [Op.in]: [...roleIds],
      },
    },
  });
  return empRoleDetails;
}

async function getEmployeeDepartments(employeeId) {
  const empDepartments = await employeeDepartment.findAll({
    where: { employeeId },
  });
  const departmentIds = empDepartments.map((ele) => ele.departmentId);
  const empDepartmentDetails = await department.findAll({
    where: {
      id: {
        [Op.in]: [...departmentIds],
      },
    },
  });
  return empDepartmentDetails;
}

async function getEmployeeDetails(employeeData) {
  const departments = await getEmployeeDepartments(employeeData.id);
  const roles = await getEmployeeRoles(employeeData.id);

  return {
    ...employeeData.dataValues,
    department: departments.length === 0 ? {} : departments[0],
    role: roles.length === 0 ? {} : roles[0],
  };
}

app.get("/employees", async (req, res) => {
  try {
    const employees = await fetchAllEmployees();
    const response = [];
    for (let emp of employees) {
      const employeeDetails = await getEmployeeDetails(emp);
      response.push(employeeDetails);
    }
    if (response == undefined || response == null || response.length === 0) {
      return res.status(404).json({ error: "Employee details not found!" });
    } else {
      return res.status(200).json({ employees: response });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

async function getEmployeeDetailsById(empId) {
  const response = await employee.findOne({
    where: { id: empId },
  });
  return response;
}

app.get("/employees/details/:empId", async (req, res) => {
  const empId = parseInt(req.params.empId);
  try {
    const employee = await getEmployeeDetailsById(empId);
    if (employee == undefined || employee == null) {
      return res.status(404).json({ error: "Employee details not found!" });
    } else {
      const employeeDetails = await getEmployeeDetails(employee);
      return res.status(200).json({ employee: employeeDetails });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

async function getEmployeesOfDepartmentId(departmentId) {
  const employeesOfDepartment = await employeeDepartment.findAll({
    where: { departmentId },
  });
  const employeeIds = employeesOfDepartment.map((ele) => ele.employeeId);
  const employeesOfDepartmentDetails = await employee.findAll({
    where: {
      id: {
        [Op.in]: [...employeeIds],
      },
    },
  });
  return employeesOfDepartmentDetails;
}

app.get("/employees/department/:departmentId", async (req, res) => {
  const departmentId = parseInt(req.params.departmentId);
  try {
    const response = await getEmployeesOfDepartmentId(departmentId);
    if (response == undefined || response == null || response.length === 0) {
      return res
        .status(404)
        .json({ error: "Employee details related to department not found!" });
    } else {
      const employeeDetails = [];
      for (let emp of response) {
        employeeDetails.push(await getEmployeeDetails(emp));
      }
      return res.status(200).json({ employees: employeeDetails });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

async function getEmployeesOfRoleId(roleId) {
  const employeesOfRole = await employeeRole.findAll({
    where: { roleId },
  });
  const employeeIds = employeesOfRole.map((ele) => ele.employeeId);
  const employeesOfRoleDetails = await employee.findAll({
    where: {
      id: {
        [Op.in]: [...employeeIds],
      },
    },
  });
  return employeesOfRoleDetails;
}

app.get("/employees/role/:roleId", async (req, res) => {
  const roleId = parseInt(req.params.roleId);
  try {
    const response = await getEmployeesOfRoleId(roleId);
    if (response == undefined || response == null || response.length === 0) {
      return res
        .status(404)
        .json({ error: "Employee details related to role not found!" });
    } else {
      const employeeDetails = [];
      for (let emp of response) {
        employeeDetails.push(await getEmployeeDetails(emp));
      }
      return res.status(200).json({ employees: employeeDetails });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

async function getEmployeeRecordsSortByName(order) {
  const employees = await employee.findAll({ order: [["name", order]] });
  return employees;
}

app.get("/employees/sort-by-name", async (req, res) => {
  const order = req.query.order;
  try {
    const response = await getEmployeeRecordsSortByName(order);
    if (response == undefined || response == null || response.length === 0) {
      return res.status(404).json({ error: "Employee records not found!" });
    } else {
      const employeeDetails = [];
      for (let emp of response) {
        employeeDetails.push(await getEmployeeDetails(emp));
      }
      return res.status(200).json({ employees: employeeDetails });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

async function addNewEmployee(empData) {
  const newEmpRecord = { name: empData.name, email: empData.email };
  const insertedEmpRecord = await employee.create(newEmpRecord);
  await employeeDepartment.create({
    employeeId: insertedEmpRecord.id,
    departmentId: empData.departmentId,
  });
  await employeeRole.create({
    employeeId: insertedEmpRecord.id,
    roleId: empData.roleId,
  });
  return insertedEmpRecord;
}

app.post("/employees/new", async (req, res) => {
  const empData = req.body;
  try {
    const response = await addNewEmployee(empData);
    if (response == undefined || response == null) {
      return res.status(400).json({
        error:
          "Please check the employee data what are you passing, looks invalid!",
      });
    } else {
      const employeeDetails = await getEmployeeDetails(response);
      return res.status(200).json({ employeeDetails });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

async function updateEmployeeName(employeeObj, empNameObj) {
  employeeObj.set(empNameObj);
  return await employeeObj.save();
}

async function updateEmployeeEmail(employeeObj, empEmailObj) {
  employeeObj.set(empEmailObj);
  return await employeeObj.save();
}

async function updateEmployeeDepartmentId(employeeId, departmentId) {
  await employeeDepartment.destroy({
    where: {
      employeeId: parseInt(employeeId),
    },
  });
  return await employeeDepartment.create({
    employeeId: employeeId,
    departmentId,
  });
}

async function updateEmployeeRoleId(employeeId, roleId) {
  await employeeRole.destroy({
    where: {
      employeeId: parseInt(employeeId),
    },
  });
  return await employeeRole.create({
    employeeId: employeeId,
    roleId,
  });
}

app.post("/employees/update/:id", async (req, res) => {
  const empData = req.body;
  const employeeId = parseInt(req.params.id);
  try {
    const employeeById = await getEmployeeDetailsById(employeeId);
    if (employeeById == undefined || employeeById == null) {
      return res
        .status(404)
        .json({ error: "Employee details by id not found!" });
    } else {
      const { name, email, departmentId, roleId } = empData;
      if (name) {
        await updateEmployeeName(employeeById, { name });
      }
      if (email) {
        await updateEmployeeEmail(employeeById, { email });
      }
      if (departmentId) {
        await updateEmployeeDepartmentId(employeeId, departmentId);
      }
      if (roleId) {
        await updateEmployeeRoleId(employeeId, roleId);
      }
      const employeeDetails = await getEmployeeDetails(employeeById);
      return res.status(200).json({ employeeDetails });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

async function deleteEmployeeById(employeeId) {
  return await employee.destroy({
    where: {
      id: parseInt(employeeId),
    },
  });
}

app.post("/employees/delete", async (req, res) => {
  const empId = req.body;
  try {
    const response = await deleteEmployeeById(empId.id);
    if (!response || response == undefined || response == null) {
      return res.status(404).json({
        error: `Can't delete employee details by id ${empId.id}, that id doesn't exist.`,
      });
    } else {
      return res
        .status(200)
        .json({ message: `Employee with ID ${empId.id} has been deleted.` });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log("Server listening at port: " + PORT);
});

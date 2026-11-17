import { Router } from "express";
import type { Db } from "../db/client.js";
import * as service from "../services/employeeService.js";
import {
  createEmployeeSchema,
  idParamSchema,
  listQuerySchema,
  salaryChangeSchema,
  updateEmployeeSchema,
} from "../validation/employees.js";

// Routes only read and check the request, then hand it to the service.
export function employeesRouter(db: Db) {
  const router = Router();

  router.get("/", async (req, res) => {
    res.json(await service.listEmployees(db, listQuerySchema.parse(req.query)));
  });

  router.post("/", async (req, res) => {
    res.status(201).json(await service.createEmployee(db, createEmployeeSchema.parse(req.body)));
  });

  router.get("/:id", async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    res.json(await service.getEmployee(db, id));
  });

  router.put("/:id", async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    res.json(await service.updateEmployee(db, id, updateEmployeeSchema.parse(req.body)));
  });

  router.post("/:id/salaries", async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    res.status(201).json(await service.changeSalary(db, id, salaryChangeSchema.parse(req.body)));
  });

  return router;
}

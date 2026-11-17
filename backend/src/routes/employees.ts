import { Router } from "express";
import { z } from "zod";
import type { Db } from "../db/client.js";
import { COUNTRY_CODES } from "../domain/countries.js";
import { listEmployees } from "../services/employeeService.js";

const optionalText = z.string().trim().max(100).optional().transform((v) => v || undefined);

const listQuerySchema = z.object({
  search: optionalText,
  country: z.enum(COUNTRY_CODES).optional(),
  department: optionalText,
  jobTitle: optionalText,
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
});

export function employeesRouter(db: Db) {
  const router = Router();

  router.get("/", async (req, res) => {
    const query = listQuerySchema.parse(req.query);
    res.json(await listEmployees(db, query));
  });

  return router;
}

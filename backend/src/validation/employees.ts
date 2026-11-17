import { z } from "zod";
import { COUNTRY_CODES } from "../domain/countries.js";

const optionalText = z.string().trim().max(100).optional().transform((v) => v || undefined);
const requiredText = z.string().trim().min(1, "Required").max(100);
const isoDate = z.iso.date("Must be a date like 2025-04-01");
// Yearly salary in whole currency units. The upper limit only catches typos (extra zeros).
const amount = z.number().int("Must be a whole number").positive("Must be more than 0").max(1_000_000_000);

export const listQuerySchema = z.object({
  search: optionalText,
  country: z.enum(COUNTRY_CODES).optional(),
  department: optionalText,
  jobTitle: optionalText,
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
});

export const idParamSchema = z.object({ id: z.coerce.number().int().positive() });

const employeeFields = {
  fullName: requiredText,
  email: z.email("Must be a valid email").trim().toLowerCase(),
  jobTitle: requiredText,
  department: requiredText,
  country: z.enum(COUNTRY_CODES),
};

export const salaryChangeSchema = z.object({
  amount,
  effectiveDate: isoDate,
  reason: requiredText,
});

export const createEmployeeSchema = z.object({
  ...employeeFields,
  hireDate: isoDate,
  salary: amount, // starting salary, saved as the "Joined" history row
});

export const updateEmployeeSchema = z.object({
  ...employeeFields,
  // Only needed when the country changes (the old salary is in the old currency).
  newSalary: salaryChangeSchema.optional(),
});

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;
export type SalaryChangeInput = z.infer<typeof salaryChangeSchema>;

import type { Db } from "../db/client.js";
import { findEmployees, type EmployeeFilters } from "../repositories/employeeRepository.js";

export type ListEmployeesInput = EmployeeFilters & { page: number; pageSize: number };

/** One page of employees (sorted by name), each with their current salary. */
export async function listEmployees(db: Db, input: ListEmployeesInput) {
  const { page, pageSize, ...filters } = input;
  const { rows, total } = await findEmployees(db, filters, pageSize, (page - 1) * pageSize);

  return {
    items: rows.map(({ salaryAmount, salaryCurrency, salaryEffectiveDate, ...employee }) => ({
      ...employee,
      currentSalary:
        salaryAmount === null
          ? null
          : { amount: salaryAmount, currency: salaryCurrency!, effectiveDate: salaryEffectiveDate! },
    })),
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize),
  };
}

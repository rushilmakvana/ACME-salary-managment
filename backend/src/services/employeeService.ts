import type { Db } from "../db/client.js";
import { currencyFor, type CountryCode } from "../domain/countries.js";
import { conflict, invalid, notFound } from "../errors.js";
import * as repo from "../repositories/employeeRepository.js";
import type { EmployeeFilters } from "../repositories/employeeRepository.js";
import type { CreateEmployeeInput, SalaryChangeInput, UpdateEmployeeInput } from "../validation/employees.js";

export type ListEmployeesInput = EmployeeFilters & { page: number; pageSize: number };

/** One page of employees (sorted by name), each with their current salary. */
export async function listEmployees(db: Db, input: ListEmployeesInput) {
  const { page, pageSize, ...filters } = input;
  const { rows, total } = await repo.findEmployees(db, filters, pageSize, (page - 1) * pageSize);

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

/** One employee with their full salary history (newest first). */
export async function getEmployee(db: Db, id: number) {
  const employee = await repo.findEmployeeById(db, id);
  if (!employee) throw notFound(`Employee ${id} not found`);

  const salaryHistory = await repo.findSalaryHistory(db, id);
  return { ...employee, currentSalary: salaryHistory[0] ?? null, salaryHistory };
}

/** Adds an employee together with their starting salary. */
export async function createEmployee(db: Db, input: CreateEmployeeInput) {
  const { salary, ...employee } = input;
  await assertEmailFree(db, employee.email);

  const id = await repo.insertEmployeeWithSalary(db, employee, {
    amount: salary,
    currency: currencyFor(employee.country), // never chosen by hand
    effectiveDate: employee.hireDate,
    reason: "Joined",
  });
  return getEmployee(db, id);
}

/**
 * Edits an employee's details.
 * Moving to another country needs a new salary in the new currency,
 * otherwise the old salary would be counted under the wrong country.
 */
export async function updateEmployee(db: Db, id: number, input: UpdateEmployeeInput) {
  const existing = await repo.findEmployeeById(db, id);
  if (!existing) throw notFound(`Employee ${id} not found`);

  const { newSalary, ...changes } = input;
  await assertEmailFree(db, changes.email, id);

  const countryChanged = changes.country !== existing.country;
  if (countryChanged && !newSalary) {
    throw invalid("Changing country needs a new salary in the new country's currency", "newSalary");
  }
  if (newSalary) assertNotBeforeHire(newSalary.effectiveDate, existing.hireDate);

  await repo.updateEmployee(
    db,
    id,
    changes,
    newSalary && { ...newSalary, currency: currencyFor(changes.country) },
  );
  return getEmployee(db, id);
}

/** Records a salary change as a new history row; old rows are never edited. */
export async function changeSalary(db: Db, id: number, input: SalaryChangeInput) {
  const employee = await repo.findEmployeeById(db, id);
  if (!employee) throw notFound(`Employee ${id} not found`);
  assertNotBeforeHire(input.effectiveDate, employee.hireDate);

  await repo.insertSalary(db, {
    ...input,
    employeeId: id,
    currency: currencyFor(employee.country as CountryCode),
  });
  return getEmployee(db, id);
}

async function assertEmailFree(db: Db, email: string, excludeId?: number) {
  if (await repo.isEmailTaken(db, email, excludeId)) {
    throw conflict("This email is already used by another employee", "email");
  }
}

function assertNotBeforeHire(effectiveDate: string, hireDate: string) {
  // ISO dates (YYYY-MM-DD) compare correctly as text.
  if (effectiveDate < hireDate) {
    throw invalid(`Salary date can't be before the hire date (${hireDate})`, "effectiveDate");
  }
}

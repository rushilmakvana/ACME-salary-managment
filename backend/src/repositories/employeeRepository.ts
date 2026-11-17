import { and, asc, count, desc, eq, ne, sql, type SQL } from "drizzle-orm";
import type { Db } from "../db/client.js";
import { employees, salaries, type NewEmployee, type NewSalary } from "../db/schema.js";

export type EmployeeFilters = {
  search?: string;
  country?: string;
  department?: string;
  jobTitle?: string;
};

/**
 * The id of an employee's current salary row: the latest effective date,
 * and if two rows share a date, the one added last.
 * Uses the (employee_id, effective_date) index.
 */
const currentSalaryId = sql`(
  SELECT s2.id FROM ${salaries} s2
  WHERE s2.employee_id = ${employees.id}
  ORDER BY s2.effective_date DESC, s2.id DESC
  LIMIT 1
)`;

export async function findEmployees(db: Db, filters: EmployeeFilters, limit: number, offset: number) {
  const where = buildWhere(filters);

  const rows = await db
    .select({
      id: employees.id,
      fullName: employees.fullName,
      email: employees.email,
      jobTitle: employees.jobTitle,
      department: employees.department,
      country: employees.country,
      hireDate: employees.hireDate,
      salaryAmount: salaries.amount,
      salaryCurrency: salaries.currency,
      salaryEffectiveDate: salaries.effectiveDate,
    })
    .from(employees)
    .leftJoin(salaries, eq(salaries.id, currentSalaryId))
    .where(where)
    // id as a tie-breaker keeps the order stable, so paging never repeats or skips people
    .orderBy(asc(employees.fullName), asc(employees.id))
    .limit(limit)
    .offset(offset);

  const [{ total }] = await db.select({ total: count() }).from(employees).where(where);

  return { rows, total };
}

export async function findEmployeeById(db: Db, id: number) {
  const [employee] = await db.select().from(employees).where(eq(employees.id, id));
  return employee;
}

/** All salary rows of one employee, newest first (same order as "current salary"). */
export function findSalaryHistory(db: Db, employeeId: number) {
  return db
    .select()
    .from(salaries)
    .where(eq(salaries.employeeId, employeeId))
    .orderBy(desc(salaries.effectiveDate), desc(salaries.id));
}

/** True if another employee (not excludeId) already uses this email. */
export async function isEmailTaken(db: Db, email: string, excludeId?: number) {
  const [row] = await db
    .select({ id: employees.id })
    .from(employees)
    .where(excludeId ? and(eq(employees.email, email), ne(employees.id, excludeId)) : eq(employees.email, email));
  return row !== undefined;
}

/** Saves an employee and their first salary together: both or neither. */
export function insertEmployeeWithSalary(db: Db, employee: NewEmployee, salary: Omit<NewSalary, "employeeId">) {
  return db.transaction(async (tx) => {
    const [created] = await tx.insert(employees).values(employee).returning();
    await tx.insert(salaries).values({ ...salary, employeeId: created.id });
    return created.id;
  });
}

/** Updates an employee's details, optionally adding a salary row in the same transaction. */
export function updateEmployee(
  db: Db,
  id: number,
  changes: Partial<NewEmployee>,
  salary?: Omit<NewSalary, "employeeId">,
) {
  return db.transaction(async (tx) => {
    await tx.update(employees).set(changes).where(eq(employees.id, id));
    if (salary) await tx.insert(salaries).values({ ...salary, employeeId: id });
  });
}

export async function insertSalary(db: Db, salary: NewSalary) {
  await db.insert(salaries).values(salary);
}

function buildWhere(filters: EmployeeFilters): SQL | undefined {
  const conditions: SQL[] = [];

  if (filters.search) {
    // Treat % and _ typed by the user as normal characters, not wildcards.
    const escaped = filters.search.replace(/[\\%_]/g, (ch) => `\\${ch}`);
    conditions.push(sql`${employees.fullName} LIKE ${`%${escaped}%`} ESCAPE '\\'`);
  }
  if (filters.country) conditions.push(eq(employees.country, filters.country));
  if (filters.department) conditions.push(eq(employees.department, filters.department));
  if (filters.jobTitle) conditions.push(eq(employees.jobTitle, filters.jobTitle));

  return conditions.length ? and(...conditions) : undefined;
}

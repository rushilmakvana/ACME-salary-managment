import { and, asc, count, desc, eq, like, type SQL } from "drizzle-orm";
import type { Db } from "../db/client.js";
import { employees, salaries, type NewEmployee, type NewSalary } from "../db/schema.js";

export type EmployeeFilters = {
  search?: string;
  country?: string;
  department?: string;
  jobTitle?: string;
};

/**
 * An employee's current salary: the row with the latest effective date
 * (if two rows share a date, the one added last). Uses the (employee_id, effective_date) index.
 * Defined once so the employee list and the insights always agree.
 */
const latestSalary = {
  columns: { amount: true, currency: true, effectiveDate: true },
  orderBy: [desc(salaries.effectiveDate), desc(salaries.id)] as SQL[],
  limit: 1,
} as const;

/** One page of employees, sorted by name, each with their current salary. */
export async function findEmployees(db: Db, filters: EmployeeFilters, limit: number, offset: number) {
  const where = buildWhere(filters);

  const rows = await db.query.employees.findMany({
    where,
    with: { salaries: latestSalary },
    // id as a tie-breaker keeps the order stable, so paging never repeats or skips people
    orderBy: [asc(employees.fullName), asc(employees.id)],
    limit,
    offset,
  });
  const [{ total }] = await db.select({ total: count() }).from(employees).where(where);

  return { rows, total };
}

/** Every employee's country, department, job title and current salary, for the pay insights. */
export function findCurrentSalaries(db: Db, country?: string) {
  return db.query.employees.findMany({
    columns: { country: true, department: true, jobTitle: true },
    where: country ? eq(employees.country, country) : undefined,
    with: { salaries: latestSalary },
  });
}

export async function findEmployeeById(db: Db, id: number) {
  const [employee] = await db.select().from(employees).where(eq(employees.id, id));
  return employee;
}

export async function findEmployeeByEmail(db: Db, email: string) {
  const [employee] = await db.select().from(employees).where(eq(employees.email, email));
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

/** Every job title in use, with its department, sorted by department then title. */
export function findJobTitles(db: Db) {
  return db
    .selectDistinct({ department: employees.department, jobTitle: employees.jobTitle })
    .from(employees)
    .orderBy(asc(employees.department), asc(employees.jobTitle));
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

  if (filters.search) conditions.push(like(employees.fullName, `%${filters.search}%`));
  if (filters.country) conditions.push(eq(employees.country, filters.country));
  if (filters.department) conditions.push(eq(employees.department, filters.department));
  if (filters.jobTitle) conditions.push(eq(employees.jobTitle, filters.jobTitle));

  return conditions.length ? and(...conditions) : undefined;
}

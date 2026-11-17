import { and, asc, count, eq, sql, type SQL } from "drizzle-orm";
import type { Db } from "../db/client.js";
import { employees, salaries } from "../db/schema.js";

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

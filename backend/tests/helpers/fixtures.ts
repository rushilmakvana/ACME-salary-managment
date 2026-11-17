import type { Db } from "../../src/db/client.js";
import { employees, salaries, type NewEmployee } from "../../src/db/schema.js";
import { currencyFor, type CountryCode } from "../../src/domain/countries.js";

let counter = 0;

type SalaryInput = { amount: number; effectiveDate: string; reason?: string };

/**
 * Adds one employee (with sensible defaults) and their salary rows.
 * Tests only spell out the fields they care about.
 */
export async function addEmployee(
  db: Db,
  overrides: Partial<NewEmployee> = {},
  salaryRows: SalaryInput[] = [{ amount: 1_000_000, effectiveDate: "2024-01-01" }],
) {
  counter++;
  const [employee] = await db
    .insert(employees)
    .values({
      fullName: `Test Person ${counter}`,
      email: `test${counter}@acme.com`,
      jobTitle: "Software Engineer",
      department: "Engineering",
      country: "IN",
      hireDate: "2024-01-01",
      ...overrides,
    })
    .returning();

  const currency = currencyFor(employee.country as CountryCode);
  for (const s of salaryRows) {
    await db.insert(salaries).values({ employeeId: employee.id, currency, reason: "Joined", ...s });
  }
  return employee;
}

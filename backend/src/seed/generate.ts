import { currencyFor } from "../domain/countries.js";
import type { NewEmployee, NewSalary } from "../db/schema.js";
import {
  COUNTRY_WEIGHTS,
  DEPARTMENTS,
  DEPARTMENT_WEIGHTS,
  FIRST_NAMES,
  LAST_NAMES,
  payRange,
} from "./data.js";
import { createRandom } from "./random.js";

const FIRST_HIRE_YEAR = 2015;
const LAST_HIRE_YEAR = 2025;
const RAISE_CHANCE = 0.3; // about 30% of eligible employees get one raise
const LAST_RAISE_YEAR = 2025; // keeps every raise in the past

export type SeedData = { employees: NewEmployee[]; salaries: NewSalary[] };

/**
 * Builds seed data in memory, without touching the database.
 * The same (count, seed) always gives exactly the same data.
 */
export function generateSeedData(count: number, seed = 42): SeedData {
  const random = createRandom(seed);
  const employees: NewEmployee[] = [];
  const salaries: NewSalary[] = [];

  for (let id = 1; id <= count; id++) {
    const first = random.pick(FIRST_NAMES);
    const last = random.pick(LAST_NAMES);
    const country = random.weighted(COUNTRY_WEIGHTS);
    const department = random.weighted(DEPARTMENT_WEIGHTS);
    const job = random.weighted(DEPARTMENTS[department].map((j) => [j, j.weight] as const));
    const hireYear = random.int(FIRST_HIRE_YEAR, LAST_HIRE_YEAR);
    const hireMonth = random.int(1, 12);
    const hireDay = random.int(1, 28); // 28 is valid in every month
    const hireDate = isoDate(hireYear, hireMonth, hireDay);
    const currency = currencyFor(country);

    employees.push({
      id, // fixed ids so salary rows can point at them without a lookup
      fullName: `${first} ${last}`,
      email: `${first.toLowerCase()}.${last.toLowerCase()}${id}@acme.com`, // id keeps it unique
      jobTitle: job.title,
      department,
      country,
      hireDate,
    });

    const range = payRange(job, country);
    const joinedAmount = roundToThousand(random.int(range.min, range.max));
    salaries.push({
      employeeId: id,
      amount: joinedAmount,
      currency,
      effectiveDate: hireDate,
      reason: "Joined",
    });

    // A raise lands on the hiring anniversary, 1-3 years later (always after hiring, never in the future).
    if (hireYear < LAST_RAISE_YEAR && random.chance(RAISE_CHANCE)) {
      const raiseYear = Math.min(hireYear + random.int(1, 3), LAST_RAISE_YEAR);
      const percent = random.int(5, 15);
      // Rounding must never turn a raise into "the same amount".
      const raisedAmount = Math.max(roundToThousand(joinedAmount * (1 + percent / 100)), joinedAmount + 1000);
      salaries.push({
        employeeId: id,
        amount: raisedAmount,
        currency,
        effectiveDate: isoDate(raiseYear, hireMonth, hireDay),
        reason: "Annual raise",
      });
    }
  }

  return { employees, salaries };
}

/** isoDate(2019, 3, 4) → "2019-03-04" */
function isoDate(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function roundToThousand(n: number): number {
  return Math.round(n / 1000) * 1000;
}

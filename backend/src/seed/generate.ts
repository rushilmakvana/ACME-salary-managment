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
import { createRandom, type Random } from "./random.js";

const RAISE_CHANCE = 0.3; // about 30% of eligible employees get one raise
const DAY = 24 * 60 * 60 * 1000;
const HIRE_START = Date.UTC(2015, 0, 1);
const HIRE_END = Date.UTC(2026, 5, 30);
const RAISE_ELIGIBLE_BEFORE = Date.UTC(2025, 0, 1); // hired early enough to have had a raise
const LATEST_RAISE = Date.UTC(2026, 6, 1);

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
    const hired = randomDay(random, HIRE_START, HIRE_END);
    const currency = currencyFor(country);

    employees.push({
      id, // fixed ids so salary rows can point at them without a lookup
      fullName: `${first} ${last}`,
      email: `${first.toLowerCase()}.${last.toLowerCase()}${id}@acme.com`, // id keeps it unique
      jobTitle: job.title,
      department,
      country,
      hireDate: toIsoDate(hired),
    });

    const range = payRange(job, country);
    const joinedAmount = roundToThousand(random.int(range.min, range.max));
    salaries.push({
      employeeId: id,
      amount: joinedAmount,
      currency,
      effectiveDate: toIsoDate(hired),
      reason: "Joined",
    });

    if (hired < RAISE_ELIGIBLE_BEFORE && random.chance(RAISE_CHANCE)) {
      const raisedOn = randomDay(random, hired + 365 * DAY, LATEST_RAISE);
      const percent = random.int(5, 15);
      // Rounding must never turn a raise into "the same amount".
      const raisedAmount = Math.max(roundToThousand(joinedAmount * (1 + percent / 100)), joinedAmount + 1000);
      salaries.push({
        employeeId: id,
        amount: raisedAmount,
        currency,
        effectiveDate: toIsoDate(raisedOn),
        reason: "Annual raise",
      });
    }
  }

  return { employees, salaries };
}

function randomDay(random: Random, from: number, to: number): number {
  return from + random.int(0, Math.floor((to - from) / DAY)) * DAY;
}

function toIsoDate(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

function roundToThousand(n: number): number {
  return Math.round(n / 1000) * 1000;
}

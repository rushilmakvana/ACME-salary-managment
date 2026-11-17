import { count } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { employees, salaries } from "../src/db/schema.js";
import { COUNTRIES, type CountryCode } from "../src/domain/countries.js";
import { generateSeedData } from "../src/seed/generate.js";
import { seedDatabase } from "../src/seed/seed.js";
import { createTestDb } from "./helpers/db.js";

describe("generateSeedData", () => {
  const data = generateSeedData(2_000);

  it("creates the requested number of employees, each with a joining salary", () => {
    expect(data.employees).toHaveLength(2_000);
    const joined = data.salaries.filter((s) => s.reason === "Joined");
    expect(joined).toHaveLength(2_000);
  });

  it("gives the same data every time for the same seed", () => {
    expect(generateSeedData(2_000)).toEqual(data);
    expect(generateSeedData(2_000, 7)).not.toEqual(data);
  });

  it("pays every salary in the employee's country currency", () => {
    const countryOf = new Map(data.employees.map((e) => [e.id, e.country as CountryCode]));
    for (const s of data.salaries) {
      expect(s.currency).toBe(COUNTRIES[countryOf.get(s.employeeId)!].currency);
    }
  });

  it("makes every raise later and higher than the joining salary", () => {
    const joinedBy = new Map(data.salaries.filter((s) => s.reason === "Joined").map((s) => [s.employeeId, s]));
    const raises = data.salaries.filter((s) => s.reason !== "Joined");

    expect(raises.length).toBeGreaterThan(0);
    for (const raise of raises) {
      const joined = joinedBy.get(raise.employeeId)!;
      expect(raise.effectiveDate > joined.effectiveDate).toBe(true);
      expect(raise.amount).toBeGreaterThan(joined.amount);
    }
  });
});

describe("seedDatabase", () => {
  it("writes all employees and salaries, and replaces old data when run again", async () => {
    const db = await createTestDb();

    await seedDatabase(db, 300);
    const result = await seedDatabase(db, 300);

    const [{ value: employeeRows }] = await db.select({ value: count() }).from(employees);
    const [{ value: salaryRows }] = await db.select({ value: count() }).from(salaries);
    expect(employeeRows).toBe(300);
    expect(salaryRows).toBe(result.salaries);
  });
});

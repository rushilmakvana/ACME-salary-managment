import { describe, expect, it } from "vitest";
import { employees, salaries } from "../src/db/schema.js";
import { createTestDb } from "./helpers/db.js";

const priya = {
  fullName: "Priya Sharma",
  email: "priya.sharma@acme.com",
  jobTitle: "Software Engineer",
  department: "Engineering",
  country: "IN",
  hireDate: "2022-03-14",
};

describe("database schema", () => {
  it("stores an employee with a salary", async () => {
    const db = await createTestDb();
    const [emp] = await db.insert(employees).values(priya).returning();
    await db.insert(salaries).values({
      employeeId: emp.id,
      amount: 1_800_000,
      currency: "INR",
      effectiveDate: "2025-04-01",
      reason: "Annual raise",
    });

    const rows = await db.select().from(salaries);
    expect(rows).toHaveLength(1);
    expect(rows[0].employeeId).toBe(emp.id);
  });

  it("rejects two employees with the same email", async () => {
    const db = await createTestDb();
    await db.insert(employees).values(priya);

    await expect(db.insert(employees).values({ ...priya, fullName: "Someone Else" })).rejects.toThrow();
  });

  it("rejects a salary for an employee that does not exist", async () => {
    const db = await createTestDb();

    await expect(
      db.insert(salaries).values({
        employeeId: 999,
        amount: 50_000,
        currency: "USD",
        effectiveDate: "2025-01-01",
        reason: "Joined",
      }),
    ).rejects.toThrow();
  });

  it("rejects a zero or negative salary", async () => {
    const db = await createTestDb();
    const [emp] = await db.insert(employees).values(priya).returning();
    const base = { employeeId: emp.id, currency: "INR", effectiveDate: "2025-01-01", reason: "Joined" };

    await expect(db.insert(salaries).values({ ...base, amount: 0 })).rejects.toThrow();
    await expect(db.insert(salaries).values({ ...base, amount: -100 })).rejects.toThrow();
  });
});

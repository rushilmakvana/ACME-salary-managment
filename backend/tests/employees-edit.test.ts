import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import type { Db } from "../src/db/client.js";
import { addEmployee } from "./helpers/fixtures.js";
import { createTestDb } from "./helpers/db.js";

let db: Db;
let app: ReturnType<typeof createApp>;

beforeEach(async () => {
  db = await createTestDb();
  app = createApp(db);
});

const newHire = {
  fullName: "Priya Sharma",
  email: "priya.sharma@acme.com",
  jobTitle: "Software Engineer",
  department: "Engineering",
  country: "IN",
  hireDate: "2025-01-15",
  salary: 1_500_000,
};

const detailsOf = (e: { fullName: string; email: string; jobTitle: string; department: string; country: string }) => ({
  fullName: e.fullName,
  email: e.email,
  jobTitle: e.jobTitle,
  department: e.department,
  country: e.country,
});

describe("GET /api/employees/:id", () => {
  it("returns the employee with salary history, newest first", async () => {
    const emp = await addEmployee(db, { hireDate: "2022-01-01" }, [
      { amount: 1_000_000, effectiveDate: "2022-01-01" },
      { amount: 1_200_000, effectiveDate: "2024-04-01", reason: "Annual raise" },
    ]);

    const res = await request(app).get(`/api/employees/${emp.id}`);

    expect(res.status).toBe(200);
    expect(res.body.salaryHistory.map((s: { amount: number }) => s.amount)).toEqual([1_200_000, 1_000_000]);
    expect(res.body.currentSalary.amount).toBe(1_200_000);
  });

  it("returns 404 for an unknown employee", async () => {
    const res = await request(app).get("/api/employees/999");

    expect(res.status).toBe(404);
  });
});

describe("POST /api/employees", () => {
  it("creates the employee and their starting salary in the country's currency", async () => {
    const res = await request(app).post("/api/employees").send(newHire);

    expect(res.status).toBe(201);
    expect(res.body.fullName).toBe("Priya Sharma");
    expect(res.body.salaryHistory).toEqual([
      expect.objectContaining({ amount: 1_500_000, currency: "INR", effectiveDate: "2025-01-15", reason: "Joined" }),
    ]);
  });

  it("rejects an email that is already used, with 409", async () => {
    await request(app).post("/api/employees").send(newHire);

    const res = await request(app)
      .post("/api/employees")
      .send({ ...newHire, fullName: "Someone Else", email: "PRIYA.SHARMA@acme.com" });

    expect(res.status).toBe(409);
    expect(res.body.details[0].field).toBe("email");
  });

  it.each([
    ["missing name", { fullName: "" }, "fullName"],
    ["bad email", { email: "not-an-email" }, "email"],
    ["zero salary", { salary: 0 }, "salary"],
    ["decimal salary", { salary: 1000.5 }, "salary"],
    ["unknown country", { country: "XX" }, "country"],
    ["bad date", { hireDate: "15/01/2025" }, "hireDate"],
  ])("rejects %s with a 400 naming the field", async (_case, change, field) => {
    const res = await request(app).post("/api/employees").send({ ...newHire, ...change });

    expect(res.status).toBe(400);
    expect(res.body.details.map((d: { field: string }) => d.field)).toContain(field);
  });
});

describe("PUT /api/employees/:id", () => {
  it("updates the details without touching salary history", async () => {
    const emp = await addEmployee(db);

    const res = await request(app)
      .put(`/api/employees/${emp.id}`)
      .send({ ...detailsOf(emp), jobTitle: "Senior Software Engineer" });

    expect(res.status).toBe(200);
    expect(res.body.jobTitle).toBe("Senior Software Engineer");
    expect(res.body.salaryHistory).toHaveLength(1);
  });

  it("refuses a country change without a new salary", async () => {
    const emp = await addEmployee(db, { country: "IN" });

    const res = await request(app)
      .put(`/api/employees/${emp.id}`)
      .send({ ...detailsOf(emp), country: "US" });

    expect(res.status).toBe(400);
    expect(res.body.details[0].field).toBe("newSalary");
  });

  it("on a country change, saves the new salary in the new currency", async () => {
    const emp = await addEmployee(db, { country: "IN", hireDate: "2023-01-01" });

    const res = await request(app)
      .put(`/api/employees/${emp.id}`)
      .send({
        ...detailsOf(emp),
        country: "US",
        newSalary: { amount: 120_000, effectiveDate: "2025-06-01", reason: "Relocation" },
      });

    expect(res.status).toBe(200);
    expect(res.body.country).toBe("US");
    expect(res.body.currentSalary).toMatchObject({ amount: 120_000, currency: "USD" });
  });

  it("rejects using another employee's email", async () => {
    const first = await addEmployee(db, { email: "taken@acme.com" });
    const second = await addEmployee(db);

    const res = await request(app)
      .put(`/api/employees/${second.id}`)
      .send({ ...detailsOf(second), email: first.email });

    expect(res.status).toBe(409);
  });

  it("returns 404 for an unknown employee", async () => {
    const res = await request(app).put("/api/employees/999").send(detailsOf({ ...newHire }));

    expect(res.status).toBe(404);
  });
});

describe("POST /api/employees/:id/salaries", () => {
  it("adds a new salary that becomes the current one and keeps the old one", async () => {
    const emp = await addEmployee(db, { hireDate: "2023-01-01" }, [{ amount: 1_000_000, effectiveDate: "2023-01-01" }]);

    const res = await request(app)
      .post(`/api/employees/${emp.id}/salaries`)
      .send({ amount: 1_150_000, effectiveDate: "2025-04-01", reason: "Promotion" });

    expect(res.status).toBe(201);
    expect(res.body.currentSalary).toMatchObject({ amount: 1_150_000, currency: "INR", reason: "Promotion" });
    expect(res.body.salaryHistory).toHaveLength(2);
  });

  it("rejects a salary dated before the hire date", async () => {
    const emp = await addEmployee(db, { hireDate: "2023-01-01" });

    const res = await request(app)
      .post(`/api/employees/${emp.id}/salaries`)
      .send({ amount: 1_150_000, effectiveDate: "2022-12-31", reason: "Raise" });

    expect(res.status).toBe(400);
    expect(res.body.details[0].field).toBe("effectiveDate");
  });

  it("rejects a negative amount", async () => {
    const emp = await addEmployee(db);

    const res = await request(app)
      .post(`/api/employees/${emp.id}/salaries`)
      .send({ amount: -5, effectiveDate: "2025-01-01", reason: "Raise" });

    expect(res.status).toBe(400);
  });
});

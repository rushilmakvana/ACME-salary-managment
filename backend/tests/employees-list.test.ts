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

const names = (res: request.Response) => res.body.items.map((e: { fullName: string }) => e.fullName);

describe("GET /api/employees", () => {
  it("returns employees sorted by name, each with their current salary", async () => {
    await addEmployee(db, { fullName: "Zara Khan" });
    // Rows added out of date order: the latest date must win, not the last insert.
    await addEmployee(db, { fullName: "Amit Roy" }, [
      { amount: 1_400_000, effectiveDate: "2025-04-01", reason: "Annual raise" },
      { amount: 1_200_000, effectiveDate: "2023-01-10" },
    ]);

    const res = await request(app).get("/api/employees");

    expect(res.status).toBe(200);
    expect(names(res)).toEqual(["Amit Roy", "Zara Khan"]);
    expect(res.body.items[0].currentSalary).toEqual({
      amount: 1_400_000,
      currency: "INR",
      effectiveDate: "2025-04-01",
    });
  });

  it("searches names by any part, ignoring upper/lower case", async () => {
    await addEmployee(db, { fullName: "Priya Sharma" });
    await addEmployee(db, { fullName: "James Smith" });

    const res = await request(app).get("/api/employees?search=ARM");

    expect(names(res)).toEqual(["Priya Sharma"]);
  });

  it("combines filters", async () => {
    await addEmployee(db, { fullName: "India Engineer", country: "IN", department: "Engineering" });
    await addEmployee(db, { fullName: "India Sales", country: "IN", department: "Sales" });
    await addEmployee(db, { fullName: "US Engineer", country: "US", department: "Engineering" });

    const res = await request(app).get("/api/employees?country=IN&department=Engineering");

    expect(names(res)).toEqual(["India Engineer"]);
  });

  it("filters by job title", async () => {
    await addEmployee(db, { fullName: "A", jobTitle: "Software Engineer" });
    await addEmployee(db, { fullName: "B", jobTitle: "HR Manager" });

    const res = await request(app).get("/api/employees?jobTitle=HR%20Manager");

    expect(names(res)).toEqual(["B"]);
  });

  it("splits results into pages and reports the totals", async () => {
    for (let i = 1; i <= 23; i++) {
      await addEmployee(db, { fullName: `Person ${String(i).padStart(2, "0")}` });
    }

    const page3 = await request(app).get("/api/employees?page=3&pageSize=10");

    expect(page3.body).toMatchObject({ page: 3, pageSize: 10, total: 23, totalPages: 3 });
    expect(names(page3)).toEqual(["Person 21", "Person 22", "Person 23"]);
  });

  it.each([
    ["page=0", "page"],
    ["pageSize=500", "pageSize"],
    ["country=XX", "country"],
  ])("rejects bad input (%s) with a 400 naming the field", async (query, field) => {
    const res = await request(app).get(`/api/employees?${query}`);

    expect(res.status).toBe(400);
    expect(res.body.details[0].field).toBe(field);
  });
});

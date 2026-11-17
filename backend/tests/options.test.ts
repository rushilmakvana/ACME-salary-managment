import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import { addEmployee } from "./helpers/fixtures.js";
import { createTestDb } from "./helpers/db.js";

describe("GET /api/options", () => {
  it("lists countries, and the departments and job titles in use", async () => {
    const db = await createTestDb();
    await addEmployee(db, { department: "Sales", jobTitle: "Sales Manager" });
    await addEmployee(db, { department: "Engineering", jobTitle: "Software Engineer" });
    await addEmployee(db, { department: "Engineering", jobTitle: "Software Engineer" }); // duplicate

    const res = await request(createApp(db)).get("/api/options");

    expect(res.status).toBe(200);
    expect(res.body.countries).toContainEqual({ code: "IN", name: "India", currency: "INR" });
    expect(res.body.departments).toEqual(["Engineering", "Sales"]);
    expect(res.body.jobTitles).toEqual([
      { department: "Engineering", jobTitle: "Software Engineer" },
      { department: "Sales", jobTitle: "Sales Manager" },
    ]);
  });
});

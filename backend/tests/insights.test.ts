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

/** Adds one employee per amount, all with a single salary. */
async function addPeople(country: string, amounts: number[], jobTitle = "Software Engineer") {
  for (const amount of amounts) {
    await addEmployee(db, { country, jobTitle }, [{ amount, effectiveDate: "2024-01-01" }]);
  }
}

describe("GET /api/insights/countries", () => {
  it("calculates headcount, min, median, average and max (odd count)", async () => {
    await addPeople("IN", [300, 100, 200, 1000, 400]);

    const res = await request(app).get("/api/insights/countries");

    expect(res.status).toBe(200);
    expect(res.body).toEqual([
      {
        country: "IN",
        countryName: "India",
        currency: "INR",
        headcount: 5,
        min: 100,
        median: 300, // middle of 100, 200, 300, 400, 1000
        average: 400, // 2000 / 5
        max: 1000,
      },
    ]);
  });

  it("uses the average of the two middle salaries when the count is even", async () => {
    await addPeople("US", [100, 400, 200, 300]);

    const [us] = (await request(app).get("/api/insights/countries")).body;

    expect(us.median).toBe(250); // (200 + 300) / 2
  });

  it("keeps each country separate, in its own currency", async () => {
    await addPeople("IN", [1_000_000, 2_000_000]);
    await addPeople("US", [100_000]);

    const res = await request(app).get("/api/insights/countries");

    expect(res.body.map((r: { country: string; currency: string; max: number }) => [r.country, r.currency, r.max])).toEqual([
      ["IN", "INR", 2_000_000],
      ["US", "USD", 100_000],
    ]);
  });

  it("counts only each employee's current salary, not their old ones", async () => {
    await addEmployee(db, { country: "GB" }, [
      { amount: 50_000, effectiveDate: "2022-01-01" },
      { amount: 60_000, effectiveDate: "2024-01-01", reason: "Annual raise" },
    ]);

    const [gb] = (await request(app).get("/api/insights/countries")).body;

    expect(gb).toMatchObject({ headcount: 1, min: 60_000, max: 60_000 });
  });

  it("returns an empty list when there are no employees", async () => {
    const res = await request(app).get("/api/insights/countries");

    expect(res.body).toEqual([]);
  });
});

describe("GET /api/insights/countries/:country/job-titles", () => {
  it("breaks one country down by job title and ignores other countries", async () => {
    await addPeople("DE", [60_000, 70_000], "Software Engineer");
    await addPeople("DE", [90_000], "Engineering Manager");
    await addPeople("US", [500_000], "Software Engineer");

    const res = await request(app).get("/api/insights/countries/DE/job-titles");

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ country: "DE", currency: "EUR" });
    expect(res.body.jobTitles).toEqual([
      { jobTitle: "Engineering Manager", department: "Engineering", headcount: 1, min: 90_000, median: 90_000, average: 90_000, max: 90_000 },
      { jobTitle: "Software Engineer", department: "Engineering", headcount: 2, min: 60_000, median: 65_000, average: 65_000, max: 70_000 },
    ]);
  });

  it("returns an empty list for a country with no employees", async () => {
    const res = await request(app).get("/api/insights/countries/SG/job-titles");

    expect(res.status).toBe(200);
    expect(res.body.jobTitles).toEqual([]);
  });

  it("rejects an unknown country with a 400", async () => {
    const res = await request(app).get("/api/insights/countries/XX/job-titles");

    expect(res.status).toBe(400);
  });
});

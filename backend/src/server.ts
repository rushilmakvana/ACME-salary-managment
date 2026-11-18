import { mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import { createApp } from "./app.js";
import { createDb } from "./db/client.js";
import { employees } from "./db/schema.js";
import { EMPLOYEE_COUNT, seedDatabase } from "./seed/seed.js";

const port = Number(process.env.PORT ?? 3001);
const url = process.env.DATABASE_URL ?? "file:data/salary.db";
const isProduction = process.env.NODE_ENV === "production";

if (url.startsWith("file:")) mkdirSync("data", { recursive: true });

const db = await createDb(url);

// Free hosting has no lasting disk, so the database starts empty after every restart.
// Fill it with the demo data. An existing database is never touched.
if ((await db.$count(employees)) === 0) {
  const result = await seedDatabase(db, EMPLOYEE_COUNT);
  console.log(`Empty database: seeded ${result.employees} employees`);
}

const app = createApp(db);

// In production one server serves both the API and the built website.
if (isProduction) {
  // Works from both src (dev) and dist (build): both are one level below backend/.
  const websiteFolder = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../frontend/dist");
  app.use(express.static(websiteFolder));
  // Any other page link (like /employees/12) gets the website, and React Router shows the right page.
  // Unknown /api links still get a 404 instead of the website.
  app.get("/{*path}", (req, res, next) => {
    if (req.path.startsWith("/api/")) return next();
    res.sendFile(path.join(websiteFolder, "index.html"));
  });
}

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

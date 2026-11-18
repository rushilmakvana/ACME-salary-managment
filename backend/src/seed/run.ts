// Command line entry: `npm run seed`
import { mkdirSync } from "node:fs";
import { createDb } from "../db/client.js";
import { EMPLOYEE_COUNT, seedDatabase } from "./seed.js";

const url = process.env.DATABASE_URL ?? "file:data/salary.db";

if (url.startsWith("file:")) mkdirSync("data", { recursive: true });

const started = performance.now();
const db = await createDb(url);
const result = await seedDatabase(db, EMPLOYEE_COUNT);
const seconds = ((performance.now() - started) / 1000).toFixed(2);

console.log(`Seeded ${result.employees} employees and ${result.salaries} salary rows in ${seconds}s`);

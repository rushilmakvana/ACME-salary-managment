import type { Db } from "../db/client.js";
import { employees, salaries } from "../db/schema.js";
import { generateSeedData } from "./generate.js";

const BATCH_SIZE = 500;

/** Empties the tables, then fills them with generated employees and salaries. */
export async function seedDatabase(db: Db, count: number, seed = 42) {
  const data = generateSeedData(count, seed);

  // Many rows per insert, all sent as one batch (one transaction):
  // much faster than 10,000+ single inserts, and all-or-nothing.
  const [clearSalaries, ...rest] = [
    db.delete(salaries),
    db.delete(employees),
    ...chunk(data.employees, BATCH_SIZE).map((rows) => db.insert(employees).values(rows)),
    ...chunk(data.salaries, BATCH_SIZE).map((rows) => db.insert(salaries).values(rows)),
  ];
  await db.batch([clearSalaries, ...rest]);

  return { employees: data.employees.length, salaries: data.salaries.length };
}

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size));
  return chunks;
}

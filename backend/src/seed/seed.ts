import type { Db } from "../db/client.js";
import { employees, salaries } from "../db/schema.js";
import { generateSeedData } from "./generate.js";

const BATCH_SIZE = 500;

/** Empties the tables, then fills them with generated employees and salaries. */
export async function seedDatabase(db: Db, count: number, seed = 42) {
  const data = generateSeedData(count, seed);

  // One transaction: all-or-nothing.
  // Inserting 500 rows per statement is much faster than 10,000+ single inserts.
  await db.transaction(async (tx) => {
    await tx.delete(salaries);
    await tx.delete(employees);

    for (const rows of chunk(data.employees, BATCH_SIZE)) {
      await tx.insert(employees).values(rows);
    }
    for (const rows of chunk(data.salaries, BATCH_SIZE)) {
      await tx.insert(salaries).values(rows);
    }
  });

  return { employees: data.employees.length, salaries: data.salaries.length };
}

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size));
  return chunks;
}

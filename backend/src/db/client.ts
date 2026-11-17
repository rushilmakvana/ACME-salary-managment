import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import * as schema from "./schema.js";

// Works from both src/db (dev) and dist/db (build): both are two levels below backend/.
const MIGRATIONS_FOLDER = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../drizzle");

export type Db = Awaited<ReturnType<typeof createDb>>;

/**
 * Opens the database and makes sure all tables exist.
 * url examples: "file:data/salary.db" for the app, ":memory:" for tests.
 */
export async function createDb(url: string) {
  const client = createClient({ url });
  // SQLite only checks foreign keys when this is switched on.
  await client.execute("PRAGMA foreign_keys = ON");

  const db = drizzle(client, { schema });
  await migrate(db, { migrationsFolder: MIGRATIONS_FOLDER });
  return db;
}

import { createDb } from "../../src/db/client.js";

// A fresh, empty in-memory database for each test.
export function createTestDb() {
  return createDb(":memory:");
}

import { mkdirSync } from "node:fs";
import { createApp } from "./app.js";
import { createDb } from "./db/client.js";

const port = Number(process.env.PORT ?? 3001);
const url = process.env.DATABASE_URL ?? "file:data/salary.db";

if (url.startsWith("file:")) mkdirSync("data", { recursive: true });

const db = await createDb(url);

createApp(db).listen(port, () => {
  console.log(`API running on http://localhost:${port}`);
});

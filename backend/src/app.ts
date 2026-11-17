import express, { type ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import type { Db } from "./db/client.js";
import { employeesRouter } from "./routes/employees.js";

// Builds the Express app without starting a server,
// so tests can call it directly with their own database.
export function createApp(db: Db) {
  const app = express();
  app.use(express.json());

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });
  app.use("/api/employees", employeesRouter(db));

  app.use(errorHandler);
  return app;
}

const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  // Bad input from the client: say exactly which field is wrong.
  if (err instanceof ZodError) {
    res.status(400).json({
      error: "Invalid request",
      details: err.issues.map((issue) => ({ field: issue.path.join("."), message: issue.message })),
    });
    return;
  }

  console.error(err);
  res.status(500).json({ error: "Something went wrong" });
};

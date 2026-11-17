import express from "express";

// Builds the Express app without starting a server,
// so tests can call it directly.
export function createApp() {
  const app = express();
  app.use(express.json());

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  return app;
}

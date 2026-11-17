import { Router } from "express";
import { z } from "zod";
import type { Db } from "../db/client.js";
import { COUNTRY_CODES } from "../domain/countries.js";
import { countryInsights, jobTitleInsights } from "../services/insightsService.js";

const countryParamSchema = z.object({ country: z.enum(COUNTRY_CODES) });

export function insightsRouter(db: Db) {
  const router = Router();

  router.get("/countries", async (_req, res) => {
    res.json(await countryInsights(db));
  });

  router.get("/countries/:country/job-titles", async (req, res) => {
    const { country } = countryParamSchema.parse(req.params);
    res.json(await jobTitleInsights(db, country));
  });

  return router;
}

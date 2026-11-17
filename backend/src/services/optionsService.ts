import type { Db } from "../db/client.js";
import { COUNTRIES, COUNTRY_CODES } from "../domain/countries.js";
import { findJobTitles } from "../repositories/employeeRepository.js";

/** Values for the dropdowns in the UI, so the frontend never keeps its own copy. */
export async function getOptions(db: Db) {
  const jobTitles = await findJobTitles(db);

  return {
    countries: COUNTRY_CODES.map((code) => ({ code, ...COUNTRIES[code] })),
    departments: [...new Set(jobTitles.map((j) => j.department))],
    jobTitles, // each with its department, so the UI can narrow titles by department
  };
}

import type { Db } from "../db/client.js";
import { COUNTRIES, type CountryCode } from "../domain/countries.js";
import { payStats } from "../repositories/insightsRepository.js";

/** Pay summary for every country that has employees, in each country's own currency. */
export async function countryInsights(db: Db) {
  const rows = await payStats(db, "country");

  return rows.map(({ groupKey, department: _unused, ...stats }) => {
    const country = COUNTRIES[groupKey as CountryCode];
    return { country: groupKey, countryName: country.name, currency: country.currency, ...stats };
  });
}

/** Pay summary per job title inside one country. */
export async function jobTitleInsights(db: Db, country: CountryCode) {
  const rows = await payStats(db, "jobTitle", country);

  return {
    country,
    countryName: COUNTRIES[country].name,
    currency: COUNTRIES[country].currency,
    jobTitles: rows.map(({ groupKey, department, ...stats }) => ({ jobTitle: groupKey, department: department!, ...stats })),
  };
}

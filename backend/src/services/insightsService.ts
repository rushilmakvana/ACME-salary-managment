import type { Db } from "../db/client.js";
import { COUNTRIES, type CountryCode } from "../domain/countries.js";
import { payStats } from "../domain/payStats.js";
import { findCurrentSalaries } from "../repositories/employeeRepository.js";

type EmployeeSalary = Awaited<ReturnType<typeof findCurrentSalaries>>[number];

/** Pay summary for every country that has employees, in each country's own currency. */
export async function countryInsights(db: Db) {
  const employees = await findCurrentSalaries(db);
  const byCountry = groupAmounts(employees, (e) => e.country);

  return [...byCountry.keys()].sort().map((code) => {
    const country = COUNTRIES[code as CountryCode];
    return { country: code, countryName: country.name, currency: country.currency, ...payStats(byCountry.get(code)!) };
  });
}

/**
 * Pay summary per job title inside one country.
 * Always one country at a time, so salaries in different currencies are never mixed.
 */
export async function jobTitleInsights(db: Db, country: CountryCode) {
  const employees = await findCurrentSalaries(db, country);
  const byJobTitle = groupAmounts(employees, (e) => e.jobTitle);
  const departmentOf = new Map(employees.map((e) => [e.jobTitle, e.department]));

  const jobTitles = [...byJobTitle.keys()]
    .map((jobTitle) => ({ jobTitle, department: departmentOf.get(jobTitle)!, ...payStats(byJobTitle.get(jobTitle)!) }))
    .sort((a, b) => a.department.localeCompare(b.department) || a.jobTitle.localeCompare(b.jobTitle));

  return { country, countryName: COUNTRIES[country].name, currency: COUNTRIES[country].currency, jobTitles };
}

/** Groups current salary amounts by a key, e.g. by country: { IN: [1200000, ...], US: [...] }. */
function groupAmounts(employees: EmployeeSalary[], keyOf: (e: EmployeeSalary) => string) {
  const groups = new Map<string, number[]>();
  for (const employee of employees) {
    const current = employee.salaries[0];
    if (!current) continue; // no salary recorded: nothing to count

    const key = keyOf(employee);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(current.amount);
  }
  return groups;
}

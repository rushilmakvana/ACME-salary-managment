import { sql } from "drizzle-orm";
import type { Db } from "../db/client.js";

export type PayStatsRow = {
  groupKey: string;
  department: string | null;
  headcount: number;
  min: number;
  median: number;
  average: number;
  max: number;
};

/**
 * Pay statistics over each employee's CURRENT salary, calculated inside the database.
 *
 * - groupBy "country": one row per country (each country has one currency).
 * - groupBy "jobTitle": one row per job title, for a single country only,
 *   so salaries in different currencies are never mixed.
 *
 * SQLite has no MEDIAN function, so we number the salaries in order within each group
 * and average the middle one (odd count) or the middle two (even count).
 */
export async function payStats(db: Db, groupBy: "country" | "jobTitle", country?: string) {
  const groupColumn = groupBy === "country" ? sql.raw("e.country") : sql.raw("e.job_title");
  const departmentColumn = groupBy === "country" ? sql.raw("NULL") : sql.raw("e.department");
  const countryFilter = country ? sql`WHERE e.country = ${country}` : sql``;

  return db.all<PayStatsRow>(sql`
    WITH current AS (
      SELECT ${groupColumn} AS group_key, ${departmentColumn} AS department, s.amount
      FROM employees e
      JOIN salaries s ON s.id = (
        SELECT s2.id FROM salaries s2
        WHERE s2.employee_id = e.id
        ORDER BY s2.effective_date DESC, s2.id DESC
        LIMIT 1
      )
      ${countryFilter}
    ),
    ranked AS (
      SELECT group_key, department, amount,
        ROW_NUMBER() OVER (PARTITION BY group_key ORDER BY amount) AS position,
        COUNT(*)     OVER (PARTITION BY group_key)                 AS group_size
      FROM current
    )
    SELECT
      group_key                         AS groupKey,
      MIN(department)                   AS department,
      COUNT(*)                          AS headcount,
      MIN(amount)                       AS min,
      CAST(ROUND(AVG(CASE WHEN position IN ((group_size + 1) / 2, (group_size + 2) / 2)
                          THEN amount END)) AS INTEGER) AS median,
      CAST(ROUND(AVG(amount)) AS INTEGER) AS average,
      MAX(amount)                       AS max
    FROM ranked
    GROUP BY group_key
    ORDER BY MIN(department), group_key
  `);
}

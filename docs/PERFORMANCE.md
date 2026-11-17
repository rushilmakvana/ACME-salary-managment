# Performance

10,000 employees isn't "big data", but a careless design can still make pages slow. Here's what could be slow and what we do about it.

## What could be slow, and our fix

| Risk | Fix |
|------|-----|
| **Sending all 10,000 employees to the browser** | **Server-side paging.** The API returns only one page (25–50 rows). Search and filters run in the database. |
| **Filtering by country, department or job title** | **Database indexes** on these columns, so the database jumps straight to matching rows instead of checking all 10,000. |
| **Finding each employee's current salary** | An **index on `salaries (employee_id, effective_date)`** makes "latest salary per person" a fast lookup. |
| **Calculating pay stats** | Grouping and counting happen **in the database in one query**. We don't load every salary into the app and loop over it. |
| **Seeding 10,000 employees** | Insert in **batches inside one transaction** instead of 10,000 separate inserts. |

## Measured results

> To be filled in after the build, using real timings on the seeded 10,000-employee database.

| What | Target | Measured |
|------|--------|----------|
| Employee list (one page, with filters) | < 100 ms | to be measured |
| Employee details + salary history | < 100 ms | to be measured |
| Pay insights per country | < 300 ms | to be measured |
| Seed script (10,000 employees) | < 10 s | to be measured |

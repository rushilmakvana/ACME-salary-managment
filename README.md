# ACME Salary Management

A web app for ACME's HR Manager to manage salaries for 10,000 employees across six countries, replacing a large Excel sheet. It also answers questions about how the company pays people.

## Live demo

**https://acme-salary-managment.onrender.com**

- The app runs on a free server that sleeps after about 15 minutes, so **the first load can take about 30 seconds**.
- The demo data **resets to the 10,000 seeded employees** whenever the server restarts. See [Trade-offs](docs/TRADEOFFS.md).

## Features

- **Employees:** search by name, filter by country, department and job title, with paging.
- **Add and edit employees**, with clear error messages for invalid input.
- **Salary history:** every salary change is kept with its date and reason, so nothing is overwritten.
- **Pay insights:** min, median, average and max pay per country, plus a job-title breakdown within a country.
- **Seed script:** 10,000 realistic employees. The same data is generated every time.

## Tech stack

| Part | Tools |
|------|-------|
| Backend | Node.js, Express, TypeScript |
| Database | SQLite with Drizzle ORM |
| Validation | Zod |
| Frontend | React (Vite), Mantine, TanStack Query |
| Tests | Vitest, Supertest |
| Hosting | Render |

## Run locally

Needs Node.js 24.

```bash
npm install
npm run seed   # creates 10,000 employees (optional: an empty database is seeded on start)
npm run dev    # backend on :3001, website on :5173
```

Open http://localhost:5173.

## Tests

```bash
npm test
```

51 tests run in a few seconds. Each test gets a fresh in-memory database, so the tests are fast and repeatable and don't affect each other.

They cover the salary maths (including edge cases), input validation, salary history, search, filters, paging, the insights, and the seed.

## Project structure

```
backend/
  src/
    routes/         receive requests and send replies
    services/       business rules and calculations
    repositories/   database queries
    validation/     input checks (Zod)
    domain/         countries and the pay-stats maths
    db/             tables and the database connection
    seed/           generates the 10,000 employees
  tests/
frontend/
  src/
    pages/          Employees, Employee details, Insights
    components/     layout, forms and modals
    api/            calls to the backend
docs/               requirements, plan, architecture, trade-offs
```

## Docs

- [Requirements](docs/REQUIREMENTS.md): the goal, scope, and what we deliberately left out
- [Plan](docs/PLAN.md): the data model, API, pages and build order
- [Architecture](docs/ARCHITECTURE.md): how the pieces connect
- [Trade-offs](docs/TRADEOFFS.md): what we chose, and what each choice costs
- [Performance](docs/PERFORMANCE.md): how the app stays fast with 10,000 employees
- [AI usage](docs/AI_USAGE.md): example prompts used while building

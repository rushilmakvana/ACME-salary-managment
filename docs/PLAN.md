# Plan & Design Notes

This explains **how** we build what's in [REQUIREMENTS.md](REQUIREMENTS.md), in plain words.

---

## 1. Tools we use and why

| Part | Tool | Why we picked it |
|------|------|------------------|
| Language | **TypeScript** | One language for the whole app. Types catch mistakes early. |
| Backend | **Node.js + Express** | Simple, well known, and quick to build with. |
| Database | **SQLite** | A database in a single file. No server to install, fast, and suggested in the brief. 10,000 rows is small for it. |
| Database access | **Drizzle ORM** | Lets us write database queries in TypeScript with type checking. |
| Data checking | **Zod** | Checks that incoming data is valid, for example that salary is a positive number. |
| Frontend | **React (Vite) + Mantine** | React is required. Mantine gives ready-made tables, forms and layouts, so we don't build them ourselves. |
| Tests | **Vitest** | Fast and simple. |

---

## 2. How the pieces connect

See the diagrams in [ARCHITECTURE.md](ARCHITECTURE.md). In short: the React website calls the Express API, and the API reads and writes the SQLite database.

Inside the backend, the code is split into three layers so each part has one job:

| Layer | Its job | Example |
|-------|---------|---------|
| **Routes** | Receive the web request and send the reply | `GET /api/employees` |
| **Services** | The business rules and calculations | "work out the median salary" |
| **Database queries** | Read and write data | "get employees where country = IN" |

This makes the code easy to test. The services can be tested on their own.

---

## 3. How the data is stored

Two tables:

**employees**: one row per person

| Column | Example |
|--------|---------|
| id | 1 |
| full_name | Priya Sharma |
| email | priya.sharma@acme.com |
| job_title | Software Engineer |
| department | Engineering |
| country | IN |
| hire_date | 2022-03-14 |

**salaries**: one row per salary change

| Column | Example |
|--------|---------|
| id | 1 |
| employee_id | 1 (links to Priya) |
| amount | 1800000 |
| currency | INR |
| effective_date | 2025-04-01 |
| reason | Annual raise |

- One employee has **many** salary rows.
- Their **current salary** is the row with the latest date.
- We never edit or delete an old salary row. That's what gives us history.
- Each employee's currency comes from their country (India → INR, US → USD, and so on).
- If an employee's country changes, HR must enter a new salary in the new country's currency at the same time. Otherwise an old INR salary would be counted under the US, and the numbers would mix currencies.

**Performance:** we add database indexes on country, department and job title so filtering 10,000 rows stays instant.

---

## 4. API (the URLs the website calls)

| What | Method & URL |
|------|-------------|
| List employees (search, filter, page) | `GET /api/employees?search=priya&country=IN&page=1` |
| One employee + salary history | `GET /api/employees/:id` |
| Add employee | `POST /api/employees` |
| Edit employee | `PUT /api/employees/:id` |
| Change salary | `POST /api/employees/:id/salaries` |
| Pay summary per country | `GET /api/insights/countries` |
| Pay by job title in one country | `GET /api/insights/countries/:country/job-titles` |

---

## 5. Website pages

1. **Employees.** A search box, filters and a paged table. Clicking a row opens the employee.
2. **Employee details.** Their info, current salary, salary history, plus "Edit" and "Change salary" buttons.
3. **Insights.** A table with one row per country. Clicking a country shows the breakdown by job title.

---

## 6. Seed data

- 10,000 employees across countries: India, United States, United Kingdom, Germany, Singapore and Canada.
- Each job title has a realistic salary range per country. For example, a Software Engineer earns more in the US than in India.
- Uses a **fixed random seed**, so running it twice gives exactly the same data. That keeps demos and tests repeatable.

---

## 7. What we test

We focus tests on the logic that would hurt most if it were wrong:

- **Salary maths:** min, max, average and median, including edge cases such as an even count or an empty list.
- **Validation:** bad emails, negative salaries and missing fields are rejected.
- **Salary history:** a new salary becomes the current one, and old ones are kept.
- **Employee list:** search, filters and paging return the right rows.
- **Seed:** creates exactly 10,000 employees, and produces the same output every time.

Tests use a fresh in-memory database, so they're fast and don't affect each other.

---

## 8. Build order (one commit per step)

1. Docs: requirements and plan
2. Project setup (backend and frontend folders, TypeScript, tests)
3. Database tables
4. Seed script for 10,000 employees
5. Employee list API + tests
6. Add/edit employee and salary change API + tests
7. Insights API + tests
8. Employees page
9. Employee details page (edit + change salary)
10. Insights page
11. Deploy
12. README, AI usage notes, video demo

---

## 9. How we use AI

We use Claude Code to write code faster, but every piece is reviewed and tested.
Example prompts we used are listed in [AI_USAGE.md](AI_USAGE.md).

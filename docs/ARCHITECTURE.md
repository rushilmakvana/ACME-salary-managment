# Architecture

Two small diagrams that show how the app is put together.

---

## 1. System overview: how a request travels

```
  ┌──────────────┐
  │  HR Manager  │
  └──────┬───────┘
         │ uses
         ▼
  ┌──────────────┐
  │ React website│   shows data, never calculates it
  └──────┬───────┘
         │ HTTP / JSON
         ▼
  ┌─────────────────── Express backend ───────────────────┐
  │                                                       │
  │   ┌──────────┐     ┌──────────┐     ┌──────────────┐  │
  │   │  Routes  │ ──▶ │ Services │ ──▶ │  DB queries  │  │
  │   └──────────┘     └──────────┘     └──────┬───────┘  │
  │   receive request  business rules   Drizzle ORM       │
  │   check input      and maths              │           │
  └───────────────────────────────────────────┼───────────┘
                                              ▼
                                      ┌───────────────┐
                                      │    SQLite     │
                                      │ database file │
                                      └───────────────┘
```

- The **website** only shows data. It never calculates salaries or stats itself.
- Each backend layer has **one job**:
  - Routes handle the web request.
  - Services hold the rules.
  - Queries talk to the database.
- Because the rules live in the services, we can **test them without starting the website or a server**.

---

## 2. Data model: how the data is stored

```
  ┌─────────────────────────┐            ┌─────────────────────────┐
  │        employees        │            │        salaries         │
  ├─────────────────────────┤            ├─────────────────────────┤
  │ id            (PK)      │ 1 ───── *  │ id              (PK)    │
  │ full_name               │            │ employee_id     (FK)    │
  │ email         (unique)  │            │ amount   (whole number) │
  │ job_title               │            │ currency                │
  │ department              │            │ effective_date          │
  │ country                 │            │ reason                  │
  │ hire_date               │            │                         │
  └─────────────────────────┘            └─────────────────────────┘

        1 ───── *  =  one employee has many salary rows
```

- **One employee → many salary rows.** Every salary change adds a new row.
- **Current salary** is the row with the latest `effective_date`.
- Old salary rows are **never changed or deleted**, which gives us a full history.
- `currency` always matches the employee's country, so stats never mix currencies.

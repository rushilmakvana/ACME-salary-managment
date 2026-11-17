# Trade-offs

Every choice has a cost. This table shows what we picked, what we didn't, and why.

| Decision | We chose | Instead of | Why |
|----------|----------|------------|-----|
| **Database** | SQLite | PostgreSQL | No server to set up, tests run on a temporary in-memory database, and 10,000 rows is small. **Cost:** not built for many users writing at once. Drizzle makes a later switch to PostgreSQL small. |
| **Salary changes** | Add a new row each time | Overwrite the old salary | Keeps full history: what changed, when, and why. **Cost:** finding the "current" salary needs one extra step (latest date). |
| **Currency** | Compare salaries only within a country | Convert everything to USD | Always correct, and needs no exchange-rate data. **Cost:** no single company-wide average across countries. |
| **Paging and filtering** | Done on the server | Load all 10,000 rows into the browser | The browser stays fast and only gets 25–50 rows at a time. **Cost:** each page or filter change is a new request. |
| **Login** | Left out | Build user accounts | There's only one user, so effort goes into the core problem. **Cost:** not safe to expose real data publicly as it is. |
| **Project layout** | Two folders (backend, frontend) | Monorepo with a shared code package | Faster to set up and easier to understand. **Cost:** some types are written in both places. |
| **Deleting employees** | Not allowed | Allow delete | Deleting would destroy salary history. **Cost:** people who leave stay in the data. |

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
| **Hosting** | One Render server serves the API and the website | Vercel, or a separate frontend and backend | Our backend is a normal Express server, which Render runs as-is. Vercel runs short-lived functions, so each copy would have its own SQLite file and saved data would seem to disappear. **Cost:** the free server sleeps after about 15 minutes, so the first load takes about 30 seconds. For an app of this size, Render is enough. |
| **Live database** | A SQLite file on the server, seeded on start | A hosted database (e.g. Turso or PostgreSQL) | No extra account or secrets to manage, and the same setup as on a laptop. **Cost:** the free server has no lasting disk, so demo edits reset to the 10,000 seeded employees after a restart. A hosted database isn't needed for this demo, but in production we'd use one. |
| **Docker and CI pipeline** | Left out. Render runs the tests on every deploy. | Docker image + GitHub Actions | One server and one person don't need them: Render's build command runs all tests first and stops the deploy if any fail. **Cost:** no automatic test run on pull requests, and the server setup isn't packaged as a container. Not needed for this demo; we'd add both once a team works on the code. |

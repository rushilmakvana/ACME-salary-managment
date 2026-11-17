# Requirements: ACME Salary Management

**Who uses it:** the HR Manager at ACME
**Size:** about 10,000 employees in several countries

---

## 1. The problem

ACME keeps everyone's salary in Excel files. This causes four problems:

1. **Slow to work with.** Finding one person among 10,000 rows and changing their salary takes too long.
2. **No history.** When a salary is changed, the old value is lost.
3. **Hard to answer questions.** "What do we pay engineers in India?" needs a manual pivot table every time.
4. **Easy to get wrong.** Excel lets you average Indian Rupees and US Dollars together, which gives a meaningless number.

## 2. The goal

Give the HR Manager a simple website where they can:

- **find and update** any employee's salary quickly, and
- **see how the company pays people**, with correct numbers.

## 3. What we will build

| # | Feature | What it does | Why it matters |
|---|---------|--------------|----------------|
| 1 | **Employee list** | A table of all employees, shown page by page. You can search by name and filter by country, department and job title. | This is the HR Manager's most common daily task. |
| 2 | **Add / edit employee** | A form that checks the data, for example a valid email and a positive salary. | Stops bad data from getting in, which Excel can't do. |
| 3 | **Salary history** | Changing a salary adds a new entry instead of overwriting the old one. The employee page shows every past salary. | HR can see what changed, when, and why. |
| 4 | **Pay insights** | For each country: number of people, and the lowest, average, median and highest salary. You can also break a country down by job title. All numbers are calculated **within one country's currency**, never mixed. | Directly answers "how do we pay people?", with correct numbers. |
| 5 | **Seed script** | One command fills the database with 10,000 realistic employees. It creates the same data every time. | Required by the brief. Gives repeatable demos and tests. |


## 4. What we are NOT building (and why)

| Not building | Why |
|--------------|-----|
| Login / user accounts | There is only one user, the HR Manager. Proper login is a big job and doesn't help answer the core problem. It can be added later. |
| Deleting employees | Deleting would destroy salary history. Not needed for this version. |
| Payroll, tax, payslips | That's a different product with different laws in every country. We manage salary *data*, not payments. |
| Bonuses, stock, benefits | Base salary answers the main question. These can be added later. |
| Converting all salaries to one currency | This needs exchange rates and choices about which date to use. Comparing within each country is simpler and always correct. |
| Importing Excel files | Cleaning messy spreadsheets is a project of its own. The seed script covers the starting data. |
| Approvals, CSV export, charts beyond the basics | Nice to have. Left out to deliver the core well and on time. |


## 5. Assumptions

- Each employee is paid in their own country's currency.
- Salaries are yearly amounts.
- Salaries are stored as whole numbers (no decimals) to avoid rounding mistakes.

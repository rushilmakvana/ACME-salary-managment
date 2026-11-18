import { relations, sql } from "drizzle-orm";
import { check, index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

// One row per person.
export const employees = sqliteTable(
  "employees",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    fullName: text("full_name").notNull(),
    email: text("email").notNull().unique(),
    jobTitle: text("job_title").notNull(),
    department: text("department").notNull(),
    country: text("country").notNull(), // ISO code, e.g. "IN"
    hireDate: text("hire_date").notNull(), // ISO date, e.g. "2022-03-14"
  },
  (t) => [
    // Speed up the filters on the employee list.
    index("employees_country_idx").on(t.country),
    index("employees_department_idx").on(t.department),
    index("employees_job_title_idx").on(t.jobTitle),
  ],
);

// One row per salary change. Rows are only ever added, never edited,
// so together they form the salary history.
export const salaries = sqliteTable(
  "salaries",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    employeeId: integer("employee_id")
      .notNull()
      .references(() => employees.id),
    amount: integer("amount").notNull(), // yearly, whole currency units
    currency: text("currency").notNull(),
    effectiveDate: text("effective_date").notNull(), // ISO date
    reason: text("reason").notNull(),
  },
  (t) => [
    // Fast "latest salary for this employee" lookups.
    index("salaries_employee_date_idx").on(t.employeeId, t.effectiveDate),
    // Last line of defence: the database itself refuses zero or negative pay.
    check("salaries_amount_positive", sql`${t.amount} > 0`),
  ],
);

// Tells Drizzle how the tables connect, so queries can ask for
// "an employee with their salaries" without writing joins by hand.
export const employeesRelations = relations(employees, ({ many }) => ({
  salaries: many(salaries),
}));

export const salariesRelations = relations(salaries, ({ one }) => ({
  employee: one(employees, { fields: [salaries.employeeId], references: [employees.id] }),
}));

export type Employee = typeof employees.$inferSelect;
export type NewEmployee = typeof employees.$inferInsert;
export type Salary = typeof salaries.$inferSelect;
export type NewSalary = typeof salaries.$inferInsert;

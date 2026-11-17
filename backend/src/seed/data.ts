import type { CountryCode } from "../domain/countries.js";

export const FIRST_NAMES = [
  "Aarav", "Priya", "Rahul", "Ananya", "Vikram", "Sneha", "James", "Emily", "Michael", "Sarah",
  "David", "Olivia", "Lukas", "Hannah", "Felix", "Lena", "Wei", "Mei", "Jun", "Hui",
  "Liam", "Emma", "Noah", "Chloe", "Omar", "Fatima", "Daniel", "Sofia", "Arjun", "Isha",
] as const;

export const LAST_NAMES = [
  "Sharma", "Patel", "Iyer", "Reddy", "Gupta", "Smith", "Johnson", "Brown", "Taylor", "Wilson",
  "Muller", "Schmidt", "Fischer", "Weber", "Tan", "Lim", "Ng", "Wong", "Martin", "Roy",
  "Campbell", "Clarke", "Evans", "Walker", "Khan", "Ali", "Singh", "Mehta", "Lee", "Chen",
] as const;

// Share of employees in each country (adds up to 100).
export const COUNTRY_WEIGHTS: readonly (readonly [CountryCode, number])[] = [
  ["IN", 35],
  ["US", 25],
  ["GB", 12],
  ["DE", 10],
  ["CA", 10],
  ["SG", 8],
];

// How much a job pays in each country compared to the US, in local currency.
// Example: a US$100,000 job pays about 12,00,000 INR in India (factor 12).
export const COUNTRY_PAY_FACTOR: Record<CountryCode, number> = {
  US: 1,
  IN: 12,
  GB: 0.65,
  DE: 0.65,
  SG: 0.9,
  CA: 0.95,
};

export type Job = { title: string; minUsd: number; maxUsd: number; weight: number };

// 4 departments x 3 job titles. Pay ranges are yearly, US market.
// weight = how common the job is inside its department.
export const DEPARTMENTS: Record<string, readonly Job[]> = {
  Engineering: [
    { title: "Software Engineer", minUsd: 90_000, maxUsd: 130_000, weight: 50 },
    { title: "Senior Software Engineer", minUsd: 130_000, maxUsd: 180_000, weight: 35 },
    { title: "Engineering Manager", minUsd: 170_000, maxUsd: 230_000, weight: 15 },
  ],
  Sales: [
    { title: "Sales Representative", minUsd: 55_000, maxUsd: 80_000, weight: 50 },
    { title: "Account Executive", minUsd: 80_000, maxUsd: 120_000, weight: 35 },
    { title: "Sales Manager", minUsd: 120_000, maxUsd: 170_000, weight: 15 },
  ],
  Marketing: [
    { title: "Marketing Associate", minUsd: 55_000, maxUsd: 75_000, weight: 50 },
    { title: "Marketing Specialist", minUsd: 70_000, maxUsd: 100_000, weight: 35 },
    { title: "Marketing Manager", minUsd: 100_000, maxUsd: 150_000, weight: 15 },
  ],
  "Human Resources": [
    { title: "HR Coordinator", minUsd: 50_000, maxUsd: 70_000, weight: 50 },
    { title: "HR Business Partner", minUsd: 80_000, maxUsd: 115_000, weight: 35 },
    { title: "HR Manager", minUsd: 100_000, maxUsd: 140_000, weight: 15 },
  ],
};

// Share of employees in each department.
export const DEPARTMENT_WEIGHTS: readonly (readonly [string, number])[] = [
  ["Engineering", 40],
  ["Sales", 25],
  ["Marketing", 20],
  ["Human Resources", 15],
];

/** Pay range for a job in a country, in that country's currency. */
export function payRange(job: Job, country: CountryCode) {
  const factor = COUNTRY_PAY_FACTOR[country];
  return { min: Math.round(job.minUsd * factor), max: Math.round(job.maxUsd * factor) };
}

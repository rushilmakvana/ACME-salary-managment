// Shapes of the API responses. Kept in sync by hand with the backend
// (see docs/TRADEOFFS.md: "Project layout").

export type Salary = {
  amount: number;
  currency: string;
  effectiveDate: string;
};

export type EmployeeListItem = {
  id: number;
  fullName: string;
  email: string;
  jobTitle: string;
  department: string;
  country: string;
  hireDate: string;
  currentSalary: Salary | null;
};

export type EmployeePage = {
  items: EmployeeListItem[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type EmployeeFilters = {
  search?: string;
  country?: string;
  department?: string;
  jobTitle?: string;
  page: number;
};

export type Options = {
  countries: { code: string; name: string; currency: string }[];
  departments: string[];
  jobTitles: { department: string; jobTitle: string }[];
};

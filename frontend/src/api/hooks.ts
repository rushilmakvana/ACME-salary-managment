import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, toQuery } from "./client";
import type {
  CountryInsight,
  CreateEmployeeInput,
  JobTitleInsights,
  EmployeeDetail,
  EmployeeFilters,
  EmployeePage,
  Options,
  SalaryChangeInput,
  UpdateEmployeeInput,
} from "./types";

export function useOptions() {
  return useQuery({
    queryKey: ["options"],
    queryFn: () => api<Options>("/options"),
    staleTime: 5 * 60 * 1000, // these lists rarely change
  });
}

export function useEmployees(filters: EmployeeFilters) {
  return useQuery({
    queryKey: ["employees", filters],
    queryFn: () => api<EmployeePage>(`/employees${toQuery({ ...filters, pageSize: 25 })}`),
    // Keep showing the current page while the next one loads, instead of flashing empty.
    placeholderData: keepPreviousData,
  });
}

export function useCountryInsights() {
  return useQuery({
    queryKey: ["insights", "countries"],
    queryFn: () => api<CountryInsight[]>("/insights/countries"),
  });
}

export function useJobTitleInsights(country: string | undefined) {
  return useQuery({
    queryKey: ["insights", "job-titles", country],
    queryFn: () => api<JobTitleInsights>(`/insights/countries/${country}/job-titles`),
    enabled: country !== undefined, // only once a country is picked
  });
}

export function useEmployee(id: number) {
  return useQuery({
    queryKey: ["employee", id],
    queryFn: () => api<EmployeeDetail>(`/employees/${id}`),
  });
}

/**
 * After any change, mark the cached lists, details and insights as out of date
 * so every page shows fresh numbers.
 */
function useRefreshAfterSave() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries();
}

export function useCreateEmployee() {
  const refresh = useRefreshAfterSave();
  return useMutation({
    mutationFn: (input: CreateEmployeeInput) => api<EmployeeDetail>("/employees", { method: "POST", body: input }),
    onSuccess: refresh,
  });
}

export function useUpdateEmployee(id: number) {
  const refresh = useRefreshAfterSave();
  return useMutation({
    mutationFn: (input: UpdateEmployeeInput) => api<EmployeeDetail>(`/employees/${id}`, { method: "PUT", body: input }),
    onSuccess: refresh,
  });
}

export function useChangeSalary(id: number) {
  const refresh = useRefreshAfterSave();
  return useMutation({
    mutationFn: (input: SalaryChangeInput) =>
      api<EmployeeDetail>(`/employees/${id}/salaries`, { method: "POST", body: input }),
    onSuccess: refresh,
  });
}

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { api, toQuery } from "./client";
import type { EmployeeFilters, EmployeePage, Options } from "./types";

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

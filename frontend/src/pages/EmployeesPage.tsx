import {
  Alert,
  Anchor,
  Button,
  Group,
  Loader,
  Pagination,
  Select,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { useDebouncedValue, useDisclosure } from "@mantine/hooks";
import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { useEmployees, useOptions } from "../api/hooks";
import { AddEmployeeModal } from "../components/AddEmployeeModal";
import { formatMoney } from "../lib/format";

export function EmployeesPage() {
  // Filters live in the URL, so refresh, back button and shared links keep the same view.
  const [params, setParams] = useSearchParams();
  const filters = {
    search: params.get("search") ?? undefined,
    country: params.get("country") ?? undefined,
    department: params.get("department") ?? undefined,
    jobTitle: params.get("jobTitle") ?? undefined,
    page: Number(params.get("page") ?? 1),
  };

  /** Changes some filters and goes back to page 1 (unless the page itself is being changed). */
  function update(changes: Record<string, string | null | undefined>) {
    setParams((current) => {
      const next = new URLSearchParams(current);
      for (const [key, value] of Object.entries(changes)) {
        if (value) next.set(key, value);
        else next.delete(key);
      }
      if (!("page" in changes)) next.delete("page");
      return next;
    });
  }

  // Wait until typing pauses before searching, instead of one request per key press.
  const [searchText, setSearchText] = useState(filters.search ?? "");
  const [debouncedSearch] = useDebouncedValue(searchText.trim(), 300);
  useEffect(() => {
    if (debouncedSearch !== (filters.search ?? "")) update({ search: debouncedSearch });
  }, [debouncedSearch]); // only react to the typed text, not to every URL change

  const options = useOptions();
  const employees = useEmployees(filters);
  const navigate = useNavigate();
  const [addOpened, addForm] = useDisclosure(false);

  const countryName = (code: string) => options.data?.countries.find((c) => c.code === code)?.name ?? code;
  // Only show job titles from the chosen department.
  const jobTitleChoices = (options.data?.jobTitles ?? [])
    .filter((j) => !filters.department || j.department === filters.department)
    .map((j) => j.jobTitle);

  // Row numbers for "Showing 26–50 of 10,000" under the table.
  const firstRow = employees.data ? (employees.data.page - 1) * employees.data.pageSize + 1 : 0;
  const lastRow = employees.data ? firstRow + employees.data.items.length - 1 : 0;

  return (
    <Stack>
      <Group justify="space-between">
        <Group align="baseline">
          <Title order={2}>Employees</Title>
          {employees.data && <Text c="dimmed">{employees.data.total.toLocaleString("en-US")} found</Text>}
        </Group>
        <Button onClick={addForm.open}>+ Add employee</Button>
      </Group>

      {addOpened && (
        <AddEmployeeModal onClose={addForm.close} onCreated={(created) => navigate(`/employees/${created.id}`)} />
      )}

      <Group grow wrap="wrap" align="end">
        <TextInput
          label="Search"
          placeholder="Search by name"
          value={searchText}
          onChange={(e) => setSearchText(e.currentTarget.value)}
          miw={200}
        />
        <Select
          label="Country"
          placeholder="All countries"
          data={options.data?.countries.map((c) => ({ value: c.code, label: c.name })) ?? []}
          value={filters.country ?? null}
          onChange={(value) => update({ country: value })}
          clearable
          miw={160}
        />
        <Select
          label="Department"
          placeholder="All departments"
          data={options.data?.departments ?? []}
          value={filters.department ?? null}
          onChange={(value) => {
            // Drop a job title that doesn't belong to the new department.
            const keepTitle = options.data?.jobTitles.some(
              (j) => j.jobTitle === filters.jobTitle && j.department === value,
            );
            update({ department: value, jobTitle: keepTitle ? filters.jobTitle : null });
          }}
          clearable
          miw={160}
        />
        <Select
          label="Job title"
          placeholder="All job titles"
          data={jobTitleChoices}
          value={filters.jobTitle ?? null}
          onChange={(value) => update({ jobTitle: value })}
          clearable
          searchable
          miw={200}
        />
      </Group>

      {employees.isError && <Alert color="red">Couldn't load employees: {employees.error.message}</Alert>}

      {employees.isPending ? (
        <Group justify="center" p="xl">
          <Loader />
        </Group>
      ) : employees.data && employees.data.items.length === 0 ? (
        <Text c="dimmed" ta="center" p="xl">
          No employees match these filters.
        </Text>
      ) : (
        employees.data && (
          <>
            <Table.ScrollContainer minWidth={760}>
              <Table striped highlightOnHover style={{ opacity: employees.isPlaceholderData ? 0.6 : 1 }}>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Name</Table.Th>
                    <Table.Th>Job title</Table.Th>
                    <Table.Th>Department</Table.Th>
                    <Table.Th>Country</Table.Th>
                    <Table.Th style={{ textAlign: "right" }}>Current salary (yearly)</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {employees.data.items.map((e) => (
                    <Table.Tr key={e.id} onClick={() => navigate(`/employees/${e.id}`)} style={{ cursor: "pointer" }}>
                      <Table.Td>
                        <Anchor component={Link} to={`/employees/${e.id}`} onClick={(ev) => ev.stopPropagation()}>
                          {e.fullName}
                        </Anchor>
                      </Table.Td>
                      <Table.Td>{e.jobTitle}</Table.Td>
                      <Table.Td>{e.department}</Table.Td>
                      <Table.Td>{countryName(e.country)}</Table.Td>
                      <Table.Td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                        {e.currentSalary ? formatMoney(e.currentSalary.amount, e.currentSalary.currency) : "—"}
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Table.ScrollContainer>

            <Group justify="space-between">
              <Text c="dimmed" size="sm">
                Showing {firstRow.toLocaleString("en-US")}–{lastRow.toLocaleString("en-US")} of{" "}
                {employees.data.total.toLocaleString("en-US")}
              </Text>
              {employees.data.totalPages > 1 && (
                <Pagination
                  total={employees.data.totalPages}
                  value={filters.page}
                  onChange={(page) => update({ page: String(page) })}
                />
              )}
            </Group>
          </>
        )
      )}
    </Stack>
  );
}

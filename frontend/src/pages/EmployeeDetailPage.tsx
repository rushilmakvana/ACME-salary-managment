import { Alert, Anchor, Badge, Button, Card, Group, Loader, Stack, Table, Text, Title } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { Link, useParams } from "react-router";
import { ApiError } from "../api/client";
import { useEmployee, useOptions } from "../api/hooks";
import { EmployeeFormModal } from "../components/EmployeeFormModal";
import { SalaryChangeModal } from "../components/SalaryChangeModal";
import { formatDate, formatMoney } from "../lib/format";

export function EmployeeDetailPage() {
  const id = Number(useParams().id);
  const employee = useEmployee(id);
  const options = useOptions();
  const [editOpened, edit] = useDisclosure(false);
  const [salaryOpened, salary] = useDisclosure(false);

  const back = (
    <Anchor component={Link} to="/employees" size="sm">
      ← Back to employees
    </Anchor>
  );

  if (employee.isPending) {
    return (
      <Group justify="center" p="xl">
        <Loader />
      </Group>
    );
  }
  if (employee.isError) {
    const notFound = employee.error instanceof ApiError && employee.error.status === 404;
    return (
      <Stack>
        {back}
        <Alert color={notFound ? "yellow" : "red"}>
          {notFound ? "This employee doesn't exist." : `Couldn't load the employee: ${employee.error.message}`}
        </Alert>
      </Stack>
    );
  }

  const e = employee.data;
  const countryName = options.data?.countries.find((c) => c.code === e.country)?.name ?? e.country;

  return (
    <Stack>
      {back}

      <Group justify="space-between" align="start">
        <Stack gap={4}>
          <Title order={2}>{e.fullName}</Title>
          <Text c="dimmed">
            {e.jobTitle} · {e.department} · {countryName} · {e.email} · Hired {formatDate(e.hireDate)}
          </Text>
        </Stack>
        <Group>
          <Button variant="default" onClick={edit.open}>
            Edit details
          </Button>
          <Button onClick={salary.open}>Change salary</Button>
        </Group>
      </Group>

      <Card withBorder>
        <Text size="sm" c="dimmed">
          Current salary
        </Text>
        <Text size="xl" fw={700} style={{ fontVariantNumeric: "tabular-nums" }}>
          {e.currentSalary ? `${formatMoney(e.currentSalary.amount, e.currentSalary.currency)} / year` : "No salary recorded"}
        </Text>
      </Card>

      <Title order={4}>Salary history</Title>
      <Table.ScrollContainer minWidth={480}>
        <Table striped>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Effective from</Table.Th>
              <Table.Th style={{ textAlign: "right" }}>Yearly salary</Table.Th>
              <Table.Th>Reason</Table.Th>
              <Table.Th />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {e.salaryHistory.map((s, index) => (
              <Table.Tr key={s.id}>
                <Table.Td>{formatDate(s.effectiveDate)}</Table.Td>
                <Table.Td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                  {formatMoney(s.amount, s.currency)}
                </Table.Td>
                <Table.Td>{s.reason}</Table.Td>
                <Table.Td>{index === 0 && <Badge variant="light">Current</Badge>}</Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Table.ScrollContainer>

      {/* Mounted only while open, so each time it starts from the latest saved values. */}
      {editOpened && <EmployeeFormModal mode="edit" employee={e} opened onClose={edit.close} />}
      {salaryOpened && <SalaryChangeModal employee={e} opened onClose={salary.close} />}
    </Stack>
  );
}

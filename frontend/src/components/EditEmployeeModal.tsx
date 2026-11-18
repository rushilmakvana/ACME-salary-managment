import { Alert, Button, Divider, Group, Modal, Stack, Text } from "@mantine/core";
import { useState } from "react";
import { useOptions, useUpdateEmployee } from "../api/hooks";
import type { EmployeeDetail, EmployeeDetailsInput } from "../api/types";
import { formError, todayIso } from "../lib/forms";
import { EmployeeDetailsFields } from "./EmployeeDetailsFields";
import { SalaryFields, type SalaryDraft } from "./SalaryFields";

type Props = { employee: EmployeeDetail; onClose: () => void };

const FIELDS = [
  "fullName",
  "email",
  "department",
  "jobTitle",
  "country",
  "newSalary.amount",
  "newSalary.effectiveDate",
  "newSalary.reason",
];

/** Shown only while open, so the form always starts from the latest saved values. */
export function EditEmployeeModal({ employee, onClose }: Props) {
  const [details, setDetails] = useState<EmployeeDetailsInput>({
    fullName: employee.fullName,
    email: employee.email,
    department: employee.department,
    jobTitle: employee.jobTitle,
    country: employee.country,
  });
  const [newSalary, setNewSalary] = useState<SalaryDraft>({ amount: "", effectiveDate: todayIso(), reason: "Relocation" });

  const options = useOptions();
  const updateEmployee = useUpdateEmployee(employee.id);
  const topError = formError(updateEmployee.error, FIELDS);

  // Currency rule: moving to another country needs a new salary in that country's currency.
  const countryChanged = details.country !== employee.country;
  const newCurrency = options.data?.countries.find((c) => c.code === details.country)?.currency ?? "";

  function submit() {
    updateEmployee.mutate(
      { ...details, newSalary: countryChanged ? { ...newSalary, amount: Number(newSalary.amount) } : undefined },
      { onSuccess: onClose },
    );
  }

  return (
    <Modal opened onClose={onClose} title={`Edit details: ${employee.fullName}`} size="lg">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <Stack>
          <EmployeeDetailsFields value={details} onChange={setDetails} error={updateEmployee.error} />

          {countryChanged && (
            <>
              <Divider />
              <Text size="sm">
                Moving to a new country needs a new salary in <b>{newCurrency}</b>. The old salary stays in the history.
              </Text>
              <SalaryFields
                value={newSalary}
                onChange={setNewSalary}
                currency={newCurrency}
                minDate={employee.hireDate}
                error={updateEmployee.error}
                fieldPrefix="newSalary."
              />
            </>
          )}

          {topError && <Alert color="red">{topError}</Alert>}

          <Group justify="end">
            <Button variant="default" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={updateEmployee.isPending}>
              Save changes
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}

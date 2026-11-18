import { Alert, Button, Group, Modal, Stack, Text } from "@mantine/core";
import { useState } from "react";
import { useChangeSalary } from "../api/hooks";
import type { EmployeeDetail } from "../api/types";
import { formatMoney } from "../lib/format";
import { formError, todayIso } from "../lib/forms";
import { SalaryFields, type SalaryDraft } from "./SalaryFields";

type Props = { employee: EmployeeDetail; onClose: () => void };

/** Shown only while open, so the form always starts empty. */
export function SalaryChangeModal({ employee, onClose }: Props) {
  const [salary, setSalary] = useState<SalaryDraft>({ amount: "", effectiveDate: todayIso(), reason: "Annual raise" });
  const changeSalary = useChangeSalary(employee.id);
  const current = employee.currentSalary;
  const topError = formError(changeSalary.error, ["amount", "effectiveDate", "reason"]);

  function submit() {
    changeSalary.mutate({ ...salary, amount: Number(salary.amount) }, { onSuccess: onClose });
  }

  return (
    <Modal opened onClose={onClose} title={`Change salary: ${employee.fullName}`} size="lg">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <Stack>
          {current && (
            <Text size="sm" c="dimmed">
              Current: {formatMoney(current.amount, current.currency)} per year. The old salary stays in the history.
            </Text>
          )}
          <SalaryFields
            value={salary}
            onChange={setSalary}
            currency={current?.currency ?? ""}
            minDate={employee.hireDate}
            error={changeSalary.error}
          />
          {topError && <Alert color="red">{topError}</Alert>}
          <Group justify="end">
            <Button variant="default" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={changeSalary.isPending}>
              Save salary
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}

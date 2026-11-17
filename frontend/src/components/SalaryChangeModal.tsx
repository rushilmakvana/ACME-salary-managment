import { Alert, Button, Group, Modal, Stack, Text } from "@mantine/core";
import { useState } from "react";
import { useChangeSalary } from "../api/hooks";
import type { EmployeeDetail } from "../api/types";
import { formatMoney } from "../lib/format";
import { formError, todayIso } from "../lib/forms";
import { emptySalaryDraft, SalaryFields, toSalaryInput } from "./SalaryFields";

type Props = { employee: EmployeeDetail; opened: boolean; onClose: () => void };

export function SalaryChangeModal({ employee, opened, onClose }: Props) {
  const [draft, setDraft] = useState(() => emptySalaryDraft(todayIso()));
  const changeSalary = useChangeSalary(employee.id);
  const current = employee.currentSalary;
  const close = onClose; // mounted only while open, so no state to reset

  return (
    <Modal opened={opened} onClose={close} title={`Change salary: ${employee.fullName}`} size="lg">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          changeSalary.mutate(toSalaryInput(draft), { onSuccess: close });
        }}
      >
        <Stack>
          {current && (
            <Text size="sm" c="dimmed">
              Current: {formatMoney(current.amount, current.currency)} per year. The old salary stays in the history.
            </Text>
          )}
          <SalaryFields
            value={draft}
            onChange={setDraft}
            currency={current?.currency ?? ""}
            minDate={employee.hireDate}
            error={changeSalary.error}
          />
          {formError(changeSalary.error, ["amount", "effectiveDate", "reason"]) && (
            <Alert color="red">{formError(changeSalary.error, ["amount", "effectiveDate", "reason"])}</Alert>
          )}
          <Group justify="end">
            <Button variant="default" onClick={close}>
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

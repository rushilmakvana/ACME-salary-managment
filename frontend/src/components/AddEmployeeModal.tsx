import { Alert, Button, Group, Modal, NumberInput, Stack, TextInput } from "@mantine/core";
import { useState } from "react";
import { useCreateEmployee, useOptions } from "../api/hooks";
import type { EmployeeDetail, EmployeeDetailsInput } from "../api/types";
import { fieldError, formError, todayIso } from "../lib/forms";
import { EmployeeDetailsFields } from "./EmployeeDetailsFields";

type Props = {
  onClose: () => void;
  onCreated: (employee: EmployeeDetail) => void;
};

const FIELDS = ["fullName", "email", "department", "jobTitle", "country", "hireDate", "salary"];

/** Shown only while open, so the form always starts empty. */
export function AddEmployeeModal({ onClose, onCreated }: Props) {
  const [details, setDetails] = useState<EmployeeDetailsInput>({
    fullName: "",
    email: "",
    department: "",
    jobTitle: "",
    country: "",
  });
  const [hireDate, setHireDate] = useState(todayIso());
  const [salary, setSalary] = useState<number | "">("");

  const options = useOptions();
  const createEmployee = useCreateEmployee();
  const currency = options.data?.countries.find((c) => c.code === details.country)?.currency;
  const topError = formError(createEmployee.error, FIELDS);

  function submit() {
    createEmployee.mutate(
      { ...details, hireDate, salary: Number(salary) },
      {
        onSuccess: (created) => {
          onClose();
          onCreated(created);
        },
      },
    );
  }

  return (
    <Modal opened onClose={onClose} title="Add employee" size="lg">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <Stack>
          <EmployeeDetailsFields value={details} onChange={setDetails} error={createEmployee.error} />

          <Group grow align="start">
            <TextInput
              label="Hire date"
              type="date"
              value={hireDate}
              onChange={(e) => setHireDate(e.currentTarget.value)}
              required
              error={fieldError(createEmployee.error, "hireDate")}
            />
            <NumberInput
              label={currency ? `Starting yearly salary (${currency})` : "Starting yearly salary"}
              value={salary}
              onChange={(value) => setSalary(value === "" ? "" : Number(value))}
              min={1}
              allowDecimal={false}
              allowNegative={false}
              thousandSeparator=","
              required
              error={fieldError(createEmployee.error, "salary")}
            />
          </Group>

          {topError && <Alert color="red">{topError}</Alert>}

          <Group justify="end">
            <Button variant="default" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={createEmployee.isPending}>
              Add employee
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}

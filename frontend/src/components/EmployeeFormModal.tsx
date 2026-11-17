import { Alert, Button, Divider, Group, Modal, NumberInput, Select, Stack, Text, TextInput } from "@mantine/core";
import { useState } from "react";
import { useCreateEmployee, useOptions, useUpdateEmployee } from "../api/hooks";
import type { EmployeeDetail, EmployeeDetailsInput } from "../api/types";
import { fieldError, formError, todayIso } from "../lib/forms";
import { emptySalaryDraft, SalaryFields, toSalaryInput, type SalaryDraft } from "./SalaryFields";

type Props =
  | { mode: "create"; opened: boolean; onClose: () => void; onCreated: (employee: EmployeeDetail) => void }
  | { mode: "edit"; employee: EmployeeDetail; opened: boolean; onClose: () => void };

const DETAIL_FIELDS = ["fullName", "email", "department", "jobTitle", "country"];
const CREATE_FIELDS = [...DETAIL_FIELDS, "hireDate", "salary"];
const EDIT_FIELDS = [...DETAIL_FIELDS, "newSalary.amount", "newSalary.effectiveDate", "newSalary.reason"];

const blankDetails: EmployeeDetailsInput = { fullName: "", email: "", department: "", jobTitle: "", country: "" };

/** One form for both "Add employee" and "Edit details". */
export function EmployeeFormModal(props: Props) {
  // The modal is mounted only while open, so state always starts from the latest values.
  const original = props.mode === "edit" ? props.employee : undefined;
  const [details, setDetails] = useState<EmployeeDetailsInput>(() =>
    original
      ? {
          fullName: original.fullName,
          email: original.email,
          department: original.department,
          jobTitle: original.jobTitle,
          country: original.country,
        }
      : blankDetails,
  );
  const [hireDate, setHireDate] = useState(todayIso());
  const [startingSalary, setStartingSalary] = useState<number | "">("");
  const [newSalary, setNewSalary] = useState<SalaryDraft>(() => emptySalaryDraft(todayIso(), "Relocation"));

  const options = useOptions();
  const createEmployee = useCreateEmployee();
  const updateEmployee = useUpdateEmployee(original?.id ?? 0);
  const mutation = props.mode === "create" ? createEmployee : updateEmployee;

  const currencyOf = (code: string) => options.data?.countries.find((c) => c.code === code)?.currency ?? "";
  // Our currency rule, shown in the UI: a new country needs a new salary in its currency.
  const countryChanged = original !== undefined && details.country !== original.country;
  const jobTitleChoices = (options.data?.jobTitles ?? [])
    .filter((j) => j.department === details.department)
    .map((j) => j.jobTitle);

  const close = props.onClose;

  function submit() {
    if (props.mode === "create") {
      createEmployee.mutate(
        { ...details, hireDate, salary: Number(startingSalary) },
        {
          onSuccess: (created) => {
            close();
            props.onCreated(created);
          },
        },
      );
    } else {
      updateEmployee.mutate(
        { ...details, newSalary: countryChanged ? toSalaryInput(newSalary) : undefined },
        { onSuccess: close },
      );
    }
  }

  const set = (field: keyof EmployeeDetailsInput) => (value: string) => setDetails((d) => ({ ...d, [field]: value }));
  const topError = formError(mutation.error, props.mode === "create" ? CREATE_FIELDS : EDIT_FIELDS);

  return (
    <Modal
      opened={props.opened}
      onClose={close}
      title={props.mode === "create" ? "Add employee" : `Edit details: ${original!.fullName}`}
      size="lg"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <Stack>
          <Group grow align="start">
            <TextInput
              label="Full name"
              value={details.fullName}
              onChange={(e) => set("fullName")(e.currentTarget.value)}
              required
              error={fieldError(mutation.error, "fullName")}
            />
            <TextInput
              label="Email"
              type="email"
              value={details.email}
              onChange={(e) => set("email")(e.currentTarget.value)}
              required
              error={fieldError(mutation.error, "email")}
            />
          </Group>

          <Group grow align="start">
            <Select
              label="Department"
              data={options.data?.departments ?? []}
              value={details.department || null}
              // A job title belongs to one department, so changing department clears it.
              onChange={(value) => setDetails((d) => ({ ...d, department: value ?? "", jobTitle: "" }))}
              allowDeselect={false}
              required
              error={fieldError(mutation.error, "department")}
            />
            <Select
              label="Job title"
              placeholder={details.department ? undefined : "Pick a department first"}
              data={jobTitleChoices}
              value={details.jobTitle || null}
              onChange={(value) => set("jobTitle")(value ?? "")}
              disabled={!details.department}
              allowDeselect={false}
              required
              error={fieldError(mutation.error, "jobTitle")}
            />
          </Group>

          <Select
            label="Country"
            data={options.data?.countries.map((c) => ({ value: c.code, label: `${c.name} (${c.currency})` })) ?? []}
            value={details.country || null}
            onChange={(value) => set("country")(value ?? "")}
            allowDeselect={false}
            required
            error={fieldError(mutation.error, "country")}
          />

          {props.mode === "create" && (
            <Group grow align="start">
              <TextInput
                label="Hire date"
                type="date"
                value={hireDate}
                onChange={(e) => setHireDate(e.currentTarget.value)}
                required
                error={fieldError(mutation.error, "hireDate")}
              />
              <NumberInput
                label={`Starting yearly salary${details.country ? ` (${currencyOf(details.country)})` : ""}`}
                value={startingSalary}
                onChange={(v) => setStartingSalary(v === "" ? "" : Number(v))}
                min={1}
                allowDecimal={false}
                allowNegative={false}
                thousandSeparator=","
                required
                error={fieldError(mutation.error, "salary")}
              />
            </Group>
          )}

          {countryChanged && (
            <>
              <Divider />
              <Text size="sm">
                Moving to a new country needs a new salary in <b>{currencyOf(details.country)}</b>. The old salary stays
                in the history.
              </Text>
              <SalaryFields
                value={newSalary}
                onChange={setNewSalary}
                currency={currencyOf(details.country)}
                minDate={original!.hireDate}
                error={mutation.error}
                fieldPrefix="newSalary."
              />
            </>
          )}

          {topError && <Alert color="red">{topError}</Alert>}

          <Group justify="end">
            <Button variant="default" onClick={close}>
              Cancel
            </Button>
            <Button type="submit" loading={mutation.isPending}>
              {props.mode === "create" ? "Add employee" : "Save changes"}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}

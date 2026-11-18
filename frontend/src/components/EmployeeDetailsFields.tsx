import { Group, Select, Stack, TextInput } from "@mantine/core";
import { useOptions } from "../api/hooks";
import type { EmployeeDetailsInput } from "../api/types";
import { fieldError } from "../lib/forms";

type Props = {
  value: EmployeeDetailsInput;
  onChange: (value: EmployeeDetailsInput) => void;
  error: unknown;
};

/** Name, email, department, job title and country. Used by both the Add and Edit forms. */
export function EmployeeDetailsFields({ value, onChange, error }: Props) {
  const options = useOptions();
  const jobTitles = (options.data?.jobTitles ?? [])
    .filter((j) => j.department === value.department)
    .map((j) => j.jobTitle);

  return (
    <Stack>
      <Group grow align="start">
        <TextInput
          label="Full name"
          value={value.fullName}
          onChange={(e) => onChange({ ...value, fullName: e.currentTarget.value })}
          required
          error={fieldError(error, "fullName")}
        />
        <TextInput
          label="Email"
          type="email"
          value={value.email}
          onChange={(e) => onChange({ ...value, email: e.currentTarget.value })}
          required
          error={fieldError(error, "email")}
        />
      </Group>

      <Group grow align="start">
        <Select
          label="Department"
          data={options.data?.departments ?? []}
          value={value.department || null}
          // A job title belongs to one department, so changing department clears it.
          onChange={(department) => onChange({ ...value, department: department ?? "", jobTitle: "" })}
          allowDeselect={false}
          required
          error={fieldError(error, "department")}
        />
        <Select
          label="Job title"
          placeholder={value.department ? undefined : "Pick a department first"}
          data={jobTitles}
          value={value.jobTitle || null}
          onChange={(jobTitle) => onChange({ ...value, jobTitle: jobTitle ?? "" })}
          disabled={!value.department}
          allowDeselect={false}
          required
          error={fieldError(error, "jobTitle")}
        />
      </Group>

      <Select
        label="Country"
        data={options.data?.countries.map((c) => ({ value: c.code, label: `${c.name} (${c.currency})` })) ?? []}
        value={value.country || null}
        onChange={(country) => onChange({ ...value, country: country ?? "" })}
        allowDeselect={false}
        required
        error={fieldError(error, "country")}
      />
    </Stack>
  );
}

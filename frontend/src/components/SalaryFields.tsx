import { Group, NumberInput, Select, TextInput } from "@mantine/core";
import type { SalaryChangeInput } from "../api/types";
import { fieldError, SALARY_CHANGE_REASONS } from "../lib/forms";

export type SalaryDraft = { amount: number | ""; effectiveDate: string; reason: string };

export const emptySalaryDraft = (effectiveDate: string, reason = "Annual raise"): SalaryDraft => ({
  amount: "",
  effectiveDate,
  reason,
});

export const toSalaryInput = (draft: SalaryDraft): SalaryChangeInput => ({
  amount: Number(draft.amount),
  effectiveDate: draft.effectiveDate,
  reason: draft.reason,
});

type Props = {
  value: SalaryDraft;
  onChange: (value: SalaryDraft) => void;
  currency: string;
  minDate?: string;
  error: unknown;
  /** Prefix of the server field names, e.g. "newSalary." when nested. */
  fieldPrefix?: string;
};

/** Amount, date and reason for a salary change. Currency is shown, never chosen. */
export function SalaryFields({ value, onChange, currency, minDate, error, fieldPrefix = "" }: Props) {
  return (
    <Group grow align="start">
      <NumberInput
        label={`New yearly salary (${currency})`}
        value={value.amount}
        onChange={(amount) => onChange({ ...value, amount: amount === "" ? "" : Number(amount) })}
        min={1}
        allowDecimal={false}
        allowNegative={false}
        thousandSeparator=","
        required
        error={fieldError(error, `${fieldPrefix}amount`)}
      />
      <TextInput
        label="Effective from"
        type="date"
        value={value.effectiveDate}
        onChange={(e) => onChange({ ...value, effectiveDate: e.currentTarget.value })}
        min={minDate}
        required
        error={fieldError(error, `${fieldPrefix}effectiveDate`)}
      />
      <Select
        label="Reason"
        data={SALARY_CHANGE_REASONS}
        value={value.reason}
        onChange={(reason) => onChange({ ...value, reason: reason ?? "" })}
        allowDeselect={false}
        required
        error={fieldError(error, `${fieldPrefix}reason`)}
      />
    </Group>
  );
}

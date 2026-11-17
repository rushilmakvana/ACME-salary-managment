import { Alert, Group, Loader, Stack, Table, Text, Title } from "@mantine/core";
import { Fragment } from "react";
import { useSearchParams } from "react-router";
import { useCountryInsights, useJobTitleInsights } from "../api/hooks";
import type { JobTitleInsights, PayStats } from "../api/types";
import { PayRangeBar } from "../components/PayRangeBar";
import { formatMoney } from "../lib/format";

const numeric = { textAlign: "right", fontVariantNumeric: "tabular-nums" } as const;

/** The five pay columns, shared by both tables. */
function StatCells({ stats, currency }: { stats: PayStats; currency: string }) {
  return (
    <>
      <Table.Td style={numeric}>{stats.headcount.toLocaleString("en-US")}</Table.Td>
      <Table.Td style={numeric}>{formatMoney(stats.min, currency)}</Table.Td>
      <Table.Td style={numeric}>
        <b>{formatMoney(stats.median, currency)}</b>
      </Table.Td>
      <Table.Td style={numeric}>{formatMoney(stats.average, currency)}</Table.Td>
      <Table.Td style={numeric}>{formatMoney(stats.max, currency)}</Table.Td>
    </>
  );
}

function StatHeaders() {
  return (
    <>
      <Table.Th style={numeric}>People</Table.Th>
      <Table.Th style={numeric}>Lowest</Table.Th>
      <Table.Th style={numeric}>Median</Table.Th>
      <Table.Th style={numeric}>Average</Table.Th>
      <Table.Th style={numeric}>Highest</Table.Th>
    </>
  );
}

export function InsightsPage() {
  // The chosen country lives in the URL, like the employee filters.
  const [params, setParams] = useSearchParams();
  const selected = params.get("country") ?? undefined;

  const countries = useCountryInsights();
  const jobTitles = useJobTitleInsights(selected);

  return (
    <Stack>
      <Title order={2}>Insights</Title>
      <Text c="dimmed">
        All figures use each employee's current yearly salary, in their country's own currency. Countries are not
        converted or compared on one scale.
      </Text>

      {countries.isPending && (
        <Group justify="center" p="xl">
          <Loader />
        </Group>
      )}
      {countries.isError && <Alert color="red">Couldn't load insights: {countries.error.message}</Alert>}

      {countries.data && (
        <Table.ScrollContainer minWidth={700}>
          <Table highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Country</Table.Th>
                <StatHeaders />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {countries.data.map((c) => (
                <Table.Tr
                  key={c.country}
                  onClick={() => setParams({ country: c.country })}
                  style={{ cursor: "pointer" }}
                  bg={c.country === selected ? "var(--mantine-color-blue-light)" : undefined}
                >
                  <Table.Td>
                    {c.countryName} <Text span c="dimmed" size="sm">({c.currency})</Text>
                  </Table.Td>
                  <StatCells stats={c} currency={c.currency} />
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      )}

      {!selected && countries.data && countries.data.length > 0 && (
        <Text c="dimmed" ta="center">
          Click a country to see pay by job title.
        </Text>
      )}

      {selected && jobTitles.isPending && (
        <Group justify="center" p="xl">
          <Loader />
        </Group>
      )}
      {selected && jobTitles.isError && <Alert color="red">Couldn't load job titles: {jobTitles.error.message}</Alert>}

      {jobTitles.data && selected && (
        <JobTitleTable data={jobTitles.data} />
      )}
    </Stack>
  );
}

function JobTitleTable({ data }: { data: JobTitleInsights }) {
  // One shared scale for the whole country, so bars can be compared row to row.
  const scaleMin = Math.min(...data.jobTitles.map((j) => j.min));
  const scaleMax = Math.max(...data.jobTitles.map((j) => j.max));
  const departments = [...new Set(data.jobTitles.map((j) => j.department))];

  return (
    <Stack gap="xs">
      <Title order={3}>
        {data.countryName}: pay by job title ({data.currency})
      </Title>
      <Text size="sm" c="dimmed">
        Bar: light band = lowest to highest pay, dark mark = median.
      </Text>
      <Table.ScrollContainer minWidth={860}>
        <Table>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Job title</Table.Th>
              <StatHeaders />
              <Table.Th>Pay range</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {departments.map((department) => (
              <Fragment key={department}>
                <Table.Tr bg="var(--mantine-color-default-hover)">
                  <Table.Td colSpan={7}>
                    <Text fw={600} size="sm">
                      {department}
                    </Text>
                  </Table.Td>
                </Table.Tr>
                {data.jobTitles
                  .filter((j) => j.department === department)
                  .map((j) => (
                    <Table.Tr key={j.jobTitle}>
                      <Table.Td>{j.jobTitle}</Table.Td>
                      <StatCells stats={j} currency={data.currency} />
                      <Table.Td>
                        <PayRangeBar
                          min={j.min}
                          median={j.median}
                          max={j.max}
                          scaleMin={scaleMin}
                          scaleMax={scaleMax}
                          label={`${j.jobTitle}: ${formatMoney(j.min, data.currency)} to ${formatMoney(j.max, data.currency)}, median ${formatMoney(j.median, data.currency)}`}
                        />
                      </Table.Td>
                    </Table.Tr>
                  ))}
              </Fragment>
            ))}
          </Table.Tbody>
        </Table>
      </Table.ScrollContainer>
      {data.jobTitles.length === 0 && (
        <Text c="dimmed" ta="center">
          No employees in {data.countryName} yet.
        </Text>
      )}
    </Stack>
  );
}

import { Box } from "@mantine/core";

type Props = {
  min: number;
  median: number;
  max: number;
  /** Lowest and highest pay on the shared scale (the whole country), so rows can be compared. */
  scaleMin: number;
  scaleMax: number;
  label: string;
};

/**
 * A plain-CSS bar: the light band runs from lowest to highest pay,
 * the dark mark shows the median.
 */
export function PayRangeBar({ min, median, max, scaleMin, scaleMax, label }: Props) {
  const span = scaleMax - scaleMin || 1;
  const toPercent = (value: number) => ((value - scaleMin) / span) * 100;

  return (
    <Box role="img" aria-label={label} title={label} pos="relative" h={14} miw={140}>
      {/* track */}
      <Box pos="absolute" top={6} left={0} right={0} h={2} bg="var(--mantine-color-default-border)" />
      {/* lowest → highest */}
      <Box
        pos="absolute"
        top={2}
        h={10}
        bg="var(--mantine-color-blue-light)"
        style={{
          left: `${toPercent(min)}%`,
          width: `${Math.max(toPercent(max) - toPercent(min), 1)}%`,
          borderRadius: 3,
          border: "1px solid var(--mantine-color-blue-outline)",
        }}
      />
      {/* median */}
      <Box
        pos="absolute"
        top={0}
        w={3}
        h={14}
        bg="var(--mantine-color-blue-filled)"
        style={{ left: `calc(${toPercent(median)}% - 1.5px)`, borderRadius: 1 }}
      />
    </Box>
  );
}

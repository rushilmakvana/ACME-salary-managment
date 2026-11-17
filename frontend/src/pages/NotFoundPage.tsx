import { Anchor, Stack, Text, Title } from "@mantine/core";
import { Link } from "react-router";

export function NotFoundPage() {
  return (
    <Stack align="center" p="xl">
      <Title order={3}>Page not found</Title>
      <Text c="dimmed">This page doesn't exist.</Text>
      <Anchor component={Link} to="/employees">
        Go to employees
      </Anchor>
    </Stack>
  );
}

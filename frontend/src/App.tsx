import { Badge, Container, Group, Title } from "@mantine/core";
import { useEffect, useState } from "react";

// Temporary page: proves the frontend can reach the backend.
export function App() {
  const [apiStatus, setApiStatus] = useState("checking…");

  useEffect(() => {
    fetch("/api/health")
      .then((res) => res.json())
      .then((data: { status: string }) => setApiStatus(data.status))
      .catch(() => setApiStatus("unreachable"));
  }, []);

  return (
    <Container py="xl">
      <Group>
        <Title order={2}>ACME Salary Management</Title>
        <Badge color={apiStatus === "ok" ? "green" : "red"}>API: {apiStatus}</Badge>
      </Group>
    </Container>
  );
}

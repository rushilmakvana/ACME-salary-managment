import { AppShell, Button, Container, Group, Title } from "@mantine/core";
import { Link, Outlet, useLocation } from "react-router";

const links = [
  { to: "/employees", label: "Employees" },
  { to: "/insights", label: "Insights" },
];

export function Layout() {
  const { pathname } = useLocation();

  return (
    <AppShell header={{ height: 60 }} padding="md">
      <AppShell.Header>
        <Container size="xl" h="100%">
          <Group h="100%" justify="space-between" wrap="nowrap">
            <Title order={4}>ACME Salary Management</Title>
            <Group gap="xs" wrap="nowrap">
              {links.map((link) => (
                <Button
                  key={link.to}
                  component={Link}
                  to={link.to}
                  variant={pathname.startsWith(link.to) ? "light" : "subtle"} // highlight the current page
                >
                  {link.label}
                </Button>
              ))}
            </Group>
          </Group>
        </Container>
      </AppShell.Header>

      <AppShell.Main>
        <Container size="xl">
          <Outlet />
        </Container>
      </AppShell.Main>
    </AppShell>
  );
}

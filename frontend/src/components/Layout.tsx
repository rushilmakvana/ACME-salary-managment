import { AppShell, Container, Group, NavLink as MantineNavLink, Title } from "@mantine/core";
import { NavLink, Outlet } from "react-router";

const links = [
  { to: "/employees", label: "Employees" },
  { to: "/insights", label: "Insights" },
];

export function Layout() {
  return (
    <AppShell header={{ height: 60 }} padding="md">
      <AppShell.Header>
        <Container size="xl" h="100%">
          <Group h="100%" justify="space-between" wrap="nowrap">
            <Title order={4}>ACME Salary Management</Title>
            <Group gap={4} wrap="nowrap">
              {links.map((link) => (
                <NavLink key={link.to} to={link.to} style={{ textDecoration: "none" }}>
                  {({ isActive }) => <MantineNavLink component="span" label={link.label} active={isActive} />}
                </NavLink>
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

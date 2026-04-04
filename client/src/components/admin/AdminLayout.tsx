import { AppShell, Group, Text } from "@mantine/core";
import { Outlet } from "react-router";

export function AdminLayout() {
  return (
    <AppShell
      header={{ height: 56 }}
      padding="lg"
      styles={{
        main: { backgroundColor: "var(--mantine-color-dark-8)" },
        header: {
          backgroundColor: "var(--mantine-color-dark-9)",
          borderBottom: "1px solid var(--mantine-color-dark-6)",
        },
      }}
    >
      <AppShell.Header>
        <Group h="100%" px="lg" justify="space-between">
          <Group gap="xs">
            <Text
              size="lg"
              fw={700}
              c="yellow.5"
              style={{ letterSpacing: "0.02em" }}
            >
              CardSight
            </Text>
            <Text size="sm" c="dimmed">
              Admin
            </Text>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}

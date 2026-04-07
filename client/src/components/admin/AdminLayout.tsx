import { useState, useEffect } from "react";
import { AppShell, Group, Text, ActionIcon, Tooltip } from "@mantine/core";
import { Outlet } from "react-router";
import { adminFetch, clearAdminToken, BASE } from "../../api/admin/common";
import { AdminLogin } from "./AdminLogin";

export function AdminLayout() {
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    adminFetch(`${BASE}/verify`)
      .then((res) => setAuthed(res.ok))
      .catch(() => setAuthed(false));
  }, []);

  function handleLogout() {
    clearAdminToken();
    setAuthed(false);
  }

  if (authed === null) return null;
  if (!authed) return <AdminLogin onLogin={() => setAuthed(true)} />;

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
          <Tooltip label="Sign out">
            <ActionIcon variant="subtle" color="gray" onClick={handleLogout} size="sm">
              ↪
            </ActionIcon>
          </Tooltip>
        </Group>
      </AppShell.Header>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}

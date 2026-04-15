import { useState, useEffect } from "react";
import { AppShell, Group, Text, ActionIcon, Tooltip, NavLink, Burger } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { Outlet, useParams, useNavigate, useLocation } from "react-router";
import { adminFetch, clearAdminToken, BASE } from "../../api/admin/common";
import { AdminLogin } from "./AdminLogin";

const GAME_NAV_ITEMS = [
  { label: "Cards", path: "", icon: "🃏" },
  { label: "Missions", path: "/missions", icon: "🎯" },
  { label: "Story Sheets", path: "/story-sheets", icon: "📜" },
  { label: "Showtimes", path: "/showtimes", icon: "🎭" },
  { label: "Dashboard", path: "/dashboard", icon: "📊" },
  { label: "Act Break", path: "/act-break", icon: "⏸" },
  { label: "Simulator", path: "/simulator", icon: "🔀" },
  { label: "Print Center", path: "/print", icon: "🖨" },
  { label: "Host Console", path: "/console", icon: "📱" },
];

export function AdminLayout() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [mobileOpened, { toggle: toggleMobile, close: closeMobile }] = useDisclosure();
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const location = useLocation();

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

  const inGame = !!gameId;
  const gameBase = gameId ? `/admin/games/${gameId}` : "";

  // Determine active nav item
  const relativePath = gameBase ? location.pathname.replace(gameBase, "") : "";

  return (
    <AppShell
      header={{ height: 56 }}
      navbar={inGame ? { width: 200, breakpoint: "sm", collapsed: { mobile: !mobileOpened } } : undefined}
      padding="lg"
      styles={{
        main: { backgroundColor: "var(--mantine-color-dark-8)" },
        header: {
          backgroundColor: "var(--mantine-color-dark-9)",
          borderBottom: "1px solid var(--mantine-color-dark-6)",
        },
        navbar: {
          backgroundColor: "var(--mantine-color-dark-9)",
          borderRight: "1px solid var(--mantine-color-dark-6)",
        },
      }}
    >
      <AppShell.Header>
        <Group h="100%" px="lg" justify="space-between">
          <Group gap="xs">
            {inGame && (
              <Burger
                opened={mobileOpened}
                onClick={toggleMobile}
                hiddenFrom="sm"
                size="sm"
                color="gray"
              />
            )}
            <Text
              size="lg"
              fw={700}
              c="yellow.5"
              style={{ letterSpacing: "0.02em", cursor: "pointer" }}
              onClick={() => navigate("/admin")}
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

      {inGame && (
        <AppShell.Navbar p="xs">
          <NavLink
            label="All Games"
            leftSection={<span style={{ fontSize: "0.9rem" }}>←</span>}
            onClick={() => { navigate("/admin"); closeMobile(); }}
            variant="subtle"
            color="gray"
            mb="xs"
            styles={{ label: { fontSize: "0.8rem" } }}
          />
          {GAME_NAV_ITEMS.map((item) => {
            const fullPath = `${gameBase}${item.path}`;
            const isActive = item.path === ""
              ? relativePath === "" || relativePath === "/"
              : relativePath.startsWith(item.path);

            return (
              <NavLink
                key={item.path}
                label={item.label}
                leftSection={<span style={{ fontSize: "0.85rem" }}>{item.icon}</span>}
                active={isActive}
                onClick={() => { navigate(fullPath); closeMobile(); }}
                variant="light"
                color="yellow"
                styles={{
                  root: { borderRadius: 6, marginBottom: 2 },
                  label: { fontSize: "0.85rem" },
                }}
              />
            );
          })}
        </AppShell.Navbar>
      )}

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}

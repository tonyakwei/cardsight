import { useState } from "react";
import {
  TextInput,
  PasswordInput,
  Button,
  Paper,
  Title,
  Stack,
  Alert,
} from "@mantine/core";
import { setAdminToken, clearAdminToken, adminFetch, BASE } from "../../api/admin/common";

interface Props {
  onLogin: () => void;
}

export function AdminLogin({ onLogin }: Props) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    setAdminToken(username, password);

    try {
      const res = await adminFetch(`${BASE}/verify`);
      if (res.ok) {
        onLogin();
      } else {
        clearAdminToken();
        setError("Invalid credentials");
      }
    } catch {
      clearAdminToken();
      setError("Connection error");
    }

    setLoading(false);
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100dvh",
        backgroundColor: "var(--mantine-color-dark-8)",
      }}
    >
      <Paper p="xl" w={360} bg="dark.7" radius="md">
        <form onSubmit={handleSubmit}>
          <Stack>
            <Title order={3} c="yellow.5" ta="center">
              CardSight Admin
            </Title>
            {error && (
              <Alert color="red" variant="filled">
                {error}
              </Alert>
            )}
            <TextInput
              label="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
            />
            <PasswordInput
              label="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <Button type="submit" loading={loading} fullWidth>
              Sign In
            </Button>
          </Stack>
        </form>
      </Paper>
    </div>
  );
}

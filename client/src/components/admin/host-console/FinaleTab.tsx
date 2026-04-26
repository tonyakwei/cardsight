import {
  Badge,
  Button,
  Checkbox,
  Group,
  Paper,
  Radio,
  Stack,
  Text,
} from "@mantine/core";
import {
  FINALE_CLAUSES,
  FINALE_MAX_CLAUSES,
  FINALE_OUTCOMES,
} from "@cardsight/shared";
import type { FinaleTabProps } from "./types";

export function FinaleTab({
  finale,
  onSelectOutcome,
  onToggleClause,
  actionLoading,
}: FinaleTabProps) {
  const { outcomeId, clauseIds, evaluation } = finale;

  return (
    <Stack gap="sm">
      <Paper bg="dark.7" p="md" radius="md">
        <Text size="xs" fw={600} c="dimmed" mb="xs">
          MAJOR DECISION
        </Text>
        <Radio.Group
          value={outcomeId ?? ""}
          onChange={(value) => onSelectOutcome((value || null) as any)}
        >
          <Stack gap="xs">
            {FINALE_OUTCOMES.map((outcome) => (
              <Paper
                key={outcome.id}
                p="sm"
                radius="md"
                style={{ border: "1px solid var(--mantine-color-dark-4)" }}
              >
                <Group align="flex-start" wrap="nowrap">
                  <Radio value={outcome.id} mt={2} />
                  <div style={{ flex: 1 }}>
                    <Text size="sm" fw={600}>{outcome.label}</Text>
                    <Text size="xs" c="dimmed" mt={4}>
                      {outcome.description}
                    </Text>
                  </div>
                </Group>
              </Paper>
            ))}
          </Stack>
        </Radio.Group>
      </Paper>

      <Paper bg="dark.7" p="md" radius="md">
        <Group justify="space-between" mb="xs">
          <Text size="xs" fw={600} c="dimmed">
            SETTLEMENT CLAUSES
          </Text>
          <Badge color={clauseIds.length > FINALE_MAX_CLAUSES ? "red" : "yellow"} variant="light">
            {clauseIds.length}/{FINALE_MAX_CLAUSES}
          </Badge>
        </Group>
        <Stack gap="xs">
          {FINALE_CLAUSES.map((clause) => (
            <Paper
              key={clause.id}
              onClick={() => onToggleClause(clause.id)}
              p="sm"
              radius="md"
              style={{ border: "1px solid var(--mantine-color-dark-4)", cursor: "pointer" }}
            >
              <Group justify="space-between" align="flex-start" wrap="nowrap">
                <div style={{ flex: 1 }}>
                  <Text size="sm" fw={600}>{clause.label}</Text>
                  <Text size="xs" c="dimmed" mt={4}>
                    {clause.description}
                  </Text>
                </div>
                <Checkbox
                  checked={clauseIds.includes(clause.id)}
                  onChange={() => onToggleClause(clause.id)}
                  tabIndex={-1}
                />
              </Group>
            </Paper>
          ))}
        </Stack>
      </Paper>

      <Paper bg="dark.7" p="md" radius="md">
        <Text size="xs" fw={600} c="dimmed" mb="xs">
          VALIDATION
        </Text>
        {evaluation.errors.length === 0 ? (
          <Badge color="green" variant="light">Valid package</Badge>
        ) : (
          <Stack gap={6}>
            {evaluation.errors.map((error) => (
              <Text key={error} size="xs" c="red.3">
                {error}
              </Text>
            ))}
          </Stack>
        )}
      </Paper>

      <Paper bg="dark.7" p="md" radius="md">
        <Text size="xs" fw={600} c="dimmed" mb="xs">
          HOUSE CONSEQUENCES
        </Text>
        <Stack gap="sm">
          {evaluation.houseResults.map((result) => (
            <Paper key={result.houseId} bg="dark.6" p="sm" radius="md">
              <Group justify="space-between" mb={6}>
                <Text size="sm" fw={600}>{result.label}</Text>
                <Group gap="xs">
                  <Badge
                    color={
                      result.band === "vindicated"
                        ? "green"
                        : result.band === "compromised"
                          ? "yellow"
                          : "red"
                    }
                    variant="light"
                  >
                    {result.band.toUpperCase()}
                  </Badge>
                  <Badge color="gray" variant="outline">
                    {result.score}
                  </Badge>
                </Group>
              </Group>
              <Text size="xs" c="dimmed">
                {result.consequence}
              </Text>
            </Paper>
          ))}
        </Stack>
      </Paper>

      <Button
        variant="light"
        color="yellow"
        disabled
        loading={actionLoading === "finale"}
      >
        Finale updates save automatically
      </Button>
    </Stack>
  );
}

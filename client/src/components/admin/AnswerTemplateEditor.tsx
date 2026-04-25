import { useEffect, useState, useCallback } from "react";
import {
  Stack,
  TextInput,
  Textarea,
  Switch,
  NumberInput,
  Text,
  Group,
  Button,
  Badge,
  ActionIcon,
  Loader,
} from "@mantine/core";
import {
  fetchAnswerTemplate,
  createAnswerTemplate,
  updateAnswerTemplate,
  type SingleAnswerTemplate,
} from "../../api/admin";
import { MultipleAnswerEditor } from "./MultipleAnswerEditor";

interface Props {
  gameId: string;
  answerTemplateType: string | null;
  answerId: string | null;
  onAnswerCreated: (type: string, id: string) => void;
}

export function AnswerTemplateEditor({
  gameId,
  answerTemplateType,
  answerId,
  onAnswerCreated,
}: Props) {
  const [template, setTemplate] = useState<SingleAnswerTemplate | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Editable state
  const [correctAnswer, setCorrectAnswer] = useState("");
  const [alternatives, setAlternatives] = useState<string[]>([]);
  const [altInput, setAltInput] = useState("");
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [trimWhitespace, setTrimWhitespace] = useState(true);
  const [hint, setHint] = useState("");
  const [hintAfterAttempts, setHintAfterAttempts] = useState(3);
  const [maxAttempts, setMaxAttempts] = useState<number | null>(null);

  // Load existing template (only for single_answer — multiple_text uses its own editor)
  useEffect(() => {
    if (answerTemplateType !== "single_answer" || !answerId) {
      setTemplate(null);
      return;
    }
    setLoading(true);
    fetchAnswerTemplate(gameId, answerTemplateType, answerId)
      .then((t) => {
        const tt = t as SingleAnswerTemplate;
        setTemplate(tt);
        setCorrectAnswer(tt.correctAnswer);
        setAlternatives(tt.acceptAlternatives);
        setCaseSensitive(tt.caseSensitive);
        setTrimWhitespace(tt.trimWhitespace);
        setHint(tt.hint ?? "");
        setHintAfterAttempts(tt.hintAfterAttempts);
        setMaxAttempts(tt.maxAttempts);
      })
      .catch(() => setTemplate(null))
      .finally(() => setLoading(false));
  }, [gameId, answerTemplateType, answerId]);

  const save = useCallback(async () => {
    setSaving(true);
    const data = {
      correctAnswer,
      caseSensitive,
      trimWhitespace,
      acceptAlternatives: alternatives,
      hint: hint.trim() || null,
      hintAfterAttempts,
      maxAttempts,
    };

    if (template && answerId) {
      // Update existing
      const updated = (await updateAnswerTemplate(gameId, "single_answer", answerId, data)) as SingleAnswerTemplate;
      setTemplate(updated);
    } else {
      // Create new
      const created = (await createAnswerTemplate(gameId, "single_answer", data)) as SingleAnswerTemplate;
      setTemplate(created);
      onAnswerCreated("single_answer", created.id);
    }
    setSaving(false);
  }, [
    gameId, answerId, template, correctAnswer, alternatives,
    caseSensitive, trimWhitespace, hint, hintAfterAttempts, maxAttempts, onAnswerCreated,
  ]);

  const addAlternative = () => {
    const val = altInput.trim();
    if (val && !alternatives.includes(val)) {
      setAlternatives([...alternatives, val]);
    }
    setAltInput("");
  };

  const removeAlternative = (idx: number) => {
    setAlternatives(alternatives.filter((_, i) => i !== idx));
  };

  if (answerTemplateType === "multiple_text") {
    return (
      <MultipleAnswerEditor
        gameId={gameId}
        answerId={answerId}
        onAnswerCreated={onAnswerCreated}
      />
    );
  }

  if (answerTemplateType !== "single_answer") return null;
  if (loading) return <Loader size="xs" color="yellow" />;

  const hasChanges = template
    ? correctAnswer !== template.correctAnswer ||
      caseSensitive !== template.caseSensitive ||
      trimWhitespace !== template.trimWhitespace ||
      hint !== (template.hint ?? "") ||
      hintAfterAttempts !== template.hintAfterAttempts ||
      JSON.stringify(alternatives) !== JSON.stringify(template.acceptAlternatives) ||
      maxAttempts !== template.maxAttempts
    : correctAnswer.length > 0;

  return (
    <Stack
      gap="xs"
      p="sm"
      style={{
        borderRadius: "6px",
        border: "1px solid var(--mantine-color-dark-5)",
        background: "rgba(255, 200, 0, 0.02)",
      }}
    >
      <Text size="xs" fw={600} c="yellow.5">
        Answer Template {template ? "" : "(new)"}
      </Text>

      <TextInput
        label="Correct answer"
        size="xs"
        placeholder="The answer players must type..."
        value={correctAnswer}
        onChange={(e) => setCorrectAnswer(e.target.value)}
        required
      />

      {/* Tag input for alternatives */}
      <div>
        <Text size="xs" fw={500} mb={4}>
          Accepted alternatives
        </Text>
        {alternatives.length > 0 && (
          <Group gap={4} mb="xs">
            {alternatives.map((alt, i) => (
              <Badge
                key={i}
                size="sm"
                variant="filled"
                color="dark"
                rightSection={
                  <ActionIcon
                    size={14}
                    variant="transparent"
                    color="gray"
                    onClick={() => removeAlternative(i)}
                  >
                    x
                  </ActionIcon>
                }
              >
                {alt}
              </Badge>
            ))}
          </Group>
        )}
        <Group gap="xs">
          <TextInput
            size="xs"
            placeholder="Add alternative answer..."
            value={altInput}
            onChange={(e) => setAltInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addAlternative();
              }
            }}
            style={{ flex: 1 }}
          />
          <Button size="xs" variant="light" color="gray" onClick={addAlternative} disabled={!altInput.trim()}>
            Add
          </Button>
        </Group>
        <Text size="xs" c="dimmed" mt={2}>
          Press Enter or click Add. Alternatives can have spaces.
        </Text>
      </div>

      <Group grow>
        <Switch
          size="xs"
          label={<Text size="xs">Case sensitive</Text>}
          checked={caseSensitive}
          onChange={(e) => setCaseSensitive(e.currentTarget.checked)}
        />
        <Switch
          size="xs"
          label={<Text size="xs">Trim whitespace</Text>}
          checked={trimWhitespace}
          onChange={(e) => setTrimWhitespace(e.currentTarget.checked)}
        />
      </Group>

      <Textarea
        label="Hint (shown after N wrong attempts)"
        size="xs"
        autosize
        minRows={1}
        maxRows={3}
        placeholder="Optional hint..."
        value={hint}
        onChange={(e) => setHint(e.target.value)}
      />

      <Group grow>
        <NumberInput
          label="Show hint after N attempts"
          size="xs"
          min={1}
          max={20}
          value={hintAfterAttempts}
          onChange={(val) => setHintAfterAttempts(Number(val) || 3)}
        />
        <NumberInput
          label="Lock out after N attempts"
          size="xs"
          min={1}
          max={50}
          placeholder="No limit"
          value={maxAttempts ?? ""}
          onChange={(val) => setMaxAttempts(val ? Number(val) : null)}
          allowDecimal={false}
        />
      </Group>

      <Group justify="flex-end">
        <Button
          size="xs"
          color="yellow"
          loading={saving}
          disabled={!hasChanges || !correctAnswer.trim()}
          onClick={save}
        >
          {template ? "Update Answer" : "Create Answer"}
        </Button>
      </Group>
    </Stack>
  );
}

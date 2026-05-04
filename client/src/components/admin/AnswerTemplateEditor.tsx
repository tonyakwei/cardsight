import { useEffect, useRef, useState, useCallback, type ReactNode } from "react";
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
import { SavedToast } from "./SavedToast";

interface Props {
  gameId: string;
  answerTemplateType: string | null;
  answerId: string | null;
  onAnswerCreated: (type: string, id: string) => void;
  revealField?: ReactNode;
}

interface SaveData {
  correctAnswer: string;
  caseSensitive: boolean;
  trimWhitespace: boolean;
  acceptAlternatives: string[];
  hint: string | null;
  hintEnabled: boolean;
  hintAfterAttempts: number;
  maxAttempts: number | null;
}

export function AnswerTemplateEditor({
  gameId,
  answerTemplateType,
  answerId,
  onAnswerCreated,
  revealField,
}: Props) {
  const [template, setTemplate] = useState<SingleAnswerTemplate | null>(null);
  const [loading, setLoading] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  // Editable state
  const [correctAnswer, setCorrectAnswer] = useState("");
  const [alternatives, setAlternatives] = useState<string[]>([]);
  const [altInput, setAltInput] = useState("");
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [trimWhitespace, setTrimWhitespace] = useState(true);
  const [hint, setHint] = useState("");
  const [hintEnabled, setHintEnabled] = useState(false);
  const [hintAfterAttempts, setHintAfterAttempts] = useState(3);
  const [maxAttempts, setMaxAttempts] = useState<number | null>(null);

  // Save coordination: in-flight guard + queued pending desired state
  const savingRef = useRef(false);
  const pendingRef = useRef<SaveData | null>(null);
  const flashTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Track the last value committed to the server (or loaded) per text field,
  // so blur handlers can decide whether anything actually changed.
  const lastSavedRef = useRef<SaveData | null>(null);

  // Load existing template (only for single_answer — multiple_text uses its own editor)
  useEffect(() => {
    if (answerTemplateType !== "single_answer" || !answerId) {
      setTemplate(null);
      lastSavedRef.current = null;
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
        setHintEnabled(tt.hintEnabled);
        setHintAfterAttempts(tt.hintAfterAttempts);
        setMaxAttempts(tt.maxAttempts);
        lastSavedRef.current = {
          correctAnswer: tt.correctAnswer,
          caseSensitive: tt.caseSensitive,
          trimWhitespace: tt.trimWhitespace,
          acceptAlternatives: tt.acceptAlternatives,
          hint: tt.hint ?? null,
          hintEnabled: tt.hintEnabled,
          hintAfterAttempts: tt.hintAfterAttempts,
          maxAttempts: tt.maxAttempts,
        };
      })
      .catch(() => {
        setTemplate(null);
        lastSavedRef.current = null;
      })
      .finally(() => setLoading(false));
  }, [gameId, answerTemplateType, answerId]);

  useEffect(() => {
    return () => {
      if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
    };
  }, []);

  const flashSaved = useCallback(() => {
    setSavedFlash(true);
    if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
    flashTimeoutRef.current = setTimeout(() => setSavedFlash(false), 1500);
  }, []);

  const performSave = useCallback(
    async (data: SaveData): Promise<void> => {
      // Skip empty correctAnswer (preserve old "disabled when blank" semantics)
      if (!data.correctAnswer.trim()) return;

      if (savingRef.current) {
        // Queue the latest desired state; the running save will pick it up when done.
        pendingRef.current = data;
        return;
      }

      savingRef.current = true;
      try {
        if (template && answerId) {
          const updated = (await updateAnswerTemplate(
            gameId,
            "single_answer",
            answerId,
            data,
          )) as SingleAnswerTemplate;
          setTemplate(updated);
        } else {
          const created = (await createAnswerTemplate(
            gameId,
            "single_answer",
            data,
          )) as SingleAnswerTemplate;
          setTemplate(created);
          onAnswerCreated("single_answer", created.id);
        }
        lastSavedRef.current = data;
        flashSaved();
      } finally {
        savingRef.current = false;
        // Drain any queued save with the latest desired state.
        const queued = pendingRef.current;
        pendingRef.current = null;
        if (queued) {
          // Avoid duplicate save if queued matches what we just saved
          if (JSON.stringify(queued) !== JSON.stringify(data)) {
            void performSave(queued);
          }
        }
      }
    },
    [gameId, answerId, template, onAnswerCreated, flashSaved],
  );

  // Helper: build current SaveData from latest state, with optional overrides
  // (used when a state update has just been queued but hasn't applied yet).
  const buildData = useCallback(
    (overrides: Partial<SaveData> = {}): SaveData => ({
      correctAnswer,
      caseSensitive,
      trimWhitespace,
      acceptAlternatives: alternatives,
      hint: hint.trim() || null,
      hintEnabled,
      hintAfterAttempts,
      maxAttempts,
      ...overrides,
    }),
    [correctAnswer, caseSensitive, trimWhitespace, alternatives, hint, hintEnabled, hintAfterAttempts, maxAttempts],
  );

  // Save if data differs from the last persisted snapshot
  const saveIfChanged = useCallback(
    (data: SaveData) => {
      const last = lastSavedRef.current;
      if (last && JSON.stringify(last) === JSON.stringify(data)) return;
      void performSave(data);
    },
    [performSave],
  );

  const addAlternative = () => {
    const val = altInput.trim();
    if (!val || alternatives.includes(val)) {
      setAltInput("");
      return;
    }
    const next = [...alternatives, val];
    setAlternatives(next);
    setAltInput("");
    saveIfChanged(buildData({ acceptAlternatives: next }));
  };

  const removeAlternative = (idx: number) => {
    const next = alternatives.filter((_, i) => i !== idx);
    setAlternatives(next);
    saveIfChanged(buildData({ acceptAlternatives: next }));
  };

  if (answerTemplateType === "multiple_text") {
    return (
      <Stack gap="xs">
        <MultipleAnswerEditor
          gameId={gameId}
          answerId={answerId}
          onAnswerCreated={onAnswerCreated}
        />
        {revealField}
      </Stack>
    );
  }

  if (answerTemplateType !== "single_answer") return null;
  if (loading) return <Loader size="xs" color="yellow" />;

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
      <SavedToast visible={savedFlash} />

      <TextInput
        label="Correct answer"
        size="xs"
        placeholder="The answer players must type..."
        value={correctAnswer}
        onChange={(e) => setCorrectAnswer(e.target.value)}
        onBlur={() => saveIfChanged(buildData())}
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
          onChange={(e) => {
            const v = e.currentTarget.checked;
            setCaseSensitive(v);
            saveIfChanged(buildData({ caseSensitive: v }));
          }}
        />
        <Switch
          size="xs"
          label={<Text size="xs">Trim whitespace</Text>}
          checked={trimWhitespace}
          onChange={(e) => {
            const v = e.currentTarget.checked;
            setTrimWhitespace(v);
            saveIfChanged(buildData({ trimWhitespace: v }));
          }}
        />
      </Group>

      <Switch
        size="xs"
        label={<Text size="xs">Show hint to players</Text>}
        checked={hintEnabled}
        onChange={(e) => {
          const v = e.currentTarget.checked;
          setHintEnabled(v);
          saveIfChanged(buildData({ hintEnabled: v }));
        }}
      />

      {hintEnabled && (
        <>
          <Textarea
            label="Hint (shown after N wrong attempts)"
            size="xs"
            autosize
            minRows={1}
            maxRows={3}
            placeholder="Optional hint..."
            value={hint}
            onChange={(e) => setHint(e.target.value)}
            onBlur={() => saveIfChanged(buildData())}
          />
          <NumberInput
            label="Show hint after N attempts"
            size="xs"
            min={1}
            max={20}
            value={hintAfterAttempts}
            onChange={(val) => {
              const n = Number(val) || 3;
              setHintAfterAttempts(n);
              saveIfChanged(buildData({ hintAfterAttempts: n }));
            }}
          />
        </>
      )}

      <NumberInput
        label="Lock out after N attempts"
        size="xs"
        min={1}
        max={50}
        placeholder="No limit"
        value={maxAttempts ?? ""}
        onChange={(val) => {
          const n = val ? Number(val) : null;
          setMaxAttempts(n);
          saveIfChanged(buildData({ maxAttempts: n }));
        }}
        allowDecimal={false}
      />

      {revealField}
    </Stack>
  );
}

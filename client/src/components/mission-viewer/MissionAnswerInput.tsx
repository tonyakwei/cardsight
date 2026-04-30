import { useCallback } from "react";
import { postMissionAnswer } from "../../api/missions";
import { getSessionHash } from "../../utils/session";
import { AnswerInput } from "../shared/AnswerInput";
import { MultiTextAnswerInput } from "../shared/MultiTextAnswerInput";
import type { AnswerMeta } from "@cardsight/shared";

interface Props {
  missionId: string;
  houseId?: string;
  answerMeta: AnswerMeta | null;
  onCompleted: (revealText: string | null) => void;
}

export function MissionAnswerInput({ missionId, houseId, answerMeta, onCompleted }: Props) {
  const handleSingleSubmit = useCallback(
    async (answer: string) => {
      const result = await postMissionAnswer(missionId, answer, houseId, getSessionHash());
      // Trigger the parent's takeover sequence immediately on success — the
      // parent renders a full-screen confetti+reveal overlay that covers
      // AnswerInput's local 2.2s celebration.
      if (result.correct) {
        onCompleted(result.correctAnswerReveal ?? null);
      }
      return {
        correct: result.correct,
        attemptNumber: result.attemptNumber,
        hint: result.hint,
      };
    },
    [missionId, houseId, onCompleted],
  );

  const handleMultiSubmit = useCallback(
    async (answers: Record<string, string>) => {
      const result = await postMissionAnswer(missionId, answers, houseId, getSessionHash());
      if (result.correct) {
        onCompleted(result.correctAnswerReveal ?? null);
      }
      return {
        correct: result.correct,
        attemptNumber: result.attemptNumber,
        hint: result.hint,
        fieldResults: result.fieldResults,
      };
    },
    [missionId, houseId, onCompleted],
  );

  // onSuccess is a no-op — the parent already fired onCompleted immediately
  // upon the correct answer; the takeover overlay covers AnswerInput entirely.
  if (answerMeta?.type === "multiple_text") {
    return (
      <MultiTextAnswerInput
        answerMeta={answerMeta}
        onSubmit={handleMultiSubmit}
        onSuccess={() => {}}
      />
    );
  }

  return (
    <AnswerInput
      answerMeta={answerMeta}
      onSubmit={handleSingleSubmit}
      onSuccess={() => {}}
    />
  );
}

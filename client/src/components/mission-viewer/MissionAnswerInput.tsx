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
  onCompleted: () => void;
}

export function MissionAnswerInput({ missionId, houseId, answerMeta, onCompleted }: Props) {
  const handleSingleSubmit = useCallback(
    async (answer: string) => {
      const result = await postMissionAnswer(missionId, answer, houseId, getSessionHash());
      return {
        correct: result.correct,
        attemptNumber: result.attemptNumber,
        hint: result.hint,
      };
    },
    [missionId, houseId],
  );

  const handleMultiSubmit = useCallback(
    async (answers: Record<string, string>) => {
      const result = await postMissionAnswer(missionId, answers, houseId, getSessionHash());
      return {
        correct: result.correct,
        attemptNumber: result.attemptNumber,
        hint: result.hint,
      };
    },
    [missionId, houseId],
  );

  if (answerMeta?.type === "multiple_text") {
    return (
      <MultiTextAnswerInput
        answerMeta={answerMeta}
        onSubmit={handleMultiSubmit}
        onSuccess={onCompleted}
      />
    );
  }

  return (
    <AnswerInput
      answerMeta={answerMeta}
      onSubmit={handleSingleSubmit}
      onSuccess={onCompleted}
    />
  );
}

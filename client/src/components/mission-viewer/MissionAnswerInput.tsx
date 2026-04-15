import { useCallback } from "react";
import { postMissionAnswer } from "../../api/missions";
import { getSessionHash } from "../../utils/session";
import { AnswerInput } from "../shared/AnswerInput";
import type { AnswerMeta } from "@cardsight/shared";

interface Props {
  missionId: string;
  houseId?: string;
  answerMeta: AnswerMeta | null;
  onCompleted: () => void;
}

export function MissionAnswerInput({ missionId, houseId, answerMeta, onCompleted }: Props) {
  const handleSubmit = useCallback(
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

  return (
    <AnswerInput
      answerMeta={answerMeta}
      onSubmit={handleSubmit}
      onSuccess={onCompleted}
    />
  );
}

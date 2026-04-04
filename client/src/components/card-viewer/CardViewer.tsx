import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router";
import { fetchCard, postScan, postEnter, CardNotFoundError } from "../../api/cards";
import { getSessionHash } from "../../utils/session";
import { CardShell } from "./CardShell";
import { CardContent } from "./CardContent";
import { EntryGate } from "./EntryGate";
import { VisibilityGuard } from "./VisibilityGuard";
import { LoadingState } from "./states/LoadingState";
import { NotFoundState } from "./states/NotFoundState";
import { LockedOutState } from "./states/LockedOutState";
import { SelfDestructedState } from "./states/SelfDestructedState";
import { AlreadyAnsweredState } from "./states/AlreadyAnsweredState";
import { SingleAnswerInput } from "./answers/SingleAnswerInput";
import { SelfDestructTimer } from "./SelfDestructTimer";
import { AnimationWrapper } from "./animations/AnimationWrapper";
import { OverlayRenderer } from "./overlays/OverlayRenderer";
import type { CardViewerResponse } from "@cardsight/shared";

export function CardViewer() {
  const { cardId } = useParams<{ cardId: string }>();
  const [card, setCard] = useState<CardViewerResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [entered, setEntered] = useState(false);
  const [justSolved, setJustSolved] = useState(false);

  const loadCard = useCallback(async () => {
    if (!cardId) return;
    try {
      const data = await fetchCard(cardId);
      setCard(data);

      // Auto-enter if no gate
      if (!data.hasEntryGate && data.status === "available") {
        const enterResult = await postEnter(cardId);
        if (enterResult.selfDestructedAt && !data.selfDestructedAt) {
          data.selfDestructedAt = enterResult.selfDestructedAt;
        }
        setCard({ ...data });
        setEntered(true);
      }

      // Skip gate for non-available states
      if (data.status !== "available") {
        setEntered(true);
      }
    } catch (err) {
      if (err instanceof CardNotFoundError) {
        setNotFound(true);
      }
    } finally {
      setLoading(false);
    }
  }, [cardId]);

  useEffect(() => {
    loadCard();
  }, [loadCard]);

  // Fire scan event after card loads (always, regardless of gate)
  useEffect(() => {
    if (!cardId || !card || card.status === "locked_out") return;
    const session = getSessionHash();
    postScan(cardId, session).catch(() => {});
  }, [cardId, card?.status]);

  const handleEnter = useCallback(async () => {
    if (!cardId) return;
    const result = await postEnter(cardId);
    setCard((prev) =>
      prev
        ? { ...prev, selfDestructedAt: result.selfDestructedAt ?? prev.selfDestructedAt }
        : prev,
    );
    setEntered(true);
  }, [cardId]);

  const handleSolved = useCallback(() => {
    setJustSolved(true);
    setCard((prev) =>
      prev ? { ...prev, isSolved: true, status: "answered" } : prev,
    );
  }, []);

  const handleSelfDestruct = useCallback(() => {
    setCard((prev) =>
      prev ? { ...prev, status: "self_destructed" } : prev,
    );
  }, []);

  if (loading) return <LoadingState />;
  if (notFound || !card) return <NotFoundState />;

  const showAnswerInput =
    card.isAnswerable &&
    card.answerTemplateType === "single_answer" &&
    cardId &&
    !card.isSolved;

  return (
    <CardShell design={card.design}>
      <OverlayRenderer effect={card.design?.overlayEffect ?? null} />
      {entered && card.status === "available" && <VisibilityGuard />}

      {/* Locked out */}
      {card.status === "locked_out" && (
        <AnimationWrapper type="fade">
          <LockedOutState reason={card.lockedOutReason} />
        </AnimationWrapper>
      )}

      {/* Already answered */}
      {card.status === "answered" && (
        <AnimationWrapper type={card.design?.animationIn ?? "fade"}>
          <AlreadyAnsweredState card={card} justSolved={justSolved} />
        </AnimationWrapper>
      )}

      {/* Self-destructed */}
      {card.status === "self_destructed" && (
        <AnimationWrapper type="fade">
          <SelfDestructedState
            text={card.selfDestructText}
            title={card.answerVisibleAfterDestruct ? card.title : undefined}
          >
            {card.answerVisibleAfterDestruct && showAnswerInput && (
              <SingleAnswerInput
                cardId={cardId!}
                answerMeta={card.answerMeta}
                onSolved={handleSolved}
              />
            )}
          </SelfDestructedState>
        </AnimationWrapper>
      )}

      {/* Available — show gate or content */}
      {card.status === "available" && !entered && card.hasEntryGate && (
        <EntryGate card={card} onEnter={handleEnter} />
      )}

      {card.status === "available" && entered && (
        <AnimationWrapper type={card.design?.animationIn ?? "fade"}>
          <CardContent
            title={card.title}
            description={card.description}
            clueVisibleCategory={card.clueVisibleCategory}
          />

          {card.selfDestructedAt && (
            <SelfDestructTimer
              deadline={card.selfDestructedAt}
              onExpired={handleSelfDestruct}
            />
          )}

          {showAnswerInput && (
            <SingleAnswerInput
              cardId={cardId!}
              answerMeta={card.answerMeta}
              onSolved={handleSolved}
            />
          )}
        </AnimationWrapper>
      )}
    </CardShell>
  );
}

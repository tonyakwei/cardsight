import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router";
import { fetchCard, postScan, postExamine, CardNotFoundError, CardWrongActError } from "../../api/cards";
import { getSessionHash } from "../../utils/session";
import { CardShell } from "./CardShell";
import { CardContent } from "./CardContent";
import { SplashGate } from "./SplashGate";
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
import { PhysicalCardFlash, isPhysicalCard } from "./PhysicalCardFlash";
import type { CardViewerResponse } from "@cardsight/shared";

export function CardViewer() {
  const { cardId } = useParams<{ cardId: string }>();
  const [card, setCard] = useState<CardViewerResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [wrongAct, setWrongAct] = useState(false);
  const [examined, setExamined] = useState(false);
  const [justSolved, setJustSolved] = useState(false);
  const [flashDone, setFlashDone] = useState(
    () => !cardId || !isPhysicalCard(cardId),
  );

  const loadCard = useCallback(async () => {
    if (!cardId) return;
    try {
      const data = await fetchCard(cardId);
      setCard(data);

      // Skip splash for non-available states or already-examined cards
      if (data.status !== "available" || data.isExamined) {
        setExamined(true);
      }
    } catch (err) {
      if (err instanceof CardNotFoundError) {
        setNotFound(true);
      } else if (err instanceof CardWrongActError) {
        setWrongAct(true);
      }
    } finally {
      setLoading(false);
    }
  }, [cardId]);

  useEffect(() => {
    loadCard();
  }, [loadCard]);

  // Fire scan event after card loads
  useEffect(() => {
    if (!cardId || !card || card.status === "locked_out") return;
    const session = getSessionHash();
    postScan(cardId, session).catch(() => {});
  }, [cardId, card?.status]);

  const handleExamine = useCallback(async () => {
    if (!cardId) return;
    const result = await postExamine(cardId);
    setCard((prev) =>
      prev
        ? { ...prev, isExamined: true, selfDestructedAt: result.selfDestructedAt ?? prev.selfDestructedAt }
        : prev,
    );
    setExamined(true);
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

  if (!flashDone && cardId) {
    return <PhysicalCardFlash cardId={cardId} act={card?.act ?? undefined} onComplete={() => setFlashDone(true)} />;
  }
  if (loading) return <LoadingState />;
  if (wrongAct) {
    return (
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        height: "100dvh", color: "#888", fontFamily: "system-ui", padding: "2rem", textAlign: "center",
      }}>
        <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>~</div>
        <div style={{ fontSize: "1.1rem", fontWeight: 600, color: "#aaa", marginBottom: "0.5rem" }}>
          This card is not active right now
        </div>
        <div style={{ fontSize: "0.85rem", color: "#666" }}>
          Check with your host for the current act's cards.
        </div>
      </div>
    );
  }
  if (notFound || !card) return <NotFoundState />;

  const isComplex = card.complexity === "complex";

  // Only complex cards show the answer input
  const showAnswerInput =
    isComplex &&
    card.isAnswerable &&
    card.answerTemplateType === "single_answer" &&
    cardId &&
    !card.isSolved;

  return (
    <CardShell design={card.design}>
      <OverlayRenderer effect={card.design?.overlayEffect ?? null} />
      {examined && card.status === "available" && <VisibilityGuard />}

      {/* Locked out */}
      {card.status === "locked_out" && (
        <AnimationWrapper type="fade">
          <LockedOutState reason={card.lockedOutReason} />
        </AnimationWrapper>
      )}

      {/* Already answered (complex cards that were solved) */}
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
            header={card.answerVisibleAfterDestruct ? card.header : undefined}
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

      {/* Available — show splash gate or content */}
      {card.status === "available" && !examined && (
        <SplashGate
          itemName={card.clueVisibleCategory}
          examineText={card.examineText}
          selfDestructTimer={card.selfDestructTimer}
          onExamine={handleExamine}
        />
      )}

      {card.status === "available" && examined && (
        <AnimationWrapper type={card.design?.animationIn ?? "fade"}>
          <CardContent
            header={card.header}
            description={card.description}
            itemName={card.clueVisibleCategory}
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

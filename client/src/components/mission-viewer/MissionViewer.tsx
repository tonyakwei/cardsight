import { useEffect, useState, useCallback, type ReactNode } from "react";
import { useParams } from "react-router";
import { fetchMission, postMissionScan, MissionNotFoundError } from "../../api/missions";
import { getSessionHash } from "../../utils/session";
import { CardShell } from "../card-viewer/CardShell";
import { CardContent } from "../card-viewer/CardContent";
import { AnimationWrapper } from "../card-viewer/animations/AnimationWrapper";
import { OverlayRenderer } from "../card-viewer/overlays/OverlayRenderer";
import { MissionAnswerInput } from "./MissionAnswerInput";
import { MissionDoors } from "./MissionDoors";
import { MissionRevealOverlay } from "./MissionRevealOverlay";
import { RequiredItems } from "./RequiredItems";
import { getActTheme, type ActTheme } from "./actThemes";
import type { MissionViewerResponse, CardDesign } from "@cardsight/shared";

const HOUSE_STORAGE_KEY = "cardsight_house";

// When an act has a registered theme, the CardShell sits on top of an
// animated ambient layer (see actThemes.ts). The shell background is
// therefore partly transparent, with a dark veil over the content area
// keeping the puzzle text readable while the backdrop shows through at
// the edges. Acts with no registered theme use the original opaque fill.
function houseTintedDesign(houseColor: string, theme: ActTheme | null): CardDesign {
  const bgColor = theme ? "transparent" : "#0a0a0a";
  const bgGradient = theme
    ? `radial-gradient(ellipse at top, ${houseColor}33 0%, transparent 55%), linear-gradient(180deg, rgba(${theme.veilRgb},0.92) 0%, rgba(${theme.veilRgb},0.86) 55%, rgba(${theme.veilRgb},0.4) 82%, rgba(${theme.veilRgb},0.05) 100%)`
    : `radial-gradient(ellipse at top, ${houseColor}1f 0%, #0a0a0a 60%)`;
  return {
    bgColor,
    bgGradient,
    bgImageUrl: null,
    textColor: "#e8e8e8",
    accentColor: houseColor,
    secondaryColor: houseColor,
    fontFamily: '"Lora", Georgia, serif',
    cardStyle: "default",
    animationIn: "fade",
    borderStyle: null,
    overlayEffect: null,
    customCss: null,
  };
}

function getStoredHouseId(): string | null {
  try {
    return sessionStorage.getItem(HOUSE_STORAGE_KEY);
  } catch {
    return null;
  }
}

function storeHouseId(houseId: string) {
  try {
    sessionStorage.setItem(HOUSE_STORAGE_KEY, houseId);
  } catch {}
}

const DEFAULT_DOOR_ACCENT = "#d4a574";

export function MissionViewer() {
  const { missionId } = useParams<{ missionId: string }>();
  const [mission, setMission] = useState<MissionViewerResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [justCompleted, setJustCompleted] = useState(false);
  const [selectedHouse, setSelectedHouse] = useState<string | null>(getStoredHouseId);
  const [revealPhase, setRevealPhase] = useState<"idle" | "confetti" | "revealed">("idle");
  const [revealText, setRevealText] = useState<string | null>(null);
  // Doors mount immediately on first render and stay closed until the
  // mission data arrives, masking the fetch round-trip behind a temple-door
  // beat. They then slide open and unmount.
  const [doorsState, setDoorsState] = useState<"closed" | "opening" | "done">("closed");

  const loadMission = useCallback(async () => {
    if (!missionId) return;
    try {
      const data = await fetchMission(missionId);
      setMission(data);

      // Auto-select house if single-house mission
      if (data.houses.length === 1) {
        setSelectedHouse(data.houses[0].id);
        storeHouseId(data.houses[0].id);
      } else if (selectedHouse && data.houses.some((h) => h.id === selectedHouse)) {
        // Keep stored house if it's valid for this mission
      } else {
        setSelectedHouse(null);
      }

      // Revisit of an already-completed mission: jump straight to the reveal
      // panel (no confetti, no puzzle prompt). They've earned this view once.
      if (data.isCompleted) {
        setRevealText(data.correctAnswerReveal);
        setRevealPhase("revealed");
      }
    } catch (err) {
      if (err instanceof MissionNotFoundError) {
        setNotFound(true);
      }
    } finally {
      setLoading(false);
    }
  }, [missionId]);

  useEffect(() => {
    loadMission();
  }, [loadMission]);

  // Fire scan event after mission loads
  useEffect(() => {
    if (!missionId || !mission) return;
    const session = getSessionHash();
    postMissionScan(missionId, selectedHouse ?? undefined, session).catch(() => {});
  }, [missionId, mission?.id]);

  // Drive the doors state machine.
  //  closed  → opening: data has loaded and the next view is a real puzzle/picker
  //  closed  → done:    skip the slide entirely (revisit, locked, not-found)
  useEffect(() => {
    if (doorsState !== "closed") return;
    if (notFound) {
      setDoorsState("done");
      return;
    }
    if (loading || !mission) return; // still waiting on the fetch
    if (mission.isCompleted || mission.lockedOut) {
      setDoorsState("done");
      return;
    }
    setDoorsState("opening");
  }, [loading, mission, notFound, doorsState]);

  const handleHouseSelect = (houseId: string) => {
    setSelectedHouse(houseId);
    storeHouseId(houseId);
  };

  const handleCompleted = useCallback((reveal: string | null) => {
    if (revealPhase !== "idle") return; // already triggered
    setRevealText(reveal);
    setRevealPhase("confetti");
    setJustCompleted(true);
    setMission((prev) =>
      prev ? { ...prev, isCompleted: true, isAnswerable: false, correctAnswerReveal: reveal } : prev,
    );
    // 2.5s of full-screen confetti, then transition to the reveal panel.
    setTimeout(() => setRevealPhase("revealed"), 2500);
  }, [revealPhase]);

  // === Derived view state (safe to compute even when mission is null) ===

  const activeHouse =
    mission?.houses.find((h) => h.id === selectedHouse) ?? mission?.houses[0] ?? null;
  const actTheme = mission && !mission.design ? getActTheme(mission.act) : null;
  const effectiveDesign: CardDesign | null =
    mission?.design ?? (activeHouse ? houseTintedDesign(activeHouse.color, actTheme) : null);
  const Ambient = actTheme?.Ambient ?? null;
  const doorAccent = effectiveDesign?.accentColor ?? activeHouse?.color ?? DEFAULT_DOOR_ACCENT;

  // === Pick the content branch ===

  let content: ReactNode;

  if (notFound) {
    content = (
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", minHeight: "100dvh", color: "#888", textAlign: "center", padding: "2rem" }}>
        <div style={{ fontSize: "1.2rem", marginBottom: "0.5rem" }}>Mission not found</div>
        <div style={{ fontSize: "0.85rem", opacity: 0.6 }}>This QR code may be invalid or the mission may have been removed.</div>
      </div>
    );
  } else if (loading || !mission) {
    // Minimal dark backdrop sitting beneath the closed doors. The doors
    // mask this entirely; tap-to-skip will reveal it briefly until data
    // lands.
    content = (
      <div style={{ minHeight: "100dvh", background: "#0a0a0a" }} />
    );
  } else if (!selectedHouse && mission.houses.length > 1) {
    content = (
      <CardShell design={effectiveDesign}>
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "60dvh",
          textAlign: "center",
          gap: "2rem",
          animation: "fadeIn 0.4s ease-out",
        }}>
          <div style={{ fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.15em", opacity: 0.5 }}>
            Mission
          </div>
          <h1 style={{ fontSize: "1.3rem", fontWeight: 700, color: "var(--card-accent-color)" }}>
            {mission.title}
          </h1>
          <div style={{ fontSize: "0.9rem", opacity: 0.7, marginBottom: "0.5rem" }}>
            Which house are you?
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", width: "100%", maxWidth: "280px" }}>
            {mission.houses.map((house) => (
              <button
                key={house.id}
                onClick={() => handleHouseSelect(house.id)}
                style={{
                  padding: "0.85rem 1.5rem",
                  fontSize: "1rem",
                  fontWeight: 600,
                  borderRadius: "10px",
                  border: `2px solid ${house.color}`,
                  background: "rgba(255,255,255,0.04)",
                  color: house.color,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
              >
                {house.name}
              </button>
            ))}
          </div>
        </div>
        <style>{`@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }`}</style>
      </CardShell>
    );
  } else if (mission.lockedOut) {
    content = (
      <CardShell design={effectiveDesign}>
        <OverlayRenderer effect={effectiveDesign?.overlayEffect ?? null} />
        <AnimationWrapper type="fade">
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60dvh", textAlign: "center", gap: "1.5rem" }}>
            <div style={{ fontSize: "2rem" }}>🔒</div>
            <div style={{ fontSize: "1.1rem", fontWeight: 600, color: "var(--card-accent-color)" }}>Mission Locked</div>
            {mission.lockedOutReason && (
              <div style={{ fontSize: "0.9rem", opacity: 0.7, maxWidth: "300px", lineHeight: 1.6 }}>
                {mission.lockedOutReason}
              </div>
            )}
          </div>
        </AnimationWrapper>
      </CardShell>
    );
  } else {
    content = (
      <CardShell design={effectiveDesign}>
        <OverlayRenderer effect={effectiveDesign?.overlayEffect ?? null} />
        <AnimationWrapper type={effectiveDesign?.animationIn ?? "fade"}>
          <CardContent
            header={mission.title}
            description={mission.puzzleDescription}
          />

          {mission.warnings.length > 0 && (
            <div style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {mission.warnings.map((w, i) => (
                <div
                  key={i}
                  style={{
                    padding: "0.75rem 1rem",
                    borderRadius: "8px",
                    background: "rgba(255, 200, 0, 0.08)",
                    border: "1px solid rgba(255, 200, 0, 0.25)",
                    fontSize: "0.85rem",
                    lineHeight: 1.6,
                    color: "#ffd54f",
                  }}
                >
                  {w}
                </div>
              ))}
            </div>
          )}

          {mission.requiredClueSets.length > 0 && (
            <RequiredItems itemSets={mission.requiredClueSets} />
          )}

          {mission.isCompleted && (
            <div style={{
              marginTop: "2rem",
              padding: "1.25rem",
              borderRadius: "12px",
              background: justCompleted ? "rgba(105, 240, 174, 0.12)" : "rgba(255,255,255,0.05)",
              border: justCompleted ? "1px solid rgba(105, 240, 174, 0.3)" : "1px solid rgba(255,255,255,0.1)",
              textAlign: "center",
              animation: justCompleted ? "solvedPulse 0.6s ease-out" : undefined,
            }}>
              <div style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>✓</div>
              <div style={{ fontSize: "0.95rem", fontWeight: 600, color: justCompleted ? "#69f0ae" : "var(--card-accent-color)" }}>
                {justCompleted ? "Correct! Mission complete." : "This mission has been completed"}
              </div>
            </div>
          )}

          {mission.isAnswerable && missionId && (
            <MissionAnswerInput
              missionId={missionId}
              houseId={selectedHouse ?? undefined}
              answerMeta={mission.answerMeta}
              onCompleted={handleCompleted}
              onLocked={() => {
                setMission((prev) =>
                  prev
                    ? {
                        ...prev,
                        lockedOut: true,
                        lockedOutReason: prev.lockedOutReason ?? "Too many incorrect attempts.",
                        isAnswerable: false,
                      }
                    : prev,
                );
              }}
            />
          )}
        </AnimationWrapper>

        <style>{`
          @keyframes solvedPulse {
            0% { transform: scale(0.95); opacity: 0; }
            50% { transform: scale(1.02); }
            100% { transform: scale(1); opacity: 1; }
          }
        `}</style>
      </CardShell>
    );
  }

  return (
    <>
      {Ambient && <Ambient />}
      {content}
      {doorsState !== "done" && (
        <MissionDoors
          accentColor={doorAccent}
          phase={doorsState}
          onDone={() => setDoorsState("done")}
        />
      )}
      {revealPhase !== "idle" && mission && (
        <MissionRevealOverlay
          phase={revealPhase}
          houseColor={
            mission.houses.find((h) => h.id === selectedHouse)?.color ?? "#6b7280"
          }
          houseName={
            mission.houses.find((h) => h.id === selectedHouse)?.name ?? ""
          }
          revealText={revealText}
          missionTitle={mission.title}
          onDismiss={() => setRevealPhase("idle")}
        />
      )}
    </>
  );
}

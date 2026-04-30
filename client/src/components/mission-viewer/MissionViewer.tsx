import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router";
import { fetchMission, postMissionScan, MissionNotFoundError } from "../../api/missions";
import { getSessionHash } from "../../utils/session";
import { CardShell } from "../card-viewer/CardShell";
import { CardContent } from "../card-viewer/CardContent";
import { AnimationWrapper } from "../card-viewer/animations/AnimationWrapper";
import { OverlayRenderer } from "../card-viewer/overlays/OverlayRenderer";
import { MissionAnswerInput } from "./MissionAnswerInput";
import { MissionRevealOverlay } from "./MissionRevealOverlay";
import { RequiredItems } from "./RequiredItems";
import type { MissionViewerResponse, CardDesign } from "@cardsight/shared";

const HOUSE_STORAGE_KEY = "cardsight_house";

function houseTintedDesign(houseColor: string): CardDesign {
  return {
    bgColor: "#0a0a0a",
    bgGradient: `radial-gradient(ellipse at top, ${houseColor}1f 0%, #0a0a0a 60%)`,
    bgImageUrl: null,
    textColor: "#e8e8e8",
    accentColor: houseColor,
    secondaryColor: houseColor,
    fontFamily: "system-ui",
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

export function MissionViewer() {
  const { missionId } = useParams<{ missionId: string }>();
  const [mission, setMission] = useState<MissionViewerResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [justCompleted, setJustCompleted] = useState(false);
  const [selectedHouse, setSelectedHouse] = useState<string | null>(getStoredHouseId);
  const [revealPhase, setRevealPhase] = useState<"idle" | "confetti" | "revealed">("idle");
  const [revealText, setRevealText] = useState<string | null>(null);

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

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100dvh", color: "#888" }}>
        Loading...
      </div>
    );
  }

  if (notFound || !mission) {
    return (
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", minHeight: "100dvh", color: "#888", textAlign: "center", padding: "2rem" }}>
        <div style={{ fontSize: "1.2rem", marginBottom: "0.5rem" }}>Mission not found</div>
        <div style={{ fontSize: "0.85rem", opacity: 0.6 }}>This QR code may be invalid or the mission may have been removed.</div>
      </div>
    );
  }

  const activeHouse =
    mission.houses.find((h) => h.id === selectedHouse) ?? mission.houses[0] ?? null;
  const effectiveDesign =
    mission.design ?? (activeHouse ? houseTintedDesign(activeHouse.color) : null);

  // House picker for multi-house missions
  if (!selectedHouse && mission.houses.length > 1) {
    return (
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
  }

  // Locked out
  if (mission.lockedOut) {
    return (
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
  }

  return (
    <CardShell design={effectiveDesign}>
      <OverlayRenderer effect={effectiveDesign?.overlayEffect ?? null} />
      <AnimationWrapper type={effectiveDesign?.animationIn ?? "fade"}>
        <CardContent
          header={mission.title}
          description={mission.puzzleDescription ?? mission.description}
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

      {revealPhase !== "idle" && (
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
    </CardShell>
  );
}

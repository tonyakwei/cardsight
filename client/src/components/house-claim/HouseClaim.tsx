import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { DrakeFlash } from "./DrakeFlash";
import { JonesFlash } from "./JonesFlash";
import { CroftFlash } from "./CroftFlash";
import { GenericFlash } from "./GenericFlash";

type ClaimResponse = {
  id: string;
  name: string;
  color: string;
  slug: string;
};

export function HouseClaim() {
  const { slug } = useParams<{ slug: string }>();
  const [house, setHouse] = useState<ClaimResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    fetch(`/api/house-claim/${encodeURIComponent(slug.toLowerCase())}`, {
      method: "POST",
    })
      .then(async (res) => {
        if (!res.ok) {
          const body = (await res.json().catch(() => null)) as { error?: string } | null;
          throw new Error(body?.error ?? `HTTP ${res.status}`);
        }
        return (await res.json()) as ClaimResponse;
      })
      .then((data) => {
        if (cancelled) return;
        setHouse(data);
      })
      .catch((err: Error) => {
        if (cancelled) return;
        setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (error) {
    return (
      <div
        style={{
          minHeight: "100dvh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a0a0a",
          color: "#e0e0e0",
          fontFamily: "system-ui, sans-serif",
          padding: "2rem",
          textAlign: "center",
        }}
      >
        <div>
          <div style={{ fontSize: 14, color: "#888", marginBottom: 8 }}>
            House not recognized
          </div>
          <div style={{ fontSize: 12, color: "#555" }}>{error}</div>
        </div>
      </div>
    );
  }

  if (!house) {
    return (
      <div
        style={{
          minHeight: "100dvh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a0a0a",
        }}
      />
    );
  }

  const themed = pickTheme(house.slug);
  return <ThemedFlash component={themed} house={house} />;
}

function pickTheme(slug: string) {
  const normalized = slug.toLowerCase();
  if (normalized.includes("drake")) return "drake" as const;
  if (normalized.includes("jones")) return "jones" as const;
  if (normalized.includes("croft")) return "croft" as const;
  return "generic" as const;
}

type Theme = "drake" | "jones" | "croft" | "generic";

function ThemedFlash({
  component,
  house,
}: {
  component: Theme;
  house: ClaimResponse;
}) {
  if (component === "drake") return <DrakeFlash house={house} />;
  if (component === "jones") return <JonesFlash house={house} />;
  if (component === "croft") return <CroftFlash house={house} />;
  return <GenericFlash house={house} />;
}

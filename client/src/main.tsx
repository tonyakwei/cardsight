import "@mantine/core/styles.css";
import "./styles/global.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { MantineProvider, createTheme } from "@mantine/core";
import { BrowserRouter, Routes, Route } from "react-router";
import { CardViewer } from "./components/card-viewer/CardViewer";
import { MissionViewer } from "./components/mission-viewer/MissionViewer";
import { ShowtimeViewer } from "./components/showtime/ShowtimeViewer";
import { HouseClaim } from "./components/house-claim/HouseClaim";
import { AdminLayout } from "./components/admin/AdminLayout";
import { GameList } from "./components/admin/GameList";
import { CardManager } from "./components/admin/CardManager";
import { MissionManager } from "./components/admin/MissionManager";
import { ActBreakView } from "./components/admin/ActBreakView";
import { ConsequencePrint } from "./components/admin/ConsequencePrint";
import { LiveDashboard } from "./components/admin/LiveDashboard";
import { ShowtimeManager } from "./components/admin/ShowtimeManager";
import { StorySheetManager } from "./components/admin/StorySheetManager";
import { StorySheetPrint } from "./components/admin/StorySheetPrint";
import { PrintCenter } from "./components/admin/PrintCenter";
import { ArtifactCatalogPrint } from "./components/admin/ArtifactCatalogPrint";
import { GlyphCodexPrint } from "./components/admin/GlyphCodexPrint";
import { WelcomePlacardPrint } from "./components/admin/WelcomePlacardPrint";
import { QuietBedGridPrint } from "./components/admin/QuietBedGridPrint";
import { CanopyMapPrint } from "./components/admin/CanopyMapPrint";
import { ReckoningFloorPrint } from "./components/admin/ReckoningFloorPrint";
import { HostConsole } from "./components/admin/HostConsole";
import { TableSimulator } from "./components/admin/simulator/TableSimulator";

const theme = createTheme({
  primaryColor: "yellow",
  fontFamily: "system-ui, -apple-system, sans-serif",
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <MantineProvider theme={theme} forceColorScheme="dark">
      <BrowserRouter>
        <Routes>
          <Route path="/c/:cardId" element={<CardViewer />} />
          <Route path="/m/:missionId" element={<MissionViewer />} />
          <Route path="/showtime/:showtimeId" element={<ShowtimeViewer />} />
          <Route path="/h/:slug" element={<HouseClaim />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<GameList />} />
            <Route path="games/:gameId" element={<CardManager />} />
            <Route path="games/:gameId/dashboard" element={<LiveDashboard />} />
            <Route path="games/:gameId/missions" element={<MissionManager />} />
            <Route path="games/:gameId/showtimes" element={<ShowtimeManager />} />
            <Route path="games/:gameId/story-sheets" element={<StorySheetManager />} />
            <Route path="games/:gameId/story-sheets/print" element={<StorySheetPrint />} />
            <Route path="games/:gameId/act-break" element={<ActBreakView />} />
            <Route path="games/:gameId/act-break/print" element={<ConsequencePrint />} />
            <Route path="games/:gameId/simulator" element={<TableSimulator />} />
            <Route path="games/:gameId/print" element={<PrintCenter />} />
            <Route path="games/:gameId/print/artifact-catalog" element={<ArtifactCatalogPrint />} />
            <Route path="games/:gameId/print/glyph-codex" element={<GlyphCodexPrint />} />
            <Route path="games/:gameId/print/welcome-placard" element={<WelcomePlacardPrint />} />
            <Route path="games/:gameId/print/quiet-bed" element={<QuietBedGridPrint />} />
            <Route path="games/:gameId/print/canopy-map" element={<CanopyMapPrint />} />
            <Route path="games/:gameId/print/reckoning-floor" element={<ReckoningFloorPrint />} />
            <Route path="games/:gameId/console" element={<HostConsole />} />
          </Route>
          <Route
            path="*"
            element={
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "100dvh",
                  color: "#888",
                  fontFamily: "system-ui",
                }}
              >
                CardSight — Scan a QR code to begin.
              </div>
            }
          />
        </Routes>
      </BrowserRouter>
    </MantineProvider>
  </StrictMode>,
);

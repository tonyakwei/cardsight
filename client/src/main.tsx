import "@mantine/core/styles.css";
import "./styles/global.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { MantineProvider, createTheme } from "@mantine/core";
import { BrowserRouter, Routes, Route } from "react-router";
import { CardViewer } from "./components/card-viewer/CardViewer";
import { AdminLayout } from "./components/admin/AdminLayout";
import { GameList } from "./components/admin/GameList";
import { CardManager } from "./components/admin/CardManager";
import { TableSimulator } from "./components/admin/simulator/TableSimulator";

const theme = createTheme({
  primaryColor: "yellow",
  fontFamily: "system-ui, -apple-system, sans-serif",
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <MantineProvider theme={theme} defaultColorScheme="dark">
      <BrowserRouter>
        <Routes>
          <Route path="/c/:cardId" element={<CardViewer />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<GameList />} />
            <Route path="games/:gameId" element={<CardManager />} />
            <Route path="games/:gameId/simulator" element={<TableSimulator />} />
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

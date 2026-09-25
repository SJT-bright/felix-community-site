import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import OpeningSequence from "./components/OpeningSequence.jsx";
import CosmicBackground from "./components/CosmicBackground.jsx";
import NotFoundPage from "./pages/NotFoundPage.jsx";
import LabPage from "./pages/LabPage.jsx";
import "./styles/global.css";
import "./styles/career.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    {location.pathname === "/" ? <OpeningSequence><App /></OpeningSequence> : /^\/lab\/?$/.test(location.pathname) ? <LabPage /> : <NotFoundPage />}
    <CosmicBackground />
  </StrictMode>
);

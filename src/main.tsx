
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { FreeSdsTrialProvider } from "./contexts/FreeSdsTrialContext.tsx";

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element not found");
}

const root = createRoot(rootElement);
root.render(
  <React.StrictMode>
    <FreeSdsTrialProvider>
      <App />
    </FreeSdsTrialProvider>
  </React.StrictMode>
);

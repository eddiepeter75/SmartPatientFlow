import { createRoot } from "react-dom/client";
import { StrictMode } from "react";
import App from "./App";
import "./index.css";
import { initializeFirebase } from "./lib/firebase";

// Initialize Firebase
initializeFirebase();

// Log environment information
console.log("Environment:", {
  dev: import.meta.env.DEV,
  prod: import.meta.env.PROD,
  base: import.meta.env.BASE_URL,
  mode: import.meta.env.MODE
});

// Mount the app
const rootElement = document.getElementById("root");
if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
} else {
  console.error("Failed to find root element");
}

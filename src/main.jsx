import React from "react";
import ReactDOM from "react-dom/client";
import PrayerApp from "./PrayerApp.jsx";

const root = document.getElementById("root");

if (!root) {
  throw new Error("Root element not found");
}

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <PrayerApp />
  </React.StrictMode>
);

import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import PrayerApp from "./PrayerApp.jsx";
import AnswerPrayer from "./AnswerPrayer.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PrayerApp />} />
        <Route path="/answer" element={<AnswerPrayer />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);

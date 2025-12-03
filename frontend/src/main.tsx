import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import DemoPage from "./pages/DemoPage";
import MapView from "./pages/MapView";
import SystemStatus from "./pages/SystemStatus";
import DocsPage from "./pages/DocsPage";
import "./App.css";
import "./pages/HomePage.css";
import "./pages/DemoPage.css";
import "./pages/MapView.css";
import "./pages/SystemStatus.css";
import "./pages/DocsPage.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/demo" element={<DemoPage />} />
        <Route path="/map" element={<MapView />} />
        <Route path="/status" element={<SystemStatus />} />
        <Route path="/docs" element={<DocsPage />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);

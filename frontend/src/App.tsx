import React from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import LearnerPage from "./pages/LearnerPage";
import AdminPage from "./pages/AdminPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/learner" replace />} />
        <Route path="/learner" element={<LearnerPage />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </BrowserRouter>
  );
}

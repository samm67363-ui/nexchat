import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ChatPage from "./pages/ChatPage";

import PrivacySettingsPage from "./pages/PrivacySettingsPage";

import InvitePage from "./pages/InvitePage";


const PrivateRoute = ({ children }) => {
  const { currentUser } = useAuth();
  return currentUser ? children : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }) => {
  const { currentUser } = useAuth();
  return !currentUser ? children : <Navigate to="/" replace />;
};

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
        <Route path="/" element={<PrivateRoute><ChatPage /></PrivateRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
        <Route path="/privacy" element={<PrivateRoute><PrivacySettingsPage /></PrivateRoute>} />
        <Route path="/invite/:code" element={<PrivateRoute><InvitePage /></PrivateRoute>} />
      </Routes>
      
    </BrowserRouter>
  );
}
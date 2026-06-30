import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { AuthProvider } from "./context/AuthContext.jsx";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import { ChatProvider } from "./context/ChatContext.jsx";
import { Toaster } from "react-hot-toast";
import "./styles/globals.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <ChatProvider>
          <App />
          <Toaster
            position="top-center"
            toastOptions={{
              style: {
                background: "var(--surface)",
                color: "var(--text-primary)",
                border: "1px solid var(--border)",
                borderRadius: "12px",
                fontSize: "14px",
              },
            }}
          />
        </ChatProvider>
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>
);
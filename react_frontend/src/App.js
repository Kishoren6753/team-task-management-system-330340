import React from "react";
import { BrowserRouter } from "react-router-dom";
import "./App.css";
import { AuthProvider } from "./state/auth/AuthContext";
import { ToastProvider } from "./state/toast/ToastContext";
import { AppRoutes } from "./routes/AppRoutes";

// PUBLIC_INTERFACE
function App() {
  /** Application entry: wraps providers and routing. */
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;

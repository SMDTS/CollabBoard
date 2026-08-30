import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { ThemeProvider } from "./context/ThemeContext";
import { ToastProvider } from "./context/ToastContext";
import { AuthProvider } from "./context/AuthContext";
import { BoardsProvider } from "./context/BoardsContext";
import "./App.css";

// TasksProvider, BoardsProvider, and UsersProvider live inside App.jsx now,
// not here — they fetch from protected endpoints, so they should only
// mount once we know the user is actually authenticated. Mounting them
// unconditionally here meant every visit to /login fired failed fetches
// against those endpoints before anyone had a token, surfacing as error
// toasts on the login screen. See App.jsx for where they're now scoped.
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <BoardsProvider>
            <TasksProvider>
              <BrowserRouter>
                <App />
              </BrowserRouter>
            </TasksProvider>
          </BoardsProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  </React.StrictMode>
);

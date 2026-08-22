import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { ThemeProvider } from "./context/ThemeContext";
import { TasksProvider } from "./context/TasksContext";
import { ToastProvider } from "./context/ToastContext";
import "./App.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThemeProvider>
      <ToastProvider>
        <TasksProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </TasksProvider>
      </ToastProvider>
    </ThemeProvider>
  </React.StrictMode>
);
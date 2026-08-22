// App.jsx
import { useState } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import TopBar from "./components/TopBar";
import CommandPalette from "./components/CommandPalette";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import BoardsListPage from "./pages/BoardsListPage";
import BoardPage from "./pages/BoardPage";
import TaskDetailPage from "./pages/TaskDetailPage";
import DashboardPage from "./pages/DashboardPage";
import MyTasksPage from "./pages/MyTasksPage";
import TeamPage from "./pages/TeamPage";
import SettingsPage from "./pages/SettingsPage";
import NotFoundPage from "./pages/NotFoundPage";

const AUTH_ROUTES = ["/login", "/signup"];

function App() {
  const location = useLocation();
  const isAuthPage = AUTH_ROUTES.includes(location.pathname);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Login/Signup render full-screen with their own design, no app shell.
  if (isAuthPage) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
      </Routes>
    );
  }

  return (
    <div className="app">
      <Sidebar />
      <div className="app__content">
        <TopBar onOpenSearch={() => setIsSearchOpen(true)} />
        <div className="main">
          <Routes>
            <Route path="/" element={<BoardsListPage />} />
            <Route path="/boards/:boardId" element={<BoardPage />} />
            <Route path="/tasks/:id" element={<TaskDetailPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/my-tasks" element={<MyTasksPage />} />
            <Route path="/team" element={<TeamPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </div>
      </div>
      <CommandPalette isOpen={isSearchOpen} onOpenChange={setIsSearchOpen} />
    </div>
  );
}

export default App;
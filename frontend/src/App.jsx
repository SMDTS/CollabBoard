// App.jsx
import { useState } from "react";
import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import TopBar from "./components/TopBar";
import CommandPalette from "./components/CommandPalette";
import { TaskConflictBanner } from "./components/TaskConflictBanner";
import { useAuth } from "./context/AuthContext";
import { TasksProvider } from "./context/TasksContext";
import { BoardsProvider } from "./context/BoardsContext";
import { SocketProvider } from "./context/SocketContext";
import { UsersProvider } from "./context/UsersContext";
import { InvitationsProvider } from "./context/InvitationsContext";
import { NotificationsProvider } from "./context/NotificationsContext";
import AuthPage from "./pages/AuthPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import BoardsListPage from "./pages/BoardsListPage";
import BoardPage from "./pages/BoardPage";
import TaskDetailPage from "./pages/TaskDetailPage";
import DashboardPage from "./pages/DashboardPage";
import MyTasksPage from "./pages/MyTasksPage";
import TeamPage from "./pages/TeamPage";
import SettingsPage from "./pages/SettingsPage";
import NotFoundPage from "./pages/NotFoundPage";

const AUTH_ROUTES = ["/login", "/signup", "/forgot-password", "/reset-password"];

function App() {
  const location = useLocation();
  const isAuthPage = AUTH_ROUTES.includes(location.pathname);
  const isDashboard = location.pathname === "/dashboard";
  const { isAuthenticated, isLoading } = useAuth();
  const [isSearchOpen, setIsSearchOpen] = useState(false);


  if (isAuthPage) {
    return (
      <Routes>
        <Route path="/login" element={<AuthPage />} />
        <Route path="/signup" element={<AuthPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
      </Routes>
    );
  }


  if (isLoading) {
    return <div className="app-loading">Loading…</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <BoardsProvider>
      <SocketProvider>
      <InvitationsProvider>
      <NotificationsProvider>
      <TasksProvider>
        <UsersProvider>
          <div className="app">
            <Sidebar />
            <div className="app__content">
              <TopBar onOpenSearch={() => setIsSearchOpen(true)} />
              <div className={`main ${isDashboard ? "main--dark" : ""}`}>
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
            <TaskConflictBanner />
          </div>
        </UsersProvider>
      </TasksProvider>
      </NotificationsProvider>
      </InvitationsProvider>
      </SocketProvider>
    </BoardsProvider>
  );
}

export default App;
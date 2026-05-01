import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { GameProvider } from "@/lib/game-context";
import { AuthProvider } from "@/hooks/useAuth";
import { I18nProvider } from "@/i18n";
import Index from "./pages/Index";
import LoginPage from "./pages/Login";
import RegisterPage from "./pages/Register";
import DashboardPage from "./pages/Dashboard";
import ProfilePage from "./pages/Profile";
import TournamentsPage from "./pages/Tournaments";
import TeamsPage from "./pages/Teams";
import LeaderboardPage from "./pages/Leaderboard";
import PlayPage from "./pages/Play";
import ScrimsPage from "./pages/Scrims";
import TournamentDetailPage from "./pages/TournamentDetail";
import TeamDetailPage from "./pages/TeamDetail";
import AdminPage from "./pages/Admin";
import AdminSecurityPage from "./pages/admin/Security";
import AimGuidePage from "./pages/AimGuide";
import NotificationsPage from "./pages/Notifications";
import SettingsPage from "./pages/Settings";
import ChatWidget from "./components/chat/ChatWidget";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";
import RoleGuard from "./components/RoleGuard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <AuthProvider>
          <I18nProvider>
          <GameProvider>
            <Toaster />
            <Sonner />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
              <Route path="/profile/:username" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
              <Route path="/tournaments" element={<ProtectedRoute><TournamentsPage /></ProtectedRoute>} />
              <Route path="/teams" element={<TeamsPage />} />
              <Route path="/leaderboard" element={<ProtectedRoute><LeaderboardPage /></ProtectedRoute>} />
              <Route path="/play" element={<PlayPage />} />
              <Route path="/scrims" element={<ScrimsPage />} />
              <Route path="/tournaments/:id" element={<TournamentDetailPage />} />
              <Route path="/teams/:teamId" element={<TeamDetailPage />} />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute>
                    <RoleGuard allow={["admin"]}>
                      <AdminPage />
                    </RoleGuard>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/security"
                element={
                  <ProtectedRoute>
                    <RoleGuard allow={["admin", "moderator"]}>
                      <AdminSecurityPage />
                    </RoleGuard>
                  </ProtectedRoute>
                }
              />
              <Route path="/aim-guide" element={<AimGuidePage />} />
              <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            <ChatWidget />
          </GameProvider>
          </I18nProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

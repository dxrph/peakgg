import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
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
import AdminSecurityPage from "./pages/admin/Security";
import AdminDashboard from "./pages/admin/sections/AdminDashboard";
import AdminTournaments from "./pages/admin/sections/AdminTournaments";
import AdminMatches from "./pages/admin/sections/AdminMatches";
import AdminTickets from "./pages/admin/sections/AdminTickets";
import AdminPlayers from "./pages/admin/sections/AdminPlayers";
import AdminTeams from "./pages/admin/sections/AdminTeams";
import AdminCommunication from "./pages/admin/sections/AdminCommunication";
import AdminAnalytics from "./pages/admin/sections/AdminAnalytics";
import AdminReputation from "./pages/admin/sections/AdminReputation";
import AimGuidePage from "./pages/AimGuide";
import NotificationsPage from "./pages/Notifications";
import SettingsPage from "./pages/Settings";
import EloExplainedPage from "./pages/EloExplained";
import AboutPage from "./pages/About";
import FAQPage from "./pages/FAQ";
import ContactPage from "./pages/Contact";
import PrivacyPage from "./pages/Privacy";
import TermsPage from "./pages/Terms";
import ChatWidget from "./components/chat/ChatWidget";
import Analytics from "./components/Analytics";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";
import PublicOnlyRoute from "./components/PublicOnlyRoute";
import RoleGuard from "./components/RoleGuard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
   <HelmetProvider>
    <TooltipProvider>
      <BrowserRouter>
        <AuthProvider>
          <I18nProvider>
          <GameProvider>
            <Toaster />
            <Sonner />
            <Analytics />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
              <Route path="/register" element={<PublicOnlyRoute><RegisterPage /></PublicOnlyRoute>} />
              <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
              <Route path="/profile/:username" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
              <Route path="/tournaments" element={<ProtectedRoute><TournamentsPage /></ProtectedRoute>} />
              <Route path="/teams" element={<ProtectedRoute><TeamsPage /></ProtectedRoute>} />
              <Route path="/leaderboard" element={<ProtectedRoute><LeaderboardPage /></ProtectedRoute>} />
              <Route path="/play" element={<ProtectedRoute><PlayPage /></ProtectedRoute>} />
              <Route path="/scrims" element={<ProtectedRoute><ScrimsPage /></ProtectedRoute>} />
              <Route path="/tournaments/:id" element={<ProtectedRoute><TournamentDetailPage /></ProtectedRoute>} />
              <Route path="/teams/:teamId" element={<ProtectedRoute><TeamDetailPage /></ProtectedRoute>} />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute>
                    <RoleGuard allow={["admin", "moderator", "organizer"]}>
                      <AdminDashboard />
                    </RoleGuard>
                  </ProtectedRoute>
                }
              />
              <Route path="/admin/tournaments" element={<ProtectedRoute><RoleGuard allow={["admin", "organizer"]}><AdminTournaments /></RoleGuard></ProtectedRoute>} />
              <Route path="/admin/matches" element={<ProtectedRoute><RoleGuard allow={["admin", "organizer"]}><AdminMatches /></RoleGuard></ProtectedRoute>} />
              <Route path="/admin/tickets" element={<ProtectedRoute><RoleGuard allow={["admin", "moderator"]}><AdminTickets /></RoleGuard></ProtectedRoute>} />
              <Route path="/admin/players" element={<ProtectedRoute><RoleGuard allow={["admin", "moderator"]}><AdminPlayers /></RoleGuard></ProtectedRoute>} />
              <Route path="/admin/teams" element={<ProtectedRoute><RoleGuard allow={["admin", "moderator"]}><AdminTeams /></RoleGuard></ProtectedRoute>} />
              <Route path="/admin/communication" element={<ProtectedRoute><RoleGuard allow={["admin", "moderator"]}><AdminCommunication /></RoleGuard></ProtectedRoute>} />
              <Route path="/admin/analytics" element={<ProtectedRoute><RoleGuard allow={["admin", "organizer"]}><AdminAnalytics /></RoleGuard></ProtectedRoute>} />
              <Route path="/admin/reputation" element={<ProtectedRoute><RoleGuard allow={["admin", "moderator"]}><AdminReputation /></RoleGuard></ProtectedRoute>} />
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
              <Route path="/elo" element={<EloExplainedPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/faq" element={<FAQPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/terms" element={<TermsPage />} />
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
   </HelmetProvider>
  </QueryClientProvider>
);

export default App;

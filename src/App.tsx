import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { GameProvider } from "@/lib/game-context";
import { AuthProvider } from "@/hooks/useAuth";
import { I18nProvider } from "@/i18n";
const Index = lazy(() => import("./pages/Index"));
const LoginPage = lazy(() => import("./pages/Login"));
const RegisterPage = lazy(() => import("./pages/Register"));
const DashboardPage = lazy(() => import("./pages/Dashboard"));
const ProfilePage = lazy(() => import("./pages/Profile"));
const TournamentsPage = lazy(() => import("./pages/Tournaments"));
const TeamsPage = lazy(() => import("./pages/Teams"));
const LeaderboardPage = lazy(() => import("./pages/Leaderboard"));
const PlayPage = lazy(() => import("./pages/Play"));
const ScrimsPage = lazy(() => import("./pages/Scrims"));
const TournamentDetailPage = lazy(() => import("./pages/TournamentDetail"));
const TeamDetailPage = lazy(() => import("./pages/TeamDetail"));
const AdminSecurityPage = lazy(() => import("./pages/admin/Security"));
const AdminDashboard = lazy(() => import("./pages/admin/sections/AdminDashboard"));
const AdminTournaments = lazy(() => import("./pages/admin/sections/AdminTournaments"));
const AdminCommunityCup = lazy(() => import("./pages/admin/sections/AdminCommunityCup"));
const CommunityCupMatchRoom = lazy(() => import("./pages/CommunityCupMatchRoom"));
const AdminMatches = lazy(() => import("./pages/admin/sections/AdminMatches"));
const AdminTickets = lazy(() => import("./pages/admin/sections/AdminTickets"));
const AdminPlayers = lazy(() => import("./pages/admin/sections/AdminPlayers"));
const AdminReputation = lazy(() => import("./pages/admin/sections/AdminReputation"));
const AdminDisputes = lazy(() => import("./pages/admin/sections/AdminDisputes"));
const AdminScrims = lazy(() => import("./pages/admin/sections/AdminScrims"));
const AdminChat = lazy(() => import("./pages/admin/sections/AdminChat"));
const AdminEconomy = lazy(() => import("./pages/admin/sections/AdminEconomy"));
const AdminAnnouncements = lazy(() => import("./pages/admin/sections/AdminAnnouncements"));
const AdminSeasons = lazy(() => import("./pages/admin/sections/AdminSeasons"));
const AdminElo = lazy(() => import("./pages/admin/sections/AdminElo"));
const AdminLeagues = lazy(() => import("./pages/admin/sections/AdminLeagues"));
const PeakLeagueAdmin = lazy(() => import("./pages/admin/PeakLeagueAdmin"));
const LeaguesPage = lazy(() => import("./pages/Leagues"));
const LeagueDetailPage = lazy(() => import("./pages/LeagueDetail"));
const MatchDetailPage = lazy(() => import("./pages/MatchDetail"));
const TeamDashboardPage = lazy(() => import("./pages/TeamDashboard"));
const AimGuidePage = lazy(() => import("./pages/AimGuide"));
const FreeAgentsPage = lazy(() => import("./pages/FreeAgents"));
const FreeAgentsCompletePage = lazy(() => import("./pages/FreeAgentsComplete"));
const NotificationsPage = lazy(() => import("./pages/Notifications"));
const SettingsPage = lazy(() => import("./pages/Settings"));
const EloExplainedPage = lazy(() => import("./pages/EloExplained"));
const AboutPage = lazy(() => import("./pages/About"));
const FAQPage = lazy(() => import("./pages/FAQ"));
const ContactPage = lazy(() => import("./pages/Contact"));
const PrivacyPage = lazy(() => import("./pages/Privacy"));
const TermsPage = lazy(() => import("./pages/Terms"));
const ComingSoonPage = lazy(() => import("./pages/ComingSoon"));
import ChatWidget from "./components/chat/ChatWidget";
import GlobalActiveBar from "./components/competitive/GlobalActiveBar";
import Analytics from "./components/Analytics";
import CookieBanner from "./components/CookieBanner";
const NotFound = lazy(() => import("./pages/NotFound"));
import ScrollToTop from "./components/ScrollToTop";
import ProtectedRoute from "./components/ProtectedRoute";
import PublicOnlyRoute from "./components/PublicOnlyRoute";
import RoleGuard from "./components/RoleGuard";
import PeakCommandPalette from "./components/navigation/PeakCommandPalette";
import MobileDock from "./components/navigation/MobileDock";
const BroadcastMatchPage = lazy(() => import("./pages/BroadcastMatch"));

const queryClient = new QueryClient();

function AppOverlays() {
  const { pathname } = useLocation();
  if (pathname.startsWith("/broadcast/")) return null;
  return (
    <>
      <GlobalActiveBar />
      <PeakCommandPalette />
      <MobileDock />
      <ChatWidget />
      <CookieBanner />
    </>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
   <HelmetProvider>
    <TooltipProvider>
      <BrowserRouter>
        <ScrollToTop />
        <AuthProvider>
          <I18nProvider>
          <GameProvider>
            <Toaster />
            <Sonner />
            <Analytics />
            <Suspense fallback={<div className="min-h-screen bg-background" />}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
              <Route path="/register" element={<PublicOnlyRoute><RegisterPage /></PublicOnlyRoute>} />
              <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
              <Route path="/profile/:username" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
              <Route path="/tournaments" element={<ProtectedRoute><TournamentsPage /></ProtectedRoute>} />
              <Route path="/teams" element={<ProtectedRoute><TeamsPage /></ProtectedRoute>} />
              <Route path="/leaderboard" element={<ProtectedRoute><LeaderboardPage /></ProtectedRoute>} />
              {/* Unified competitive path: /play redirects to the Tournaments hub */}
              <Route path="/play" element={<Navigate to="/tournaments" replace />} />
              <Route path="/play/legacy" element={<ProtectedRoute><PlayPage /></ProtectedRoute>} />
              <Route path="/scrims" element={<ProtectedRoute><ScrimsPage /></ProtectedRoute>} />
              <Route path="/tournaments/:id" element={<ProtectedRoute><TournamentDetailPage /></ProtectedRoute>} />
              <Route path="/tournaments/:slug/matches/:matchId" element={<ProtectedRoute><CommunityCupMatchRoom /></ProtectedRoute>} />
              <Route path="/teams/:teamId" element={<ProtectedRoute><TeamDetailPage /></ProtectedRoute>} />
              <Route path="/teams/:teamId/manage" element={<ProtectedRoute><TeamDashboardPage /></ProtectedRoute>} />
              <Route path="/teams/:teamId/dashboard" element={<ProtectedRoute><TeamDashboardPage /></ProtectedRoute>} />
              <Route path="/team-dashboard" element={<ProtectedRoute><TeamDashboardPage /></ProtectedRoute>} />
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
              <Route path="/admin/community-cup" element={<ProtectedRoute><RoleGuard allow={["admin", "moderator", "organizer"]}><AdminCommunityCup /></RoleGuard></ProtectedRoute>} />
              <Route path="/admin/matches" element={<ProtectedRoute><RoleGuard allow={["admin", "organizer"]}><AdminMatches /></RoleGuard></ProtectedRoute>} />
              <Route path="/admin/tickets" element={<ProtectedRoute><RoleGuard allow={["admin", "moderator"]}><AdminTickets /></RoleGuard></ProtectedRoute>} />
              <Route path="/admin/disputes" element={<ProtectedRoute><RoleGuard allow={["admin", "moderator"]}><AdminDisputes /></RoleGuard></ProtectedRoute>} />
              <Route path="/admin/scrims" element={<ProtectedRoute><RoleGuard allow={["admin", "moderator"]}><AdminScrims /></RoleGuard></ProtectedRoute>} />
              <Route path="/admin/chat" element={<ProtectedRoute><RoleGuard allow={["admin", "moderator"]}><AdminChat /></RoleGuard></ProtectedRoute>} />
              <Route path="/admin/players" element={<ProtectedRoute><RoleGuard allow={["admin", "moderator"]}><AdminPlayers /></RoleGuard></ProtectedRoute>} />
              <Route path="/admin/reputation" element={<ProtectedRoute><RoleGuard allow={["admin", "moderator"]}><AdminReputation /></RoleGuard></ProtectedRoute>} />
              <Route path="/admin/economy" element={<ProtectedRoute><RoleGuard allow={["admin"]}><AdminEconomy /></RoleGuard></ProtectedRoute>} />
              <Route path="/admin/announcements" element={<ProtectedRoute><RoleGuard allow={["admin", "moderator"]}><AdminAnnouncements /></RoleGuard></ProtectedRoute>} />
              <Route path="/admin/seasons" element={<ProtectedRoute><RoleGuard allow={["admin"]}><AdminSeasons /></RoleGuard></ProtectedRoute>} />
              <Route path="/admin/elo" element={<ProtectedRoute><RoleGuard allow={["admin"]}><AdminElo /></RoleGuard></ProtectedRoute>} />
              <Route path="/admin/leagues" element={<ProtectedRoute><RoleGuard allow={["admin"]}><AdminLeagues /></RoleGuard></ProtectedRoute>} />
              <Route path="/leagues" element={<LeaguesPage />} />
              <Route path="/leagues/:leagueId" element={<LeagueDetailPage />} />
              {/* Hard guard: never let /matches/undefined or /matches/null render */}
              <Route path="/matches/undefined" element={<Navigate to="/dashboard" replace />} />
              <Route path="/matches/null" element={<Navigate to="/dashboard" replace />} />
              <Route path="/matches/:matchId" element={<ProtectedRoute><MatchDetailPage /></ProtectedRoute>} />
              <Route path="/broadcast/matches/:matchId" element={<BroadcastMatchPage />} />
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
              <Route path="/free-agents" element={<ProtectedRoute><FreeAgentsPage /></ProtectedRoute>} />
              <Route path="/free-agents/complete-profile" element={<ProtectedRoute><FreeAgentsCompletePage /></ProtectedRoute>} />
              <Route path="/elo" element={<EloExplainedPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/faq" element={<FAQPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/coming-soon" element={<ComingSoonPage />} />
              <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            </Suspense>
            <AppOverlays />
          </GameProvider>
          </I18nProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
   </HelmetProvider>
  </QueryClientProvider>
);

export default App;


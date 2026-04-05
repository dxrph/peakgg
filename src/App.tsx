import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { GameProvider } from "@/lib/game-context";
import { AuthProvider } from "@/hooks/useAuth";
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
import AimGuidePage from "./pages/AimGuide";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <AuthProvider>
          <GameProvider>
            <Toaster />
            <Sonner />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/profile/:username" element={<ProfilePage />} />
              <Route path="/tournaments" element={<TournamentsPage />} />
              <Route path="/teams" element={<TeamsPage />} />
              <Route path="/leaderboard" element={<LeaderboardPage />} />
              <Route path="/play" element={<PlayPage />} />
              <Route path="/scrims" element={<ScrimsPage />} />
              <Route path="/tournaments/:id" element={<TournamentDetailPage />} />
              <Route path="/teams/:teamId" element={<TeamDetailPage />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </GameProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

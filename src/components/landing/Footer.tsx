import { Link } from "react-router-dom";
import { Mountain } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-border bg-card/30 py-12">
      <div className="container">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded gradient-primary flex items-center justify-center">
                <Mountain className="h-3 w-3 text-primary-foreground" />
              </div>
              <span className="font-display font-bold text-lg text-primary">PEAKGG</span>
            </div>
            <p className="text-sm text-muted-foreground font-body leading-relaxed">
              The ultimate multi-game competitive platform for VALORANT, CS2, and Rainbow Six Siege.
            </p>
          </div>
          <div>
            <h4 className="font-display font-bold mb-4 uppercase tracking-wider text-sm">Platform</h4>
            <ul className="space-y-2 text-sm text-muted-foreground font-body">
              <li><Link to="/play" className="hover:text-primary transition-colors">Matchmaking</Link></li>
              <li><Link to="/tournaments" className="hover:text-primary transition-colors">Tournaments</Link></li>
              <li><Link to="/leaderboard" className="hover:text-primary transition-colors">Leaderboard</Link></li>
              <li><Link to="/teams" className="hover:text-primary transition-colors">Teams</Link></li>
              <li><Link to="/scrims" className="hover:text-primary transition-colors">Scrims</Link></li>
              <li><Link to="/elo" className="hover:text-primary transition-colors">How ELO works</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-display font-bold mb-4 uppercase tracking-wider text-sm">Support</h4>
            <ul className="space-y-2 text-sm text-muted-foreground font-body">
              <li><Link to="/support" className="hover:text-primary transition-colors">Help Center</Link></li>
              <li><a href="https://discord.gg" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">Discord</a></li>
              <li><Link to="/report" className="hover:text-primary transition-colors">Report</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-display font-bold mb-4 uppercase tracking-wider text-sm">Legal</h4>
            <ul className="space-y-2 text-sm text-muted-foreground font-body">
              <li><Link to="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-primary transition-colors">Terms of Service</Link></li>
              <li><Link to="/cookies" className="hover:text-primary transition-colors">Cookie Policy</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-border pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-muted-foreground font-body">© 2026 PeakGG. All rights reserved.</p>
          <p className="text-xs text-muted-foreground font-body">Not affiliated with Riot Games, Valve, or Ubisoft.</p>
        </div>
      </div>
    </footer>
  );
}

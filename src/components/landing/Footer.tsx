import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="border-t border-border bg-card/50 py-12">
      <div className="container">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h4 className="font-display font-bold text-lg mb-4 text-primary">ARENA</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              La piattaforma competitiva per VALORANT in Europa.
            </p>
          </div>
          <div>
            <h4 className="font-display font-bold mb-4">Piattaforma</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/matchmaking" className="hover:text-primary transition-colors">Matchmaking</Link></li>
              <li><Link to="/tournaments" className="hover:text-primary transition-colors">Tornei</Link></li>
              <li><Link to="/leaderboard" className="hover:text-primary transition-colors">Classifica</Link></li>
              <li><Link to="/teams" className="hover:text-primary transition-colors">Team</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-display font-bold mb-4">Supporto</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/support" className="hover:text-primary transition-colors">Centro assistenza</Link></li>
              <li><Link to="/report" className="hover:text-primary transition-colors">Segnala</Link></li>
              <li><Link to="/faq" className="hover:text-primary transition-colors">FAQ</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-display font-bold mb-4">Legale</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-primary transition-colors">Termini di Servizio</Link></li>
              <li><Link to="/cookies" className="hover:text-primary transition-colors">Cookie Policy</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-border pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-muted-foreground">© 2026 Arena. Tutti i diritti riservati.</p>
          <p className="text-xs text-muted-foreground">Non affiliato con Riot Games.</p>
        </div>
      </div>
    </footer>
  );
}

import { Link } from "react-router-dom";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Trophy, Users, Calendar, Search, Filter } from "lucide-react";

const tournaments = [
  { id: 1, name: "RiftArena Weekly #12", format: "5v5", date: "Mar 8, 2026", prize: "€500", slots: "12/16", status: "Open" },
  { id: 2, name: "EU Masters Qualifier", format: "5v5", date: "Mar 15, 2026", prize: "€2,000", slots: "28/32", status: "Open" },
  { id: 3, name: "1v1 Aim Challenge", format: "1v1", date: "Mar 10, 2026", prize: "€100", slots: "48/64", status: "Open" },
  { id: 4, name: "RiftArena Monthly #3", format: "5v5", date: "Mar 22, 2026", prize: "€1,500", slots: "16/16", status: "Full" },
  { id: 5, name: "Community Cup", format: "5v5", date: "Mar 5, 2026", prize: "€250", slots: "8/8", status: "Live" },
  { id: 6, name: "Newcomers Tournament", format: "5v5", date: "Mar 12, 2026", prize: "€200", slots: "6/16", status: "Open" },
];

export default function TournamentsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <div className="container pt-24 pb-16">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-display font-bold"><Trophy className="inline h-8 w-8 text-primary mr-2" />Tournaments</h1>
            <p className="text-muted-foreground font-body mt-1">Compete in daily, weekly, and monthly events.</p>
          </div>
          <div className="flex gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search tournaments..." className="pl-10 w-64 bg-card border-border" />
            </div>
            <Button variant="outline" size="icon"><Filter className="h-4 w-4" /></Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {tournaments.map((t) => (
            <div key={t.id} className="rounded-lg border border-border bg-card p-5 neon-border hover:border-primary/30 transition-all group">
              <div className="flex justify-between items-start mb-3">
                <Badge variant={t.status === "Live" ? "default" : t.status === "Full" ? "secondary" : "outline"}
                  className={`font-display text-xs ${t.status === "Live" ? "gradient-primary border-0" : ""}`}>
                  {t.status === "Live" && <span className="w-1.5 h-1.5 rounded-full bg-primary-foreground mr-1 animate-pulse" />}
                  {t.status}
                </Badge>
                <span className="text-xs text-muted-foreground font-body">{t.format}</span>
              </div>
              <h3 className="text-lg font-display font-bold mb-2 group-hover:text-primary transition-colors">{t.name}</h3>
              <div className="space-y-1.5 text-sm text-muted-foreground font-body">
                <div className="flex items-center gap-2"><Calendar className="h-3.5 w-3.5" />{t.date}</div>
                <div className="flex items-center gap-2"><Users className="h-3.5 w-3.5" />{t.slots} teams</div>
                <div className="flex items-center gap-2"><Trophy className="h-3.5 w-3.5 text-accent" /><span className="text-accent font-semibold">{t.prize}</span></div>
              </div>
              <Link to={`/tournaments/${t.id}`}><Button variant="neonOutline" size="sm" className="w-full mt-4">View Details</Button></Link>
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
}

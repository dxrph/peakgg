import { Link } from "react-router-dom";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Filter, Users, Globe, Shield } from "lucide-react";

const teams = [
  { id: 1, name: "Rift Kings", tag: "RK", elo: 2650, region: "EU-W", members: 5, recruiting: true },
  { id: 2, name: "Void Reapers", tag: "VR", elo: 2580, region: "EU-W", members: 5, recruiting: false },
  { id: 3, name: "Storm Elite", tag: "SE", elo: 2490, region: "EU-E", members: 4, recruiting: true },
  { id: 4, name: "Shadow Corp", tag: "SC", elo: 2420, region: "EU-N", members: 5, recruiting: true },
  { id: 5, name: "Ice Protocol", tag: "IP", elo: 2380, region: "EU-N", members: 3, recruiting: true },
  { id: 6, name: "Phoenix Rise", tag: "PR", elo: 2340, region: "EU-W", members: 5, recruiting: false },
];

export default function TeamsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <div className="container pt-24 pb-16">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-display font-bold"><Users className="inline h-8 w-8 text-primary mr-2" />Teams</h1>
            <p className="text-muted-foreground font-body mt-1">Browse teams or create your own.</p>
          </div>
          <div className="flex gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search teams..." className="pl-10 w-64 bg-card border-border" />
            </div>
            <Button variant="neon" size="sm">Create Team</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {teams.map((t) => (
            <div key={t.id} className="rounded-lg border border-border bg-card p-5 neon-border hover:border-primary/30 transition-all group">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-lg gradient-primary flex items-center justify-center font-display font-bold text-primary-foreground text-sm">
                  {t.tag}
                </div>
                <div>
                  <h3 className="font-display font-bold text-lg group-hover:text-primary transition-colors">{t.name}</h3>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Globe className="h-3 w-3" />{t.region}
                    <span className="mx-1">·</span>
                    <Shield className="h-3 w-3" />ELO {t.elo}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm text-muted-foreground font-body">
                <span>{t.members}/5 members</span>
                {t.recruiting ? (
                  <Badge variant="outline" className="border-success text-success text-xs font-display">Recruiting</Badge>
                ) : (
                  <Badge variant="secondary" className="text-xs font-display">Full</Badge>
                )}
              </div>
              <Link to={`/teams/${t.id}`}><Button variant="neonOutline" size="sm" className="w-full mt-4">View Team</Button></Link>
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
}

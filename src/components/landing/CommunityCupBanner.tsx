import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trophy, ArrowRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export default function CommunityCupBanner() {
  const { data: t } = useQuery({
    queryKey: ["community-cup-1-banner"],
    queryFn: async () => {
      const { data } = await supabase
        .from("tournaments")
        .select("id, slug, name, status, short_description")
        .eq("slug", "community-cup-1")
        .maybeSingle();
      return data;
    },
  });

  if (!t || ["completed", "collecting_interest"].includes(t.status)) return null;

  const statusLabel: Record<string, string> = {
    registration_open: "Registration Open",
    registration_closed: "Registrations Closed",
    checkin: "Check-in Open",
    checkin_open: "Check-in Open",
    live: "Live Now",
  };

  return (
    <section className="container py-6">
      <div className="relative overflow-hidden rounded-2xl border border-primary/40 bg-card neon-border p-5 md:p-6 flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6">
        <div
          className="absolute -top-20 -right-20 w-[280px] h-[280px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, hsl(var(--primary) / 0.18), transparent 60%)" }}
        />
        <div className="relative flex items-center gap-3 shrink-0">
          <div className="h-12 w-12 rounded-lg bg-primary/10 border border-primary/40 flex items-center justify-center">
            <Trophy className="h-6 w-6 text-primary" />
          </div>
        </div>
        <div className="relative flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <Badge variant="outline" className="border-primary text-primary font-display uppercase text-[10px]">
              {statusLabel[t.status] ?? t.status}
            </Badge>
            <Badge variant="secondary" className="font-display text-[10px] uppercase">VALORANT · EU · Free</Badge>
          </div>
          <h2 className="text-xl md:text-2xl font-display font-bold leading-tight">
            {t.name} is open
          </h2>
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
            {t.short_description ?? "Free EU VALORANT tournament for community 5-stacks."}
          </p>
        </div>
        <Link to={`/tournaments/${t.slug ?? t.id}`} className="relative shrink-0">
          <Button variant="neon" className="uppercase tracking-wider">
            View Tournament<ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </Link>
      </div>
    </section>
  );
}
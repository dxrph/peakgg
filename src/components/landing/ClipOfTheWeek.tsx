import { motion } from "framer-motion";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import RankBadge from "@/components/RankBadge";
import { Play, Flame } from "lucide-react";

const NOMINEES = [
  { title: "1v4 clutch on Ascent",  player: "PhantomX",   votes: 184 },
  { title: "Insane AWP triple",     player: "NightShade", votes: 142 },
  { title: "Trickshot through smoke", player: "AceViper", votes: 97 },
];

export default function ClipOfTheWeek() {
  return (
    <section className="py-24 relative overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 700px 500px at 80% 30%, hsl(var(--primary) / 0.10), transparent 60%)",
        }}
      />
      <div className="container relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-display font-bold tracking-tight">
            CLIP OF THE <span className="text-accent text-glow-orange">WEEK</span> 🎬
          </h2>
          <p className="mt-3 text-muted-foreground font-body">The community's pick. Watch, vote, get featured.</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-8 items-stretch max-w-6xl mx-auto">
          {/* Video placeholder */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative aspect-video rounded-xl border border-border bg-[#0a0a0a] overflow-hidden flex items-center justify-center group cursor-pointer"
          >
            <div
              className="absolute inset-0 opacity-[0.06]"
              style={{
                backgroundImage:
                  "linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)",
                backgroundSize: "40px 40px",
              }}
            />
            <div className="relative w-20 h-20 rounded-full bg-primary/10 border border-primary/40 flex items-center justify-center group-hover:scale-110 group-hover:bg-primary/20 transition-all duration-300 shadow-[0_0_30px_hsl(var(--primary)/0.4)]">
              <Play className="h-8 w-8 text-primary fill-primary ml-1" />
            </div>
            <span className="absolute bottom-4 left-4 text-xs uppercase tracking-widest text-muted-foreground font-display">
              This week's clip coming soon
            </span>
          </motion.div>

          {/* Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="flex flex-col justify-between rounded-xl border border-border bg-card p-6"
          >
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Avatar className="h-10 w-10 border border-border">
                  <AvatarFallback className="text-xs bg-secondary">PH</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="font-display font-bold text-foreground">PhantomX</div>
                  <div className="flex items-center gap-2">
                    <RankBadge elo={2540} size="sm" />
                    <span className="text-xs text-muted-foreground">VALORANT</span>
                  </div>
                </div>
              </div>
              <h3 className="text-xl font-display font-bold mb-2">1v4 clutch on Ascent</h3>
              <p className="text-sm text-muted-foreground font-body mb-4">
                184 votes · Featured in Season 1, Week 12
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button variant="neon" className="flex-1 rounded-md">
                <Play className="mr-2 h-4 w-4" /> Watch Clip
              </Button>
              <Button variant="neonOutline" className="flex-1 rounded-md">
                <Flame className="mr-2 h-4 w-4" /> Vote next week
              </Button>
            </div>
          </motion.div>
        </div>

        {/* Nominees */}
        <div className="max-w-6xl mx-auto mt-8">
          <h4 className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-display mb-4">
            Nominated this week
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {NOMINEES.map((n, i) => (
              <motion.div
                key={n.title}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="rounded-lg border border-border bg-[#0a0a0a] overflow-hidden hover:border-primary/40 transition-colors cursor-pointer group"
              >
                <div className="aspect-video bg-secondary/30 flex items-center justify-center">
                  <Play className="h-7 w-7 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <div className="p-3">
                  <div className="text-sm font-semibold truncate">{n.title}</div>
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>{n.player}</span>
                    <span className="font-mono">{n.votes} votes</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
import { Download, Share2, Sparkles, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

function escapeXml(value: string) {
  return value.replace(/[<>&'\"]/g, (char) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", "\"": "&quot;" })[char] ?? char);
}

export default function PeakMomentCard({
  sideA,
  sideB,
  scoreA,
  scoreB,
  game,
  map,
}: {
  sideA: string;
  sideB: string;
  scoreA: number;
  scoreB: number;
  game: string;
  map?: string | null;
}) {
  const winner = scoreA === scoreB ? "DRAW" : scoreA > scoreB ? sideA : sideB;
  const shareText = `${sideA} ${scoreA} — ${scoreB} ${sideB}. ${winner} raggiunge il Peak su ${game.toUpperCase()}.`;

  const share = async () => {
    try {
      if (navigator.share) await navigator.share({ title: "Peak Moment — PeakGG", text: shareText, url: window.location.href });
      else {
        await navigator.clipboard?.writeText(`${shareText}\n${window.location.href}`);
        toast.success("Peak Moment copiato.");
      }
    } catch (error) {
      if ((error as DOMException)?.name !== "AbortError") toast.error("Condivisione non disponibile.");
    }
  };

  const download = () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
      <defs><linearGradient id="bg" x1="0" x2="1" y1="0" y2="1"><stop stop-color="#09090b"/><stop offset="1" stop-color="#21100c"/></linearGradient><pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse"><path d="M48 0H0V48" fill="none" stroke="#ff5b35" stroke-opacity=".12"/></pattern></defs>
      <rect width="1200" height="630" fill="url(#bg)"/><rect width="1200" height="630" fill="url(#grid)"/><path d="M760 0H1200V630H580Z" fill="#ff5b35" opacity=".12"/>
      <text x="72" y="82" fill="#ff5b35" font-family="Arial" font-size="22" font-weight="700" letter-spacing="7">PEAKGG // PEAK MOMENT</text>
      <text x="72" y="150" fill="#ffffff" font-family="Arial" font-size="26" font-weight="700">${escapeXml(game.toUpperCase())}${map ? ` · ${escapeXml(map.toUpperCase())}` : ""}</text>
      <text x="72" y="280" fill="#ffffff" font-family="Arial" font-size="52" font-weight="900">${escapeXml(sideA.toUpperCase())}</text>
      <text x="1128" y="280" fill="#ffffff" text-anchor="end" font-family="Arial" font-size="52" font-weight="900">${escapeXml(sideB.toUpperCase())}</text>
      <text x="600" y="390" fill="#ffffff" text-anchor="middle" font-family="Arial" font-size="150" font-weight="900">${scoreA} : ${scoreB}</text>
      <text x="600" y="500" fill="#ff5b35" text-anchor="middle" font-family="Arial" font-size="32" font-weight="800" letter-spacing="4">${escapeXml(winner.toUpperCase())} REACHED THE PEAK</text>
      <text x="72" y="575" fill="#ffffff" opacity=".5" font-family="Arial" font-size="18" letter-spacing="4">THE CLIMB IS THE GAME</text>
    </svg>`;
    const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `peak-moment-${sideA.toLowerCase().replace(/\W+/g, "-")}-${sideB.toLowerCase().replace(/\W+/g, "-")}.svg`;
    anchor.click();
    URL.revokeObjectURL(url);
    toast.success("Poster Peak Moment generato.");
  };

  return (
    <section className="peak-moment mb-6 overflow-hidden">
      <div className="peak-moment__beam" />
      <div className="relative z-[1] p-5 md:p-7 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0"><Trophy className="h-5 w-5" /></div>
          <div><div className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[.25em] text-primary font-display"><Sparkles className="h-3 w-3" />Peak Moment unlocked</div><h2 className="font-display uppercase font-bold text-2xl md:text-3xl mt-1">{winner} reached the peak.</h2><p className="text-sm text-muted-foreground mt-1">Genera il poster ufficiale della partita e condividi il risultato.</p></div>
        </div>
        <div className="flex flex-wrap gap-2"><Button variant="outline" onClick={download}><Download className="h-4 w-4 mr-2" />Scarica poster</Button><Button onClick={share} className="signal-button"><Share2 className="h-4 w-4 mr-2" />Condividi</Button></div>
      </div>
    </section>
  );
}


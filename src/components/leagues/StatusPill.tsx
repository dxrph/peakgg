import { cn } from "@/lib/utils";

const MAP: Record<string, string> = {
  draft: "bg-muted text-muted-foreground border-border",
  registration_open: "bg-success/15 text-success border-success/40",
  registration_closed: "bg-accent/15 text-accent border-accent/40",
  ongoing: "gradient-primary border-0 text-primary-foreground",
  playoffs: "bg-primary/15 text-primary border-primary/40",
  completed: "bg-secondary text-muted-foreground border-border",
  // match
  scheduled: "bg-muted text-muted-foreground border-border",
  live: "gradient-primary border-0 text-primary-foreground animate-pulse",
  awaiting_result: "bg-accent/15 text-accent border-accent/40",
  pending_confirmation: "bg-amber-500/15 text-amber-400 border-amber-500/40",
  confirmed: "bg-success/15 text-success border-success/40",
  disputed: "bg-destructive/15 text-destructive border-destructive/40",
  admin_resolved: "bg-blue-500/15 text-blue-400 border-blue-500/40",
  cancelled: "bg-secondary text-muted-foreground border-border line-through",
};

const LABEL: Record<string, string> = {
  draft: "Draft",
  registration_open: "Registration Open",
  registration_closed: "Registration Closed",
  ongoing: "Ongoing",
  playoffs: "Playoffs",
  completed: "Completed",
  scheduled: "Scheduled",
  live: "Live",
  awaiting_result: "Awaiting Result",
  pending_confirmation: "Awaiting Confirmation",
  confirmed: "Confirmed",
  disputed: "Disputed",
  admin_resolved: "Admin Resolved",
  cancelled: "Cancelled",
};

export default function StatusPill({ status, className }: { status: string; className?: string }) {
  return (
    <span className={cn(
      "inline-flex items-center px-2 py-0.5 rounded-sm text-[10px] font-display uppercase tracking-wider border",
      MAP[status] ?? "bg-muted text-muted-foreground border-border",
      className,
    )}>
      {LABEL[status] ?? status}
    </span>
  );
}

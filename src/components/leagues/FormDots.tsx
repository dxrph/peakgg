import { cn } from "@/lib/utils";

export default function FormDots({ form }: { form: string[] }) {
  if (!form?.length) return <span className="text-xs text-muted-foreground">—</span>;
  return (
    <div className="flex gap-1">
      {form.slice(-5).map((r, i) => (
        <span
          key={i}
          title={r}
          className={cn(
            "w-5 h-5 rounded-sm flex items-center justify-center text-[10px] font-display font-bold",
            r === "W" && "bg-success/20 text-success border border-success/40",
            r === "D" && "bg-muted text-muted-foreground border border-border",
            r === "L" && "bg-destructive/20 text-destructive border border-destructive/40",
          )}
        >
          {r}
        </span>
      ))}
    </div>
  );
}

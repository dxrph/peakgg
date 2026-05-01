import { Check, Globe, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LOCALES, useI18n, type Locale, LOCALE_META } from "@/i18n";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface Props {
  className?: string;
}

export default function LanguageSwitcher({ className }: Props) {
  const { locale, setLocale, t } = useI18n();
  const current = LOCALE_META[locale];
  const [open, setOpen] = useState(false);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={t("ui.language")}
          className={cn(
            "group relative inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/40 backdrop-blur-sm pl-2.5 pr-3 py-1.5",
            "transition-all duration-300 ease-out",
            "hover:border-primary/60 hover:bg-primary/5 hover:shadow-[0_0_18px_-4px_hsl(var(--primary)/0.55)]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
            open && "border-primary/70 bg-primary/5 shadow-[0_0_18px_-4px_hsl(var(--primary)/0.55)]",
            className,
          )}
        >
          <Globe
            className={cn(
              "h-3.5 w-3.5 text-muted-foreground transition-all duration-300",
              "group-hover:text-primary group-hover:rotate-12",
              open && "text-primary rotate-12",
            )}
          />
          <span className="text-base leading-none drop-shadow-sm" aria-hidden>
            {current.flag}
          </span>
          <span className="font-display text-xs font-bold tracking-[0.15em] text-foreground/90">
            {current.label}
          </span>
          <ChevronDown
            className={cn(
              "h-3 w-3 text-muted-foreground transition-transform duration-300",
              open && "rotate-180 text-primary",
            )}
          />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={10}
        className={cn(
          "min-w-[14rem] p-2 rounded-xl border border-border/60 bg-popover/95 backdrop-blur-xl",
          "shadow-2xl shadow-primary/10",
          "animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-200",
        )}
      >
        <div className="px-2 pt-1 pb-2 mb-1 border-b border-border/40">
          <p className="font-display text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
            {t("ui.language")}
          </p>
        </div>
        {LOCALES.map((l) => {
          const active = locale === l.code;
          return (
            <DropdownMenuItem
              key={l.code}
              onClick={() => setLocale(l.code as Locale)}
              className={cn(
                "group/item relative flex items-center gap-3 rounded-lg px-2.5 py-2 cursor-pointer",
                "transition-all duration-200",
                "focus:bg-primary/10 focus:text-foreground",
                active && "bg-primary/10",
              )}
            >
              {/* Active accent bar */}
              <span
                className={cn(
                  "absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-primary transition-all duration-300",
                  active ? "opacity-100 shadow-[0_0_8px_hsl(var(--primary))]" : "opacity-0 group-hover/item:opacity-50",
                )}
                aria-hidden
              />
              {/* Flag chip */}
              <span
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full border text-lg leading-none transition-all duration-200",
                  active
                    ? "border-primary/60 bg-primary/10 shadow-[0_0_12px_-2px_hsl(var(--primary)/0.6)]"
                    : "border-border/50 bg-secondary/40 group-hover/item:border-primary/40 group-hover/item:scale-105",
                )}
                aria-hidden
              >
                {l.flag}
              </span>
              <div className="flex-1 min-w-0">
                <div
                  className={cn(
                    "font-display text-sm font-semibold tracking-wide leading-tight",
                    active ? "text-primary" : "text-foreground",
                  )}
                >
                  {l.name}
                </div>
                <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground/70 leading-tight">
                  {l.label}
                </div>
              </div>
              <Check
                className={cn(
                  "h-4 w-4 text-primary transition-all duration-200",
                  active ? "opacity-100 scale-100" : "opacity-0 scale-50",
                )}
              />
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
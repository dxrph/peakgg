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
            "inline-flex h-9 w-9 items-center justify-center rounded-md border border-border/60 bg-background/40",
            "transition-all duration-200",
            "hover:border-primary/60 hover:bg-primary/5",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
            open && "border-primary/70 bg-primary/5",
            className,
          )}
        >
          <span className="text-lg leading-none" aria-hidden>
            {current.flag}
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className={cn(
          "w-44 p-1.5 rounded-lg border border-border/60 bg-popover/95 backdrop-blur-md shadow-xl",
          "animate-in fade-in-0 zoom-in-95 slide-in-from-top-1 duration-150",
        )}
      >
        {LOCALES.map((l) => {
          const active = locale === l.code;
          return (
            <DropdownMenuItem
              key={l.code}
              onClick={() => setLocale(l.code as Locale)}
              className={cn(
                "flex items-center gap-3 rounded-md px-2.5 py-2 cursor-pointer",
                "transition-colors duration-150",
                "focus:bg-primary/10",
                active && "bg-primary/10",
              )}
            >
              <span className="text-lg leading-none" aria-hidden>
                {l.flag}
              </span>
              <span
                className={cn(
                  "flex-1 font-display text-sm font-semibold tracking-wide",
                  active ? "text-primary" : "text-foreground",
                )}
              >
                {l.name}
              </span>
              <span
                className={cn(
                  "font-display text-[10px] font-bold uppercase tracking-[0.15em]",
                  active ? "text-primary" : "text-muted-foreground/60",
                )}
              >
                {l.label}
              </span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
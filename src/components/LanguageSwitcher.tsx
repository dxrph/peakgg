import { Check, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { LOCALES, useI18n, type Locale, LOCALE_META } from "@/i18n";

interface Props {
  className?: string;
}

export default function LanguageSwitcher({ className }: Props) {
  const { locale, setLocale, t } = useI18n();
  const current = LOCALE_META[locale];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={`gap-1.5 font-display font-semibold border border-border/40 hover:border-border ${className ?? ""}`}
          aria-label={t("ui.language")}
        >
          <span className="text-base leading-none" aria-hidden>{current.flag}</span>
          <span className="text-xs tracking-wider">{current.label}</span>
          <ChevronDown className="h-3 w-3 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[10rem]">
        {LOCALES.map((l) => {
          const active = locale === l.code;
          return (
            <DropdownMenuItem
              key={l.code}
              onClick={() => setLocale(l.code as Locale)}
              className={`flex items-center justify-between gap-3 ${active ? "font-bold text-primary" : ""}`}
            >
              <span className="flex items-center gap-2">
                <span className="text-base leading-none" aria-hidden>{l.flag}</span>
                <span className="text-sm">{l.name}</span>
                <span className="text-[10px] uppercase tracking-wider opacity-60">{l.label}</span>
              </span>
              {active && <Check className="h-3.5 w-3.5" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
import { Globe } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { LOCALES, useI18n, type Locale } from "@/i18n";

interface Props {
  className?: string;
}

export default function LanguageSwitcher({ className }: Props) {
  const { locale, setLocale, t } = useI18n();
  const current = LOCALES.find((l) => l.code === locale)?.label ?? "EN";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={`gap-1.5 font-display font-semibold ${className ?? ""}`}
          aria-label={t("ui.language")}
        >
          <Globe className="h-4 w-4" />
          <span className="text-xs tracking-wider">{current}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[8rem]">
        {LOCALES.map((l) => (
          <DropdownMenuItem
            key={l.code}
            onClick={() => setLocale(l.code as Locale)}
            className={locale === l.code ? "font-bold text-primary" : ""}
          >
            {l.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
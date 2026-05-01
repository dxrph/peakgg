import { HelpCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface InfoTooltipProps {
  content: string;
  className?: string;
  side?: "top" | "right" | "bottom" | "left";
}

/**
 * Small (?) icon that explains gaming jargon (ELO, Tier, Bracket...) in
 * plain language. Tap-friendly on mobile via Radix tooltip.
 */
export default function InfoTooltip({ content, className, side = "top" }: InfoTooltipProps) {
  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label="More info"
            className={cn(
              "inline-flex h-4 w-4 items-center justify-center rounded-full text-muted-foreground/70 hover:text-primary transition-colors align-middle",
              className,
            )}
          >
            <HelpCircle className="h-3.5 w-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent side={side} className="max-w-xs text-xs font-body leading-relaxed">
          {content}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
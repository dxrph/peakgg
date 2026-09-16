import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import DiscordIcon from "@/components/icons/DiscordIcon";
import { Display, Rail } from "@/components/system";
import { DISCORD_INVITE } from "@/lib/links";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/i18n";

export default function CommunityModule() {
  const { t } = useI18n();
  const { user } = useAuth();

  return (
    <section className="bc-section border-t border-border bc-rules">
      <div className="container">
        <div className="border border-border bg-card/40 p-7 md:p-12 grid lg:grid-cols-[1.2fr_.8fr] gap-10 items-center">
          <div>
            <Rail className="mb-4">{t("home.community.rail", { defaultValue: "Closed beta · Europe" })}</Rail>
            <Display className="text-4xl md:text-6xl">
              {t("home.community.title", { defaultValue: "The bracket is waiting" })}
            </Display>
            <p className="mt-4 text-muted-foreground font-body max-w-lg leading-relaxed">
              {t("home.community.copy", {
                defaultValue:
                  "Beta access is limited. Create your player card now, then coordinate scrims, tryouts and cup nights in the Discord.",
              })}
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <Link to={user ? "/dashboard" : "/register"}>
              <Button className="w-full h-12 rounded-none font-display font-bold uppercase tracking-[0.16em]">
                {user
                  ? t("home.community.cta_auth", { defaultValue: "Go to dashboard" })
                  : t("home.community.cta", { defaultValue: "Create player card" })}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <a href={DISCORD_INVITE} target="_blank" rel="noopener noreferrer">
              <Button
                variant="outline"
                className="w-full h-12 rounded-none border-border bg-transparent text-[#C7C8FF] font-display font-bold uppercase tracking-[0.16em] hover:border-[#5865F2]/60"
              >
                <DiscordIcon className="mr-2 h-4 w-4" />
                {t("home.community.discord", { defaultValue: "Join the Discord" })}
              </Button>
            </a>
            <p className="text-[10px] uppercase tracking-[0.2em] font-display text-muted-foreground text-center">
              {t("home.community.note", { defaultValue: "Invite-only · Valorant · CS2 and R6 next" })}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

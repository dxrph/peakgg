import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Award,
  Bell,
  LayoutDashboard,
  Search,
  Settings,
  Shield,
  Swords,
  Trophy,
  UserPlus,
  Users,
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { useAuth } from "@/hooks/useAuth";
import { useUserRoles } from "@/hooks/useUserRoles";

const OPEN_EVENT = "peakgg:open-command";

export function openPeakCommand() {
  window.dispatchEvent(new CustomEvent(OPEN_EVENT));
}

export default function PeakCommandPalette() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile } = useAuth();
  const { isAdmin } = useUserRoles();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => !value);
      }
    };
    const onOpen = () => setOpen(true);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener(OPEN_EVENT, onOpen);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener(OPEN_EVENT, onOpen);
    };
  }, []);

  useEffect(() => setOpen(false), [location.pathname]);

  const accountItems = useMemo(
    () => [
      { label: "Command center", hint: "Dashboard personale", path: "/dashboard", icon: LayoutDashboard },
      { label: "Player Passport", hint: "Profilo competitivo", path: profile?.username ? `/profile/${profile.username}` : "/dashboard", icon: Award },
      { label: "Notifiche", hint: "Inviti e aggiornamenti", path: "/notifications", icon: Bell },
      { label: "Sicurezza e accesso", hint: "Passkey, MFA e dati", path: "/settings", icon: Settings },
    ],
    [profile?.username],
  );

  const go = (path: string) => {
    setOpen(false);
    navigate(path);
  };

  if (!user) return null;

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <div className="px-4 pt-4 pb-2 border-b border-border bg-primary/[0.04]">
        <div className="text-[10px] uppercase tracking-[.28em] text-primary font-display">PeakGG OS // Quick access</div>
      </div>
      <CommandInput placeholder="Cerca una funzione o apri una sezione…" />
      <CommandList className="max-h-[430px] p-2">
        <CommandEmpty>Nessun comando trovato.</CommandEmpty>
        <CommandGroup heading="Competi">
          <CommandItem onSelect={() => go("/tournaments")}><Trophy className="mr-3" />Tornei e Tournament Cockpit<CommandShortcut>G T</CommandShortcut></CommandItem>
          <CommandItem onSelect={() => go("/free-agents")}><UserPlus className="mr-3" />Party Finder e giocatori<CommandShortcut>G F</CommandShortcut></CommandItem>
          <CommandItem onSelect={() => go("/teams")}><Users className="mr-3" />Squadre e Club HQ<CommandShortcut>G C</CommandShortcut></CommandItem>
          <CommandItem onSelect={() => go("/leaderboard")}><Swords className="mr-3" />Ranking competitivo<CommandShortcut>G R</CommandShortcut></CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Account">
          {accountItems.map(({ label, hint, path, icon: Icon }) => (
            <CommandItem key={label} value={`${label} ${hint}`} onSelect={() => go(path)}>
              <Icon className="mr-3" />
              <span className="flex flex-col"><span>{label}</span><span className="text-[10px] text-muted-foreground">{hint}</span></span>
            </CommandItem>
          ))}
        </CommandGroup>
        {isAdmin && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Operations">
              <CommandItem onSelect={() => go("/admin")}><Shield className="mr-3 text-primary" />Admin Control Room<CommandShortcut>OPS</CommandShortcut></CommandItem>
              <CommandItem onSelect={() => go("/admin/tournaments")}><Trophy className="mr-3 text-primary" />Crea o gestisci un torneo</CommandItem>
              <CommandItem onSelect={() => go("/admin/disputes")}><Search className="mr-3 text-primary" />Coda contestazioni</CommandItem>
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}


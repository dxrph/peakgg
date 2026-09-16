import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface OnboardingStep {
  key: "profile" | "team" | "match";
  done: boolean;
}

export interface OnboardingProgress {
  loading: boolean;
  steps: OnboardingStep[];
  completed: number;
  total: number;
  done: boolean;
}

/**
 * Computes onboarding completion for the current user.
 *
 * Steps:
 * 1. profile  — avatar uploaded (proxy for "completed profile")
 * 2. team     — joined or created at least one team
 * 3. match    — played at least one match
 */
export function useOnboardingProgress(): OnboardingProgress {
  const { user, profile } = useAuth();
  const [hasTeam, setHasTeam] = useState(false);
  const [hasMatch, setHasMatch] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!user) {
        setLoading(false);
        return;
      }
      const [{ count: teamCount }, { count: matchCount }] = await Promise.all([
        supabase
          .from("team_members")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id),
        supabase
          .from("player_stats")
          .select("matches_played")
          .eq("user_id", user.id),
      ]);
      if (cancelled) return;
      setHasTeam((teamCount ?? 0) > 0);
      // Re-fetch matches_played sum across games
      const { data: stats } = await supabase
        .from("player_stats")
        .select("matches_played")
        .eq("user_id", user.id);
      const total = (stats ?? []).reduce((acc, s: any) => acc + (s.matches_played ?? 0), 0);
      setHasMatch(total > 0);
      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [user]);

  const profileDone = Boolean(profile?.avatar_url);

  const steps: OnboardingStep[] = [
    { key: "profile", done: profileDone },
    { key: "team", done: hasTeam },
    { key: "match", done: hasMatch },
  ];
  const completed = steps.filter((s) => s.done).length;

  return {
    loading,
    steps,
    completed,
    total: steps.length,
    done: completed === steps.length,
  };
}
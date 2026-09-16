import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

/**
 * Subscribes to `notifications` inserts of type `match_found` for the current user
 * and auto-redirects to /matches/:id. Used by Tournaments + Play queue surfaces.
 */
export function useMatchFoundListener(opts?: { autoRedirect?: boolean }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const autoRedirect = opts?.autoRedirect !== false;

  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel(`match-found-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload: any) => {
          const n = payload.new;
          if (!n || n.type !== "match_found") return;
          const matchId = n.entity_id;
          if (!matchId) return;
          toast.success("Match found — opening…");
          if (autoRedirect) navigate(`/matches/${matchId}`);
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [user?.id, autoRedirect, navigate]);
}

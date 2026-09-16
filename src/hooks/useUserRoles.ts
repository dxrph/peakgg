import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type AppRole = "admin" | "moderator" | "organizer" | "user";

export function useUserRoles() {
  const { user, loading: authLoading } = useAuth();
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    if (authLoading) return;
    if (!user) {
      setRoles([]);
      setLoading(false);
      return;
    }
    (async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);
      if (cancelled) return;
      setRoles((data ?? []).map((r: { role: string }) => r.role as AppRole));
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user, authLoading]);

  const isAdmin = roles.includes("admin");
  const isModerator = isAdmin || roles.includes("moderator");
  const isOrganizer = isAdmin || roles.includes("organizer");
  const isStaff = isAdmin || isModerator || isOrganizer;

  return { roles, loading, isAdmin, isModerator, isOrganizer, isStaff };
}

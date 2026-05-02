import { ReactNode, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

type Role = "admin" | "moderator" | "organizer";

interface RoleGuardProps {
  children: ReactNode;
  /** Roles that grant access. Admin always implies moderator access. */
  allow: Role[];
  /** Where to send users who lack the role. Default: home page. */
  fallback?: string;
}

export default function RoleGuard({ children, allow, fallback = "/" }: RoleGuardProps) {
  const { user, loading: authLoading } = useAuth();
  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (authLoading) return;
    if (!user) {
      setChecking(false);
      return;
    }
    (async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);
      if (cancelled) return;
      const roles = (data ?? []).map((r: { role: string }) => r.role);
      const ok =
        !error &&
        (roles.includes("admin") ||
          (allow.includes("moderator") && roles.includes("moderator")) ||
          (allow.includes("organizer") && roles.includes("organizer")));
      setAllowed(ok);
      setChecking(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user, authLoading, allow]);

  if (authLoading || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (!allowed) return <Navigate to={fallback} replace />;

  return <>{children}</>;
}
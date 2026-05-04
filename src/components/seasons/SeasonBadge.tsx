import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Trophy } from "lucide-react";

type Badge = { id: string; badge_label: string; badge_color: string };

export default function SeasonBadge({ userId }: { userId: string }) {
  const [badges, setBadges] = useState<Badge[]>([]);
  useEffect(() => {
    if (!userId) return;
    supabase.from("profile_season_badges")
      .select("id, badge_label, badge_color")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(5)
      .then(({ data }) => setBadges((data ?? []) as Badge[]));
  }, [userId]);
  if (badges.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {badges.map(b => (
        <span
          key={b.id}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-display uppercase tracking-wider border"
          style={{ borderColor: b.badge_color, color: b.badge_color }}
        >
          <Trophy className="h-3 w-3" /> {b.badge_label}
        </span>
      ))}
    </div>
  );
}
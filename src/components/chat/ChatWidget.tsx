import { useEffect, useMemo, useRef, useState, type JSX } from "react";
import { useLocation, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  X,
  Search,
  Info,
  Globe,
  Users,
  Pin,
  AlertTriangle,
  BadgeCheck,
  Star,
  CornerUpLeft,
  MoreHorizontal,
  SmilePlus,
  Paperclip,
  Smile,
  Send,
  Crown,
  Shield,
  Trash2,
  Plus,
  Mountain,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useChat, type ChatMessage } from "@/hooks/useChat";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

type Tab = "global" | "team";

/* ───────────────────────── Scoped styles ───────────────────────── */

const PEAK_CSS = `
.pkw{
  --pk-panel:#110a0d; --pk-panel-2:#170e12; --pk-panel-3:#1d1318;
  --pk-line:rgba(255,255,255,.05); --pk-line-2:rgba(255,255,255,.09); --pk-line-3:rgba(255,255,255,.14);
  --pk-text:#fafafa; --pk-text-mid:#cfc7cb; --pk-text-dim:#8e8489; --pk-text-faint:#6e6469;
  --pk-red:#ff4655; --pk-red-soft:rgba(255,70,85,.10); --pk-red-soft-2:rgba(255,70,85,.18);
  --pk-green:#22c98b; --pk-amber:#ffb454; --pk-blue:#5b8cff;
  display:flex; flex-direction:column; overflow:hidden;
  background:linear-gradient(180deg,var(--pk-panel-2) 0%,var(--pk-panel) 100%);
  border:1px solid var(--pk-line-2);
  color:var(--pk-text);
  font-family:'DM Sans','Manrope',sans-serif;
}
.pkw::before{
  content:""; position:absolute; top:0; left:0; right:0; height:1px;
  background:linear-gradient(90deg, transparent, rgba(255,70,85,.4), transparent);
  pointer-events:none; z-index:4;
}
.pkw .pk-display{font-family:'Rajdhani','Saira Condensed',sans-serif;}
.pkw .pk-mono{font-family:'JetBrains Mono',ui-monospace,monospace;}

/* Header */
.pkw .pk-header{padding:14px 16px 12px; border-bottom:1px solid var(--pk-line); background:var(--pk-panel-2); flex-shrink:0;}
.pkw .pk-row{display:flex; justify-content:space-between; align-items:center;}
.pkw .pk-logo{width:26px;height:26px;border-radius:7px;background:linear-gradient(135deg,#ff4655 0%,#ff8c42 100%);display:grid;place-items:center;color:#fff;line-height:1;box-shadow:0 4px 12px -2px rgba(255,70,85,.5);}
.pkw .pk-title{font-weight:800; letter-spacing:.06em; font-size:15px; text-transform:uppercase;}
.pkw .pk-online{display:inline-flex;align-items:center;gap:6px;padding:4px 9px;border-radius:99px;background:rgba(34,201,139,.07);border:1px solid rgba(34,201,139,.16); font-size:11px; color:var(--pk-text-mid);}
.pkw .pk-online .dot{width:6px;height:6px;border-radius:50%;background:var(--pk-green); animation:pkwPulse 2s infinite;}
.pkw .pk-iconbtn{width:30px;height:30px;border-radius:7px;display:grid;place-items:center;color:var(--pk-text-dim);background:transparent;border:0;cursor:pointer;transition:all .15s;}
.pkw .pk-iconbtn:hover{color:var(--pk-text); background:rgba(255,255,255,.05);}
.pkw .pk-topic{display:flex;align-items:center;gap:6px; font-size:12px; color:var(--pk-text-dim); margin:8px 0 12px;}
.pkw .pk-topic b{color:var(--pk-text-mid); font-weight:600;}

.pkw .pk-tabs{display:flex;gap:2px; background:rgba(0,0,0,.25); padding:3px; border-radius:8px; border:1px solid var(--pk-line);}
.pkw .pk-tab{position:relative; flex:1; padding:8px 12px; border-radius:6px; font-weight:600; font-size:12.5px; color:var(--pk-text-dim); background:transparent; border:0; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px; transition:all .15s;}
.pkw .pk-tab:hover{color:var(--pk-text);}
.pkw .pk-tab.active{color:var(--pk-text); background:var(--pk-panel-3); box-shadow: inset 0 1px 0 rgba(255,255,255,.04);}
.pkw .pk-count{font-size:10px; font-weight:600; padding:1px 5px; border-radius:3px; background:rgba(255,255,255,.04); color:var(--pk-text-mid);}
.pkw .pk-tab.active .pk-count{background:var(--pk-red-soft); color:var(--pk-red);}
.pkw .pk-notif{position:absolute; top:4px; right:6px; width:6px;height:6px;border-radius:50%; background:var(--pk-red); box-shadow:0 0 0 2px var(--pk-panel-2); animation:pkwPulseRed 1.4s infinite;}

/* Pinned */
.pkw .pk-pinned{margin:12px 12px 0; padding:11px 13px; border:1px solid rgba(255,70,85,.15); background:linear-gradient(180deg, rgba(255,70,85,.07), rgba(255,70,85,.02)); border-radius:10px; display:flex; gap:10px; align-items:flex-start; font-size:12.5px; color:var(--pk-text-mid); line-height:1.5; flex-shrink:0;}
.pkw .pk-pinned b{color:var(--pk-text); font-weight:600;}
.pkw .pk-pinned a{color:var(--pk-red); font-weight:600; text-decoration:none;}
.pkw .pk-pinned a:hover{text-decoration:underline;}

/* Messages */
.pkw .pk-messages{flex:1; min-height:0; overflow-y:auto; padding:8px 0 4px; scroll-behavior:smooth;}
.pkw .pk-messages::-webkit-scrollbar{width:6px;}
.pkw .pk-messages::-webkit-scrollbar-track{background:transparent;}
.pkw .pk-messages::-webkit-scrollbar-thumb{background:rgba(255,255,255,.06); border-radius:99px;}
.pkw .pk-messages::-webkit-scrollbar-thumb:hover{background:rgba(255,255,255,.12);}

.pkw .pk-date-wrap{display:flex; justify-content:center; position:sticky; top:0; z-index:2; padding:2px 0;}
.pkw .pk-date{padding:3px 10px; background:rgba(17,10,13,.85); backdrop-filter:blur(6px); border:1px solid var(--pk-line); border-radius:99px; font-size:10px; letter-spacing:.08em; font-weight:600; color:var(--pk-text-mid);}

.pkw .pk-system{margin:4px 16px; padding:7px 12px; background:rgba(255,180,84,.04); border:1px solid rgba(255,180,84,.10); border-radius:8px; display:flex; align-items:center; gap:10px; font-size:12.5px; color:var(--pk-text-dim); font-style:italic;}
.pkw .pk-system .time{margin-left:auto; font-size:10.5px; color:var(--pk-text-faint); font-style:normal;}

.pkw .pk-msg{position:relative; padding:5px 16px; display:grid; grid-template-columns:38px 1fr; gap:10px; transition:background .12s;}
.pkw .pk-msg:hover{background:rgba(255,255,255,.015);}
.pkw .pk-msg.mention-you{background:linear-gradient(90deg, rgba(255,70,85,.06), transparent 80%); box-shadow:inset 2px 0 0 var(--pk-red);}
.pkw .pk-msg.grouped{padding:1px 16px;}
.pkw .pk-msg.grouped .pk-avatar-wrap{visibility:hidden; height:0;}
.pkw .pk-msg.grouped .pk-head{display:none;}
.pkw .pk-ghost-time{position:absolute; left:8px; top:50%; transform:translateY(-50%); font-size:9.5px; color:var(--pk-text-faint); opacity:0; transition:opacity .12s;}
.pkw .pk-msg.grouped:hover .pk-ghost-time{opacity:1;}

.pkw .pk-avatar-wrap{position:relative; width:38px; height:38px;}
.pkw .pk-avatar{width:38px;height:38px;border-radius:50%;border:2px solid var(--pk-panel); display:grid;place-items:center; font-weight:700; font-size:14px; color:#fff; overflow:hidden;}
.pkw .pk-avatar img{width:100%; height:100%; object-fit:cover;}
.pkw .pk-avatar.v0{background:linear-gradient(135deg,#5a2a35,#ff4655);}
.pkw .pk-avatar.v1{background:linear-gradient(135deg,#2a3d5a,#4c7cff);}
.pkw .pk-avatar.v2{background:linear-gradient(135deg,#2a5a3d,#22c98b);}
.pkw .pk-avatar.v3{background:linear-gradient(135deg,#5a4a2a,#ffb454);}
.pkw .pk-avatar.v4{background:linear-gradient(135deg,#3a2a5a,#9a6cff);}
.pkw .pk-avatar.captain{box-shadow:0 0 0 2px var(--pk-amber);}
.pkw .pk-status{position:absolute; bottom:0; right:0; width:11px;height:11px;border-radius:50%; border:2.5px solid var(--pk-panel); background:var(--pk-green);}

.pkw .pk-head{display:flex; flex-wrap:wrap; align-items:center; gap:7px; margin-bottom:3px;}
.pkw .pk-author{font-weight:700; font-size:14px; color:var(--pk-text);}
.pkw .pk-author.admin{color:var(--pk-red);}
.pkw .pk-author.moderator{color:var(--pk-blue);}
.pkw .pk-time{margin-left:auto; font-size:10.5px; color:var(--pk-text-faint);}

.pkw .pk-badge{display:inline-flex; align-items:center; gap:3px; font-size:9px; letter-spacing:.08em; text-transform:uppercase; font-weight:600; padding:2px 6px; border-radius:3px; border:1px solid transparent;}
.pkw .pk-badge.admin{background:rgba(255,70,85,.10); color:var(--pk-red); border-color:rgba(255,70,85,.25);}
.pkw .pk-badge.moderator{background:rgba(91,140,255,.10); color:var(--pk-blue); border-color:rgba(91,140,255,.25);}
.pkw .pk-badge.founding{background:rgba(255,180,84,.10); color:var(--pk-amber); border-color:rgba(255,180,84,.25);}

.pkw .pk-text{font-size:14px; color:var(--pk-text-mid); line-height:1.5; word-wrap:break-word; overflow-wrap:anywhere;}
.pkw .pk-mention{color:var(--pk-red); background:var(--pk-red-soft); padding:1px 5px; border-radius:3px; font-weight:600;}
.pkw .pk-mention.you{color:#ff7280; background:rgba(255,70,85,.18);}
.pkw .pk-text code{font-size:12.5px; background:rgba(255,255,255,.06); border:1px solid var(--pk-line-2); padding:1px 5px; border-radius:4px; color:var(--pk-text); font-family:'JetBrains Mono',monospace;}

/* Hover toolbar */
.pkw .pk-actions{position:absolute; top:-14px; right:14px; z-index:3; opacity:0; pointer-events:none; transform:translateY(4px); transition:all .15s; background:var(--pk-panel-3); border:1px solid var(--pk-line-2); border-radius:8px; padding:3px; display:flex; align-items:center; box-shadow:0 8px 20px -4px rgba(0,0,0,.6);}
.pkw .pk-msg:hover .pk-actions{opacity:1; pointer-events:auto; transform:translateY(0);}
.pkw .pk-emoji-btn{width:26px;height:26px;border-radius:5px;display:grid;place-items:center;font-size:15px;background:transparent;border:0;cursor:pointer; transition:all .12s;}
.pkw .pk-emoji-btn:hover{transform:scale(1.15); background:rgba(255,255,255,.06);}
.pkw .pk-act-divider{width:1px; height:16px; background:var(--pk-line); margin:0 3px;}
.pkw .pk-act-btn{width:26px;height:26px;border-radius:5px;display:grid;place-items:center;color:var(--pk-text-dim);background:transparent;border:0;cursor:pointer;}
.pkw .pk-act-btn:hover{color:var(--pk-text); background:rgba(255,255,255,.06);}
.pkw .pk-act-btn.danger:hover{color:var(--pk-red); background:rgba(255,70,85,.10);}

/* Composer */
.pkw .pk-composer{padding:10px 12px 12px; border-top:1px solid var(--pk-line); background:var(--pk-panel-2); position:relative; flex-shrink:0;}
.pkw .pk-slash{position:absolute; left:12px; right:12px; bottom:calc(100% + 6px); z-index:5; background:var(--pk-panel-3); border:1px solid var(--pk-line-2); border-radius:10px; overflow:hidden; box-shadow:0 16px 40px -8px rgba(0,0,0,.6);}
.pkw .pk-slash-head{padding:8px 12px; font-size:10px; letter-spacing:.08em; color:var(--pk-text-dim); border-bottom:1px solid var(--pk-line); background:rgba(0,0,0,.2);}
.pkw .pk-slash-item{padding:9px 12px; display:flex; gap:10px; align-items:center; cursor:pointer;}
.pkw .pk-slash-item:hover,.pkw .pk-slash-item.active{background:rgba(255,70,85,.07);}
.pkw .pk-slash-cmd{font-size:12px; font-weight:600; color:var(--pk-red);}
.pkw .pk-slash-desc{font-size:12.5px; color:var(--pk-text-mid);}
.pkw .pk-slash-args{margin-left:auto; font-size:11px; color:var(--pk-text-faint);}

.pkw .pk-input-wrap{display:flex; align-items:center; gap:6px; padding:6px 6px 6px 12px; background:var(--pk-panel); border:1px solid var(--pk-line-2); border-radius:10px; transition:border-color .15s;}
.pkw .pk-input-wrap:focus-within{border-color:rgba(255,70,85,.35);}
.pkw .pk-input-wrap input{flex:1; background:transparent; border:0; outline:0; font-size:14px; color:#ffffff; font-family:inherit; min-width:0; font-weight:500;}
.pkw .pk-input-wrap input::placeholder{color:#a39aa0; opacity:1;}
.pkw .pk-counter{font-size:11px; color:var(--pk-text-dim); min-width:42px; text-align:right; font-weight:500;}
.pkw .pk-counter.warn{color:var(--pk-amber);}
.pkw .pk-send{width:32px;height:32px;border-radius:7px; background:var(--pk-red); color:#fff; border:0; display:grid; place-items:center; cursor:pointer; transition:all .15s; flex-shrink:0;}
.pkw .pk-send:hover:not(:disabled){background:#ff5867; transform:scale(1.05); box-shadow:0 4px 12px -2px rgba(255,70,85,.5);}
.pkw .pk-send:disabled{background:rgba(255,255,255,.05); color:var(--pk-text-faint); cursor:not-allowed;}
.pkw .pk-tool{position:relative; width:28px;height:28px;border-radius:6px; background:transparent; border:0; color:var(--pk-text-mid); display:grid;place-items:center; cursor:pointer; flex-shrink:0; transition:all .15s;}
.pkw .pk-tool:hover{color:#fff; background:rgba(255,70,85,.12);}
.pkw .pk-tool.active{color:var(--pk-red); background:rgba(255,70,85,.14);}
.pkw .pk-hint{margin-top:8px; display:flex; justify-content:space-between; gap:8px; padding:0 4px; font-size:11px; letter-spacing:.02em; color:var(--pk-text-mid); flex-wrap:wrap;}
.pkw .pk-hint span{display:inline-flex; align-items:center; gap:6px; flex-wrap:wrap;}
.pkw .pk-hint kbd{font-size:10px; padding:1.5px 6px; border-radius:4px; background:rgba(255,255,255,.08); border:1px solid var(--pk-line-3); color:#fff; font-family:'JetBrains Mono',monospace; font-weight:600; box-shadow:0 1px 0 rgba(0,0,0,.4);}

/* Tooltip */
.pkw [data-tip]{position:relative;}
.pkw [data-tip]:hover::after{content:attr(data-tip); position:absolute; bottom:calc(100% + 6px); left:50%; transform:translateX(-50%); background:#000; color:#fff; font-size:11px; font-weight:500; padding:4px 8px; border-radius:5px; border:1px solid var(--pk-line-3); white-space:nowrap; pointer-events:none; z-index:20; font-family:'DM Sans',sans-serif; letter-spacing:.02em;}

/* Emoji popover */
.pkw .pk-emoji-pop{position:absolute; bottom:calc(100% + 6px); left:6px; z-index:10; background:var(--pk-panel-3); border:1px solid var(--pk-line-3); border-radius:10px; padding:8px; display:grid; grid-template-columns:repeat(7,1fr); gap:2px; box-shadow:0 16px 40px -8px rgba(0,0,0,.7); width:max-content;}
.pkw .pk-emoji-pop button{width:30px;height:30px;border:0; background:transparent; border-radius:6px; font-size:18px; cursor:pointer; line-height:1; transition:all .1s;}
.pkw .pk-emoji-pop button:hover{background:rgba(255,70,85,.15); transform:scale(1.15);}

/* Attachment preview */
.pkw .pk-attach{margin-bottom:8px; padding:8px 10px; background:var(--pk-panel-3); border:1px solid var(--pk-line-2); border-radius:8px; display:flex; align-items:center; gap:10px;}
.pkw .pk-attach-thumb{width:36px;height:36px; border-radius:6px; background:rgba(255,70,85,.12); display:grid; place-items:center; color:var(--pk-red); flex-shrink:0; overflow:hidden;}
.pkw .pk-attach-thumb img{width:100%; height:100%; object-fit:cover;}
.pkw .pk-attach-info{flex:1; min-width:0;}
.pkw .pk-attach-name{font-size:13px; color:#fff; font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;}
.pkw .pk-attach-meta{font-size:11px; color:var(--pk-text-dim);}
.pkw .pk-attach-x{width:24px;height:24px; border-radius:5px; background:transparent; border:0; color:var(--pk-text-mid); cursor:pointer; display:grid; place-items:center;}
.pkw .pk-attach-x:hover{color:#fff; background:rgba(255,70,85,.15);}

.pkw .pk-locked{flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; padding:24px; gap:12px;}

@keyframes pkwPulse{0%{box-shadow:0 0 0 0 rgba(34,201,139,.55);}100%{box-shadow:0 0 0 7px rgba(34,201,139,0);}}
@keyframes pkwPulseRed{0%{box-shadow:0 0 0 0 rgba(255,70,85,.7);}100%{box-shadow:0 0 0 6px rgba(255,70,85,0);}}
`;

const SLASH_COMMANDS = [
  { cmd: "/team", desc: "Show or manage your team", args: "<name>" },
  { cmd: "/match", desc: "Embed a match scorecard", args: "<match_id>" },
  { cmd: "/report", desc: "Report a player to admins", args: "<user>" },
  { cmd: "/lfg", desc: "Post a Looking-For-Game request", args: "" },
];
const QUICK_EMOJIS = ["👍", "🔥", "❤️", "🫡", "😂"];

/* Stable variant from username */
function variantFor(name?: string | null): 0 | 1 | 2 | 3 | 4 {
  if (!name) return 0;
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return (h % 5) as 0 | 1 | 2 | 3 | 4;
}

function renderText(text: string, currentUsername?: string | null): (string | JSX.Element)[] {
  const parts: (string | JSX.Element)[] = [];
  const regex = /(@[A-Za-z0-9_]+|`[^`]+`)/g;
  let last = 0;
  let i = 0;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    const tok = m[0];
    if (tok.startsWith("`")) {
      parts.push(<code key={i++}>{tok.slice(1, -1)}</code>);
    } else {
      const name = tok.slice(1);
      const isYou =
        name.toLowerCase() === "you" ||
        (currentUsername && name.toLowerCase() === currentUsername.toLowerCase());
      parts.push(
        <span key={i++} className={cn("pk-mention", isYou && "you")}>
          @{name}
        </span>,
      );
    }
    last = m.index + tok.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

function MessageActions({
  canDelete,
  onDelete,
}: {
  canDelete: boolean;
  onDelete: () => void;
}) {
  return (
    <div className="pk-actions">
      {QUICK_EMOJIS.map((e) => (
        <button
          key={e}
          className="pk-emoji-btn"
          onClick={() => console.log("react", e)}
          aria-label={`React ${e}`}
        >
          {e}
        </button>
      ))}
      <span className="pk-act-divider" />
      <button
        className="pk-act-btn"
        onClick={() => console.log("reply")}
        aria-label="Reply"
      >
        <CornerUpLeft size={14} />
      </button>
      {canDelete ? (
        <button className="pk-act-btn danger" onClick={onDelete} aria-label="Delete">
          <Trash2 size={14} />
        </button>
      ) : (
        <button className="pk-act-btn" onClick={() => console.log("more")} aria-label="More">
          <MoreHorizontal size={14} />
        </button>
      )}
    </div>
  );
}

function MessageBubble({
  msg,
  grouped,
  isOwn,
  canModerate,
  onDelete,
  currentUsername,
}: {
  msg: ChatMessage;
  grouped: boolean;
  isOwn: boolean;
  canModerate: boolean;
  onDelete: (id: string) => void;
  currentUsername?: string | null;
}) {
  const time = new Date(msg.created_at);
  const timeStr = time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const username = msg.profile?.username ?? "Player";
  const v = variantFor(username);
  const initials = username.slice(0, 2).toUpperCase();
  const role = msg.role as string | undefined;
  const mentionsYou =
    !!currentUsername &&
    new RegExp(`@${currentUsername}\\b`, "i").test(msg.content);

  return (
    <div className={cn("pk-msg", grouped && "grouped", mentionsYou && "mention-you")}>
      <MessageActions
        canDelete={isOwn || canModerate}
        onDelete={() => onDelete(msg.id)}
      />
      {grouped && <span className="pk-ghost-time pk-mono">{timeStr}</span>}
      <div className="pk-avatar-wrap">
        <div className={cn("pk-avatar", `v${v}`)}>
          {msg.profile?.avatar_url ? (
            <img src={msg.profile.avatar_url} alt={username} />
          ) : (
            initials
          )}
        </div>
        <span className="pk-status" />
      </div>
      <div className="min-w-0">
        <div className="pk-head">
          <span className={cn("pk-author", role)}>{username}</span>
          {role === "admin" && (
            <span className="pk-badge admin pk-mono">
              <Crown size={9} /> ADMIN
            </span>
          )}
          {role === "moderator" && (
            <span className="pk-badge moderator pk-mono">
              <Shield size={9} /> MOD
            </span>
          )}
          {(msg as any).profile?.founding && (
            <span className="pk-badge founding pk-mono">
              <Star size={9} /> FOUNDING
            </span>
          )}
          <BadgeCheck size={13} color="#5b8cff" />
          <span className="pk-time pk-mono" title={time.toLocaleString()}>
            {timeStr}
          </span>
        </div>
        <div className="pk-text">{renderText(msg.content, currentUsername)}</div>
      </div>
    </div>
  );
}

/* ───────────────────────── Channel view ───────────────────────── */

function ChannelView({
  kind,
  teamId,
  teamName,
  currentUsername,
}: {
  kind: Tab;
  teamId: string | null;
  teamName: string | null;
  currentUsername?: string | null;
}) {
  const { user } = useAuth();
  const chat = useChat(kind, teamId);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [canModerate, setCanModerate] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chat.markRead();
    return () => chat.markInactive();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .then(({ data }) => {
        const roles = (data || []).map((r: any) => r.role);
        setCanModerate(roles.includes("admin") || roles.includes("moderator"));
      });
  }, [user]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chat.messages.length]);

  const showSlash = input.startsWith("/");
  const len = input.length;
  const canSend = input.trim().length > 0 && !sending;

  const send = async () => {
    if (!canSend) return;
    setSending(true);
    const res = await chat.sendMessage(input);
    setSending(false);
    if (res.ok) {
      setInput("");
    } else if (res.error) {
      toast({ title: "Cannot send", description: res.error, variant: "destructive" });
      if (res.error.startsWith("Your message was blocked")) setInput("");
    }
  };

  if (kind === "team" && !teamId) {
    return (
      <div className="pk-locked">
        <Users className="h-10 w-10" style={{ color: "var(--pk-text-dim)" }} />
        <p className="pk-display" style={{ fontSize: 14, letterSpacing: ".08em", textTransform: "uppercase" }}>
          Team Chat locked
        </p>
        <p style={{ fontSize: 12, color: "var(--pk-text-dim)", marginTop: -8 }}>
          Join or create a team to unlock Team Chat.
        </p>
        <div style={{ display: "flex", gap: 8 }}>
          <Link to="/teams">
            <Button size="sm" variant="neon">
              <Plus className="h-3.5 w-3.5 mr-1" />
              Create Team
            </Button>
          </Link>
          <Link to="/teams">
            <Button size="sm" variant="outline">
              Find Teams
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      {kind === "global" && (
        <div className="pk-pinned">
          <Pin size={13} color="#ff4655" style={{ marginTop: 3, flexShrink: 0 }} />
          <span>
            Welcome to <b>PeakGG Season 0 Beta</b>. Find teams, ask questions, and{" "}
            <a
              href="https://discord.gg/peakgg"
              target="_blank"
              rel="noopener noreferrer"
            >
              join the Discord →
            </a>
          </span>
        </div>
      )}
      {kind === "team" && teamName && (
        <div className="pk-pinned" style={{ borderColor: "var(--pk-line-2)", background: "rgba(255,255,255,.02)" }}>
          <Users size={13} color="#b0a8ac" style={{ marginTop: 3, flexShrink: 0 }} />
          <span>
            <b>{teamName}</b> · Private team channel
          </span>
        </div>
      )}

      <div className="pk-messages" ref={scrollRef}>
        <div className="pk-date-wrap">
          <span className="pk-date pk-mono">TODAY</span>
        </div>

        {chat.loading ? (
          <p style={{ fontSize: 12, color: "var(--pk-text-dim)", textAlign: "center", padding: "32px 0" }}>
            Loading…
          </p>
        ) : chat.messages.length === 0 ? (
          <p style={{ fontSize: 12, color: "var(--pk-text-dim)", textAlign: "center", padding: "32px 0" }}>
            No messages yet. Start the conversation.
          </p>
        ) : (
          chat.messages.map((m, idx) => {
            if (m.flagged) {
              const t = new Date(m.created_at);
              return (
                <div className="pk-system" key={m.id}>
                  <AlertTriangle size={12} color="#ffb454" />
                  <span>Message removed by moderator</span>
                  <span className="time pk-mono">
                    {t.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              );
            }
            const prev = chat.messages[idx - 1];
            const grouped =
              !!prev &&
              !prev.flagged &&
              prev.user_id === m.user_id &&
              new Date(m.created_at).getTime() - new Date(prev.created_at).getTime() < 5 * 60_000;
            return (
              <MessageBubble
                key={m.id}
                msg={m}
                grouped={grouped}
                isOwn={m.user_id === user?.id}
                canModerate={canModerate}
                onDelete={chat.deleteMessage}
                currentUsername={currentUsername}
              />
            );
          })
        )}
      </div>

      <div className="pk-composer">
        {showSlash && (
          <div className="pk-slash">
            <div className="pk-slash-head pk-mono">COMMANDS</div>
            {SLASH_COMMANDS.filter((c) =>
              c.cmd.startsWith(input.split(" ")[0]),
            ).map((c, i) => (
              <div
                key={c.cmd}
                className={cn("pk-slash-item", i === 0 && "active")}
                onClick={() => setInput(c.cmd + " ")}
              >
                <span className="pk-slash-cmd pk-mono">{c.cmd}</span>
                <span className="pk-slash-desc">{c.desc}</span>
                {c.args && <span className="pk-slash-args pk-mono">{c.args}</span>}
              </div>
            ))}
          </div>
        )}

        {chat.mute ? (
          <p style={{ fontSize: 12, color: "var(--pk-red)", textAlign: "center", padding: "6px 0" }}>
            You are muted
            {chat.mute.expires_at ? ` until ${new Date(chat.mute.expires_at).toLocaleString()}` : " permanently"}.
            {chat.mute.reason && ` Reason: ${chat.mute.reason}`}
          </p>
        ) : (
          <>
            <div className="pk-input-wrap">
              <button className="pk-tool" aria-label="Attach" type="button">
                <Paperclip size={15} />
              </button>
              <button className="pk-tool" aria-label="Emoji" type="button">
                <Smile size={15} />
              </button>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value.slice(0, 200))}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                placeholder="Message PeakGG…  Type / for commands"
                maxLength={200}
              />
              <span className={cn("pk-counter pk-mono", len > 170 && "warn")}>
                {len}/200
              </span>
              <button
                className="pk-send"
                disabled={!canSend}
                onClick={send}
                aria-label="Send"
                type="button"
              >
                <Send size={14} />
              </button>
            </div>
            <div className="pk-hint pk-mono">
              <span>
                Markdown · <kbd>@</kbd> mention · <kbd>/</kbd> commands
              </span>
              <span>
                <kbd>↵</kbd> send · <kbd>⇧</kbd>+<kbd>↵</kbd> new line
              </span>
            </div>
          </>
        )}
      </div>
    </>
  );
}

/* ───────────────────────── Main widget (FAB + panel) ───────────────────────── */

export default function ChatWidget() {
  const { user } = useAuth();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("global");
  const [teamId, setTeamId] = useState<string | null>(null);
  const [teamName, setTeamName] = useState<string | null>(null);
  const [globalUnread, setGlobalUnread] = useState(0);
  const [teamUnread, setTeamUnread] = useState(0);
  const [onlineCount, setOnlineCount] = useState<number>(0);
  const [username, setUsername] = useState<string | null>(null);

  // Find first team
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: own } = await supabase
        .from("teams")
        .select("id, name")
        .eq("owner_id", user.id)
        .limit(1);
      if (own && own.length > 0) {
        setTeamId(own[0].id);
        setTeamName(own[0].name);
        return;
      }
      const { data: mem } = await supabase
        .from("team_members")
        .select("team_id, teams!inner(id, name)")
        .eq("user_id", user.id)
        .limit(1);
      if (mem && mem.length > 0) {
        const t: any = (mem[0] as any).teams;
        setTeamId(t.id);
        setTeamName(t.name);
      }
    })();
  }, [user]);

  // Username for @mention highlighting
  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("username")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => setUsername((data as any)?.username ?? null));
  }, [user]);

  // Rough "online" presence — count of recent active chatters in last 5min
  useEffect(() => {
    if (!open) return;
    const fetchOnline = async () => {
      const fiveAgo = new Date(Date.now() - 5 * 60_000).toISOString();
      const { count } = await supabase
        .from("global_messages")
        .select("user_id", { count: "exact", head: true })
        .gte("created_at", fiveAgo);
      setOnlineCount(typeof count === "number" ? Math.max(count, 1) : 0);
    };
    fetchOnline();
    const t = setInterval(fetchOnline, 30_000);
    return () => clearInterval(t);
  }, [open]);

  // Background unread tracking when widget closed
  useEffect(() => {
    if (!user || open) return;
    const ch = supabase
      .channel(`chat-bg-${user.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "global_messages" },
        (p) => {
          const row: any = p.new;
          if (row.user_id !== user.id) setGlobalUnread((u) => u + 1);
        },
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "team_messages" },
        (p) => {
          const row: any = p.new;
          if (teamId && row.team_id === teamId && row.user_id !== user.id)
            setTeamUnread((u) => u + 1);
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [user, open, teamId]);

  useEffect(() => {
    if (open) {
      if (tab === "global") setGlobalUnread(0);
      if (tab === "team") setTeamUnread(0);
    }
  }, [open, tab]);

  const totalUnread = globalUnread + teamUnread;

  if (!user) return null;
  if (location.pathname.startsWith("/admin")) return null;

  return (
    <>
      <style>{PEAK_CSS}</style>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close chat" : "Open chat"}
        className={cn(
          "fixed bottom-6 left-6 z-50 w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300",
          "bg-[#111] border border-border/60 hover:border-primary/60 hover:shadow-[0_0_24px_hsl(var(--primary)/0.3)]",
          open && "scale-95",
        )}
      >
        {open ? (
          <X className="h-5 w-5 text-foreground" />
        ) : (
          <MessageSquare className="h-5 w-5 text-foreground" />
        )}
        {!open && totalUnread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center shadow-[0_0_8px_hsl(var(--primary)/0.6)]">
            {totalUnread > 99 ? "99+" : totalUnread}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className={cn(
              "pkw fixed z-50 bottom-24 left-6 w-[420px] h-[720px] rounded-2xl",
              "max-h-[calc(100vh-7rem)]",
              "max-sm:inset-0 max-sm:w-full max-sm:h-full max-sm:max-h-none max-sm:rounded-none max-sm:bottom-0 max-sm:left-0",
            )}
            style={{ boxShadow: "0 40px 100px -20px rgba(0,0,0,.75)" }}
          >
            {/* Header */}
            <div className="pk-header">
              <div className="pk-row">
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div className="pk-logo"><Mountain className="h-3.5 w-3.5" strokeWidth={2.5} /></div>
                  <span className="pk-title pk-display">PeakGG Chat</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  {onlineCount > 0 && (
                    <span className="pk-online pk-mono">
                      <span className="dot" />
                      {onlineCount} online
                    </span>
                  )}
                  <button className="pk-iconbtn" aria-label="Search">
                    <Search size={15} />
                  </button>
                  <button
                    className="pk-iconbtn"
                    aria-label="Close"
                    onClick={() => setOpen(false)}
                  >
                    <X size={15} />
                  </button>
                </div>
              </div>
              <div className="pk-topic">
                <Info size={11} color="#4a4146" />
                <span>
                  <b>Season 0 Beta</b> · Founding teams, captain confirmations, match talk
                </span>
              </div>
              <div className="pk-tabs">
                <button
                  className={cn("pk-tab", tab === "global" && "active")}
                  onClick={() => setTab("global")}
                >
                  <Globe size={13} />
                  Global
                  {onlineCount > 0 && (
                    <span className="pk-count pk-mono">{onlineCount}</span>
                  )}
                  {globalUnread > 0 && tab !== "global" && <span className="pk-notif" />}
                </button>
                <button
                  className={cn("pk-tab", tab === "team" && "active")}
                  onClick={() => setTab("team")}
                >
                  <Users size={13} />
                  Team
                  {teamUnread > 0 && tab !== "team" && <span className="pk-notif" />}
                </button>
              </div>
            </div>

            {/* Channel body — re-mount per tab */}
            {tab === "global" ? (
              <ChannelView
                key="global"
                kind="global"
                teamId={null}
                teamName={null}
                currentUsername={username}
              />
            ) : (
              <ChannelView
                key={`team-${teamId ?? "none"}`}
                kind="team"
                teamId={teamId}
                teamName={teamName}
                currentUsername={username}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
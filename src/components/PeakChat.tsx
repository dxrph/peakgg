import { useEffect, useMemo, useRef, useState } from "react";
import {
  Search,
  X,
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
  Image as ImageIcon,
  Paperclip,
  Smile,
  Send,
} from "lucide-react";

/* ───────────────────────── Styles (scoped via id) ───────────────────────── */

const PEAK_CSS = `
.pk-root{
  --bg:#0a0608; --panel:#110a0d; --panel-2:#170e12; --panel-3:#1d1318;
  --line:rgba(255,255,255,.05); --line-2:rgba(255,255,255,.09); --line-3:rgba(255,255,255,.14);
  --text:#fafafa; --text-mid:#b0a8ac; --text-dim:#6a6065; --text-faint:#4a4146;
  --red:#ff4655; --red-soft:rgba(255,70,85,.10); --red-soft-2:rgba(255,70,85,.18);
  --green:#22c98b; --amber:#ffb454; --blue:#5b8cff; --purple:#9a6cff;
  font-family:'Manrope',sans-serif;
  color:var(--text);
  min-height:100vh;
  background:var(--bg);
  background-image:
    radial-gradient(ellipse 700px 400px at 20% 0%, rgba(255,70,85,.08), transparent 70%),
    linear-gradient(rgba(255,70,85,.025) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,70,85,.025) 1px, transparent 1px);
  background-size: auto, 48px 48px, 48px 48px;
  display:grid; place-items:center; padding:24px;
}
.pk-font-display{font-family:'Saira Condensed',sans-serif;}
.pk-font-mono{font-family:'JetBrains Mono',monospace;}

.pk-panel{
  position:relative; width:420px; height:720px; display:flex; flex-direction:column;
  background:linear-gradient(180deg,var(--panel-2) 0%,var(--panel) 100%);
  border:1px solid var(--line-2); border-radius:16px; overflow:hidden;
  box-shadow:0 40px 100px -20px rgba(0,0,0,.75);
}
.pk-panel::before{
  content:""; position:absolute; top:0; left:0; right:0; height:1px;
  background:linear-gradient(90deg, transparent, rgba(255,70,85,.4), transparent);
}

/* Header */
.pk-header{padding:14px 16px 12px; border-bottom:1px solid var(--line); background:var(--panel-2);}
.pk-row{display:flex; justify-content:space-between; align-items:center;}
.pk-logo{width:24px;height:24px;border-radius:6px;background:var(--red);display:grid;place-items:center;color:#fff;font-size:11px;line-height:1;box-shadow:0 4px 12px -2px rgba(255,70,85,.5);}
.pk-title{font-weight:800; letter-spacing:.06em; font-size:15px; text-transform:uppercase;}
.pk-online{display:inline-flex;align-items:center;gap:6px;padding:4px 9px;border-radius:99px;background:rgba(34,201,139,.07);border:1px solid rgba(34,201,139,.16); font-size:11px; color:var(--text-mid);}
.pk-online .dot{width:6px;height:6px;border-radius:50%;background:var(--green); animation:pkPulse 2s infinite;}
.pk-iconbtn{width:30px;height:30px;border-radius:7px;display:grid;place-items:center;color:var(--text-dim);background:transparent;border:0;cursor:pointer;transition:all .15s;}
.pk-iconbtn:hover{color:var(--text); background:rgba(255,255,255,.05);}
.pk-topic{display:flex;align-items:center;gap:6px; font-size:12px; color:var(--text-dim); margin-bottom:12px;}
.pk-topic b{color:var(--text-mid); font-weight:600;}

.pk-tabs{display:flex;gap:2px; background:rgba(0,0,0,.25); padding:3px; border-radius:8px; border:1px solid var(--line);}
.pk-tab{position:relative; flex:1; padding:8px 12px; border-radius:6px; font-weight:600; font-size:12.5px; color:var(--text-dim); background:transparent; border:0; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px;}
.pk-tab.active{color:var(--text); background:var(--panel-3); box-shadow: inset 0 1px 0 rgba(255,255,255,.04);}
.pk-count{font-size:10px; font-weight:600; padding:1px 5px; border-radius:3px; background:rgba(255,255,255,.04); color:var(--text-mid);}
.pk-tab.active .pk-count{background:var(--red-soft); color:var(--red);}
.pk-notif{position:absolute; top:4px; right:6px; width:6px;height:6px;border-radius:50%; background:var(--red); box-shadow:0 0 0 2px var(--panel-2); animation:pkPulseRed 1.4s infinite;}

/* Pinned */
.pk-pinned{margin:12px 12px 0; padding:11px 13px; border:1px solid rgba(255,70,85,.15); background:linear-gradient(180deg, rgba(255,70,85,.07), rgba(255,70,85,.02)); border-radius:10px; display:flex; gap:10px; align-items:flex-start; font-size:12.5px; color:var(--text-mid); line-height:1.5;}
.pk-pinned b{color:var(--text); font-weight:600;}
.pk-pinned a{color:var(--red); font-weight:600; text-decoration:none;}
.pk-pinned a:hover{text-decoration:underline;}

/* Messages */
.pk-messages{flex:1; overflow-y:auto; padding:8px 0 4px; scroll-behavior:smooth;}
.pk-messages::-webkit-scrollbar{width:6px;}
.pk-messages::-webkit-scrollbar-track{background:transparent;}
.pk-messages::-webkit-scrollbar-thumb{background:rgba(255,255,255,.06); border-radius:99px;}
.pk-messages::-webkit-scrollbar-thumb:hover{background:rgba(255,255,255,.12);}

.pk-date{position:sticky; top:0; z-index:2; align-self:center; display:inline-block; margin:4px auto; padding:3px 10px; background:rgba(17,10,13,.85); backdrop-filter:blur(6px); border:1px solid var(--line); border-radius:99px; font-size:10px; letter-spacing:.08em; font-weight:600; color:var(--text-mid);}
.pk-date-wrap{display:flex; justify-content:center; position:sticky; top:0; z-index:2;}

.pk-system{margin:4px 16px; padding:7px 12px; background:rgba(255,180,84,.04); border:1px solid rgba(255,180,84,.10); border-radius:8px; display:flex; align-items:center; gap:10px; font-size:12.5px; color:var(--text-dim); font-style:italic;}
.pk-system .time{margin-left:auto; font-size:10.5px; color:var(--text-faint); font-style:normal;}

.pk-msg{position:relative; padding:5px 16px; display:grid; grid-template-columns:38px 1fr; gap:10px; transition:background .12s;}
.pk-msg:hover{background:rgba(255,255,255,.015);}
.pk-msg.mention-you{background:linear-gradient(90deg, rgba(255,70,85,.06), transparent 80%); box-shadow:inset 2px 0 0 var(--red);}
.pk-msg.grouped{padding:1px 16px;}
.pk-msg.grouped .pk-avatar-wrap{visibility:hidden; height:0;}
.pk-msg.grouped .pk-head{display:none;}
.pk-ghost-time{position:absolute; left:8px; top:50%; transform:translateY(-50%); font-size:9.5px; color:var(--text-faint); opacity:0; transition:opacity .12s;}
.pk-msg.grouped:hover .pk-ghost-time{opacity:1;}

.pk-avatar-wrap{position:relative; width:38px; height:38px;}
.pk-avatar{width:38px;height:38px;border-radius:50%;border:2px solid var(--panel); display:grid;place-items:center; font-weight:700; font-size:14px; color:#fff;}
.pk-avatar.default{background:linear-gradient(135deg,#5a2a35,#ff4655);}
.pk-avatar.alt-1{background:linear-gradient(135deg,#2a3d5a,#4c7cff);}
.pk-avatar.alt-2{background:linear-gradient(135deg,#2a5a3d,#22c98b);}
.pk-avatar.alt-3{background:linear-gradient(135deg,#5a4a2a,#ffb454);}
.pk-avatar.alt-4{background:linear-gradient(135deg,#3a2a5a,#9a6cff);}
.pk-avatar.captain{box-shadow:0 0 0 2px var(--amber);}
.pk-status{position:absolute; bottom:0; right:0; width:11px;height:11px;border-radius:50%; border:2.5px solid var(--panel);}
.pk-status.on{background:var(--green);}
.pk-status.away{background:var(--amber);}
.pk-status.dnd{background:var(--red);}

.pk-head{display:flex; flex-wrap:wrap; align-items:center; gap:7px; margin-bottom:3px;}
.pk-author{font-weight:700; font-size:14px; color:var(--text);}
.pk-author.captain{color:#ff8a4c;}
.pk-author.admin{color:var(--red);}
.pk-time{margin-left:auto; font-size:10.5px; color:var(--text-faint);}
.pk-time i{font-style:italic;}

.pk-badge{display:inline-flex; align-items:center; gap:3px; font-size:9px; letter-spacing:.08em; text-transform:uppercase; font-weight:600; padding:2px 6px; border-radius:3px; border:1px solid transparent;}
.pk-badge.founding{background:rgba(255,180,84,.10); color:var(--amber); border-color:rgba(255,180,84,.25);}
.pk-badge.captain{background:rgba(255,138,76,.10); color:#ff8a4c; border-color:rgba(255,138,76,.25);}
.pk-badge.admin{background:rgba(255,70,85,.10); color:var(--red); border-color:rgba(255,70,85,.25);}

.pk-text{font-size:14px; color:var(--text-mid); line-height:1.5; word-wrap:break-word;}
.pk-mention{color:var(--red); background:var(--red-soft); padding:1px 5px; border-radius:3px; font-weight:600;}
.pk-mention.you{color:#ff7280; background:rgba(255,70,85,.18);}
.pk-text code{font-size:12.5px; background:rgba(255,255,255,.06); border:1px solid var(--line-2); padding:1px 5px; border-radius:4px; color:var(--text);}

/* Hover toolbar */
.pk-actions{position:absolute; top:-14px; right:14px; z-index:3; opacity:0; pointer-events:none; transform:translateY(4px); transition:all .15s; background:var(--panel-3); border:1px solid var(--line-2); border-radius:8px; padding:3px; display:flex; align-items:center; box-shadow:0 8px 20px -4px rgba(0,0,0,.6);}
.pk-msg:hover .pk-actions{opacity:1; pointer-events:auto; transform:translateY(0);}
.pk-emoji-btn{width:26px;height:26px;border-radius:5px;display:grid;place-items:center;font-size:15px;background:transparent;border:0;cursor:pointer; transition:all .12s;}
.pk-emoji-btn:hover{transform:scale(1.15); background:rgba(255,255,255,.06);}
.pk-act-divider{width:1px; height:16px; background:var(--line); margin:0 3px;}
.pk-act-btn{width:26px;height:26px;border-radius:5px;display:grid;place-items:center;color:var(--text-dim);background:transparent;border:0;cursor:pointer;}
.pk-act-btn:hover{color:var(--text); background:rgba(255,255,255,.06);}

/* Reply ref */
.pk-reply{margin-bottom:4px; padding:3px 10px; border-left:2px solid var(--line-3); display:flex; align-items:center; gap:6px; cursor:pointer;}
.pk-reply:hover{border-left-color:var(--red);}
.pk-reply .a{color:var(--text-mid); font-weight:600; font-size:12px;}
.pk-reply .p{color:var(--text-dim); font-size:12px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:240px;}

/* Reactions */
.pk-reactions{margin-top:6px; display:flex; flex-wrap:wrap; gap:5px;}
.pk-reaction{display:inline-flex; align-items:center; gap:5px; padding:3px 8px; border-radius:11px; background:rgba(255,255,255,.04); border:1px solid var(--line-2); font-size:11.5px; color:var(--text-mid); cursor:pointer;}
.pk-reaction.mine{background:var(--red-soft); border-color:var(--red-soft-2); color:var(--red);}
.pk-reaction .e{font-size:13px;}
.pk-reaction .c{font-weight:500;}
.pk-react-add{width:22px;height:22px;border-radius:50%; display:grid;place-items:center; background:rgba(255,255,255,.04); border:1px solid var(--line-2); color:var(--text-dim); cursor:pointer;}

/* Match embed */
.pk-embed{margin-top:8px; border:1px solid var(--line-2); border-radius:10px; background:var(--panel-2); max-width:340px; overflow:hidden;}
.pk-embed-head{padding:7px 12px; background:rgba(255,255,255,.02); border-bottom:1px solid var(--line); display:flex; justify-content:space-between; font-size:10px; letter-spacing:.08em; color:var(--text-dim);}
.pk-embed-head .l{color:var(--text-mid); font-weight:600;}
.pk-embed-head .r{color:var(--red); font-weight:700; display:inline-flex; align-items:center; gap:6px;}
.pk-live-dot{width:6px;height:6px;border-radius:50%; background:var(--red); animation:pkPulseRed 1.4s infinite;}
.pk-embed-body{padding:14px; display:grid; grid-template-columns:1fr auto 1fr; gap:10px; align-items:center;}
.pk-team{display:flex; align-items:center; gap:10px;}
.pk-team.right{justify-content:flex-end;}
.pk-team-name{font-weight:700; font-size:14px; text-transform:uppercase; color:var(--text);}
.pk-team-logo{width:30px;height:30px;border-radius:6px; display:grid;place-items:center; font-size:11px; font-weight:700; color:#fff;}
.pk-team-logo.a{background:linear-gradient(135deg,#ff4655,#ff8a4c);}
.pk-team-logo.b{background:linear-gradient(135deg,#5b8cff,#9a6cff);}
.pk-score{font-weight:800; font-size:22px; display:flex; align-items:center; color:var(--text-mid);}
.pk-score .w{color:var(--green);}
.pk-score .sep{color:var(--text-faint); font-size:14px; margin:0 4px;}

/* Image embed */
.pk-img{margin-top:8px; border-radius:10px; border:1px solid var(--line); max-width:280px; aspect-ratio:16/10; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:6px; font-size:11px; color:var(--text-mid);
  background:
    radial-gradient(circle at 30% 30%, rgba(255,70,85,.25), transparent 50%),
    radial-gradient(circle at 70% 70%, rgba(91,140,255,.2), transparent 50%),
    linear-gradient(135deg,#1a1015,#221620);
}

/* Unread divider */
.pk-unread{margin:8px 12px; display:flex; align-items:center; gap:10px; font-size:10px; text-transform:uppercase; color:var(--red); font-weight:600; letter-spacing:.08em;}
.pk-unread::before,.pk-unread::after{content:""; flex:1; height:1px; background:var(--red); opacity:.4;}
.pk-unread span{background:var(--red); color:#fff; padding:2px 7px; border-radius:3px; font-size:9.5px; font-weight:600; box-shadow:0 0 12px rgba(255,70,85,.4);}

/* Typing */
.pk-typing{padding:6px 16px; display:flex; align-items:center; gap:8px; font-size:12px; color:var(--text-dim);}
.pk-typing b{color:var(--text-mid); font-weight:600;}
.pk-typing .dots{display:inline-flex; gap:3px;}
.pk-typing .dots span{width:4px;height:4px;border-radius:50%; background:var(--text-dim); animation:pkType 1.2s infinite;}
.pk-typing .dots span:nth-child(2){animation-delay:.15s;}
.pk-typing .dots span:nth-child(3){animation-delay:.3s;}

/* Composer */
.pk-composer{padding:10px 12px 12px; border-top:1px solid var(--line); background:var(--panel-2); position:relative;}
.pk-slash{position:absolute; left:12px; right:12px; bottom:calc(100% + 6px); z-index:5; background:var(--panel-3); border:1px solid var(--line-2); border-radius:10px; overflow:hidden; box-shadow:0 16px 40px -8px rgba(0,0,0,.6);}
.pk-slash-head{padding:8px 12px; font-size:10px; letter-spacing:.08em; color:var(--text-dim); border-bottom:1px solid var(--line); background:rgba(0,0,0,.2);}
.pk-slash-item{padding:9px 12px; display:flex; gap:10px; align-items:center; cursor:pointer;}
.pk-slash-item:hover,.pk-slash-item.active{background:rgba(255,70,85,.07);}
.pk-slash-cmd{font-size:12px; font-weight:600; color:var(--red);}
.pk-slash-desc{font-size:12.5px; color:var(--text-mid);}
.pk-slash-args{margin-left:auto; font-size:11px; color:var(--text-faint);}

.pk-input-wrap{display:flex; align-items:center; gap:6px; padding:6px 6px 6px 12px; background:var(--panel); border:1px solid var(--line-2); border-radius:10px; transition:border-color .15s;}
.pk-input-wrap:focus-within{border-color:rgba(255,70,85,.35);}
.pk-input-wrap input{flex:1; background:transparent; border:0; outline:0; font-size:14px; color:var(--text); font-family:inherit;}
.pk-input-wrap input::placeholder{color:var(--text-faint);}
.pk-counter{font-size:10.5px; color:var(--text-faint); min-width:42px; text-align:right;}
.pk-counter.warn{color:var(--amber);}
.pk-send{width:32px;height:32px;border-radius:7px; background:var(--red); color:#fff; border:0; display:grid; place-items:center; cursor:pointer; transition:all .15s;}
.pk-send:hover:not(:disabled){background:#ff5867; transform:scale(1.05); box-shadow:0 4px 12px -2px rgba(255,70,85,.5);}
.pk-send:disabled{background:rgba(255,255,255,.05); color:var(--text-faint); cursor:not-allowed;}
.pk-tool{width:28px;height:28px;border-radius:6px; background:transparent; border:0; color:var(--text-dim); display:grid;place-items:center; cursor:pointer;}
.pk-tool:hover{color:var(--text); background:rgba(255,255,255,.05);}
.pk-hint{margin-top:8px; display:flex; justify-content:space-between; padding:0 4px; font-size:10px; letter-spacing:.04em; color:var(--text-faint);}
.pk-hint kbd{font-size:9.5px; padding:1px 5px; border-radius:3px; background:rgba(255,255,255,.05); border:1px solid var(--line-2); color:var(--text-mid); font-family:'JetBrains Mono',monospace;}

@keyframes pkPulse{0%{box-shadow:0 0 0 0 rgba(34,201,139,.55);}100%{box-shadow:0 0 0 7px rgba(34,201,139,0);}}
@keyframes pkPulseRed{0%{box-shadow:0 0 0 0 rgba(255,70,85,.7);}100%{box-shadow:0 0 0 6px rgba(255,70,85,0);}}
@keyframes pkType{0%,60%,100%{opacity:.3; transform:translateY(0);} 30%{opacity:1; transform:translateY(-2px);}}
`;

/* ───────────────────────── Types & data ───────────────────────── */

type AvatarVariant = "default" | "alt-1" | "alt-2" | "alt-3" | "alt-4";
type Status = "on" | "away" | "dnd";
type BadgeKind = "founding" | "captain" | "admin";

type Reaction = { emoji: string; count: number; mine?: boolean };
type MatchEmbed = {
  kind: "match";
  game: string;
  live: string;
  teamA: { code: string; name: string; score: number; winner?: boolean; logoVariant: "a" | "b" };
  teamB: { code: string; name: string; score: number; winner?: boolean; logoVariant: "a" | "b" };
};
type ImageEmbed = { kind: "image"; filename: string; size: string };
type Embed = MatchEmbed | ImageEmbed;

type MsgItem = {
  type: "msg";
  author: string;
  role?: "admin" | "captain";
  avatar: { initials: string; variant: AvatarVariant; status: Status; captainRing?: boolean };
  verified?: boolean;
  badge?: { kind: BadgeKind; label: string };
  time: string;
  edited?: boolean;
  text: string;
  mentions?: string[];
  mentionsYou?: boolean;
  replyTo?: { author: string; preview: string };
  reactions?: Reaction[];
  embed?: Embed;
};
type Item =
  | { type: "date"; label: string }
  | { type: "system"; text: string; time: string }
  | { type: "unread"; label: string }
  | { type: "typing"; who: string }
  | MsgItem;

const SAMPLE_MESSAGES: Item[] = [
  { type: "date", label: "TODAY" },
  { type: "system", text: "Message removed by moderator", time: "2h" },
  {
    type: "msg",
    author: "Giuliano Seddio",
    avatar: { initials: "GS", variant: "default", status: "on" },
    verified: true,
    badge: { kind: "founding", label: "FOUNDING" },
    time: "2h",
    text: "yooooo 🔥 just signed our roster",
  },
  {
    type: "msg",
    author: "Marko",
    role: "admin",
    avatar: { initials: "MK", variant: "alt-1", status: "on" },
    badge: { kind: "admin", label: "ADMIN" },
    time: "1h",
    edited: true,
    text: "Quarterfinal #1 is live now — go support our founding teams 👇",
    embed: {
      kind: "match",
      game: "VALORANT · QF1 · BO3",
      live: "LIVE · MAP 2",
      teamA: { code: "NV", name: "Nova", score: 13, winner: true, logoVariant: "a" },
      teamB: { code: "AP", name: "Apex", score: 11, winner: false, logoVariant: "b" },
    },
    reactions: [
      { emoji: "🔥", count: 24, mine: true },
      { emoji: "👀", count: 11 },
      { emoji: "🫡", count: 7 },
    ],
  },
  {
    type: "msg",
    author: "Alex_VLR",
    role: "captain",
    avatar: { initials: "AL", variant: "alt-2", status: "on", captainRing: true },
    badge: { kind: "captain", label: "CAPTAIN" },
    time: "42m",
    replyTo: { author: "Marko", preview: "Quarterfinal #1 is live now — go support our…" },
    text: "roster locked, all 5 verified ✅ gl to @Nova",
    mentions: ["Nova"],
  },
  { type: "unread", label: "3 NEW" },
  {
    type: "msg",
    author: "Sara_R",
    avatar: { initials: "SR", variant: "alt-3", status: "away" },
    time: "12m",
    text: "just clipped this insane ace from map 1 🎯",
    embed: { kind: "image", filename: "ace-map1.png", size: "1.2 MB" },
  },
  {
    type: "msg",
    author: "Davide",
    avatar: { initials: "DV", variant: "alt-4", status: "on" },
    time: "3m",
    text: "hey @You are you still looking for a duelist? we have an open slot",
    mentionsYou: true,
  },
  {
    type: "msg",
    author: "You",
    avatar: { initials: "TU", variant: "default", status: "on" },
    time: "now",
    text: "yes! check my profile, dm'ing you the `/apply` link",
  },
  { type: "typing", who: "Davide" },
];

const SLASH_COMMANDS = [
  { cmd: "/team", desc: "Show or manage your team", args: "<name>" },
  { cmd: "/match", desc: "Embed a match scorecard", args: "<match_id>" },
  { cmd: "/report", desc: "Report a player to admins", args: "<user>" },
  { cmd: "/lfg", desc: "Post a Looking-For-Game request", args: "" },
];

const QUICK_EMOJIS = ["👍", "🔥", "❤️", "🫡", "😂"];

/* ───────────────────────── Sub-components ───────────────────────── */

function Avatar({ a }: { a: MsgItem["avatar"] }) {
  return (
    <div className="pk-avatar-wrap">
      <div className={`pk-avatar ${a.variant} ${a.captainRing ? "captain" : ""}`}>{a.initials}</div>
      <span className={`pk-status ${a.status}`} />
    </div>
  );
}

function renderText(text: string, mentionsYou?: boolean, mentions?: string[]) {
  // Replace @You and @Name + `code`
  const parts: (string | JSX.Element)[] = [];
  const regex = /(@[A-Za-z0-9_]+|`[^`]+`)/g;
  let last = 0;
  let i = 0;
  let m;
  while ((m = regex.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    const tok = m[0];
    if (tok.startsWith("`")) {
      parts.push(<code key={i++}>{tok.slice(1, -1)}</code>);
    } else {
      const name = tok.slice(1);
      const isYou = name === "You";
      const isMention = isYou || mentions?.includes(name);
      if (isMention) {
        parts.push(
          <span key={i++} className={`pk-mention ${isYou ? "you" : ""}`}>
            @{name}
          </span>
        );
      } else {
        parts.push(tok);
      }
    }
    last = m.index + tok.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

function MatchEmbedView({ e }: { e: MatchEmbed }) {
  return (
    <div className="pk-embed pk-font-mono">
      <div className="pk-embed-head">
        <span className="l">{e.game}</span>
        <span className="r">
          <span className="pk-live-dot" />
          {e.live}
        </span>
      </div>
      <div className="pk-embed-body" style={{ fontFamily: "Manrope, sans-serif" }}>
        <div className="pk-team">
          <div className={`pk-team-logo ${e.teamA.logoVariant}`}>{e.teamA.code}</div>
          <span className="pk-team-name pk-font-display">{e.teamA.name}</span>
        </div>
        <div className="pk-score pk-font-display">
          <span className={e.teamA.winner ? "w" : ""}>{e.teamA.score}</span>
          <span className="sep">:</span>
          <span className={e.teamB.winner ? "w" : ""}>{e.teamB.score}</span>
        </div>
        <div className="pk-team right">
          <span className="pk-team-name pk-font-display">{e.teamB.name}</span>
          <div className={`pk-team-logo ${e.teamB.logoVariant}`}>{e.teamB.code}</div>
        </div>
      </div>
    </div>
  );
}

function ImageEmbedView({ e }: { e: ImageEmbed }) {
  return (
    <div className="pk-img pk-font-mono">
      <ImageIcon size={12} /> {e.filename} · {e.size}
    </div>
  );
}

function ReactionsBar({ r }: { r: Reaction[] }) {
  return (
    <div className="pk-reactions">
      {r.map((rx, i) => (
        <button
          key={i}
          className={`pk-reaction ${rx.mine ? "mine" : ""}`}
          onClick={() => console.log("react", rx.emoji)}
        >
          <span className="e">{rx.emoji}</span>
          <span className="c pk-font-mono">{rx.count}</span>
        </button>
      ))}
      <button className="pk-react-add" onClick={() => console.log("add reaction")}>
        <SmilePlus size={12} />
      </button>
    </div>
  );
}

function MessageActions() {
  return (
    <div className="pk-actions">
      {QUICK_EMOJIS.map((e) => (
        <button key={e} className="pk-emoji-btn" onClick={() => console.log("react", e)}>
          {e}
        </button>
      ))}
      <span className="pk-act-divider" />
      <button className="pk-act-btn" onClick={() => console.log("reply")}>
        <CornerUpLeft size={14} />
      </button>
      <button className="pk-act-btn" onClick={() => console.log("more")}>
        <MoreHorizontal size={14} />
      </button>
    </div>
  );
}

function MessageRow({ m, grouped }: { m: MsgItem; grouped: boolean }) {
  return (
    <div className={`pk-msg ${grouped ? "grouped" : ""} ${m.mentionsYou ? "mention-you" : ""}`}>
      <MessageActions />
      {grouped && <span className="pk-ghost-time pk-font-mono">{m.time}</span>}
      <Avatar a={m.avatar} />
      <div>
        <div className="pk-head">
          <span className={`pk-author ${m.role || ""}`}>{m.author}</span>
          {m.verified && <BadgeCheck size={13} color="#5b8cff" />}
          {m.badge && (
            <span className={`pk-badge ${m.badge.kind} pk-font-mono`}>
              {m.badge.kind === "founding" && <Star size={9} />}
              {m.badge.label}
            </span>
          )}
          <span className="pk-time pk-font-mono">
            {m.time} {m.edited && <i>(edited)</i>}
          </span>
        </div>
        {m.replyTo && (
          <div className="pk-reply">
            <CornerUpLeft size={11} color="#4a4146" />
            <span className="a">{m.replyTo.author}</span>
            <span className="p">{m.replyTo.preview}</span>
          </div>
        )}
        <div className="pk-text">{renderText(m.text, m.mentionsYou, m.mentions)}</div>
        {m.embed?.kind === "match" && <MatchEmbedView e={m.embed} />}
        {m.embed?.kind === "image" && <ImageEmbedView e={m.embed} />}
        {m.reactions && <ReactionsBar r={m.reactions} />}
      </div>
    </div>
  );
}

function TypingIndicator({ who }: { who: string }) {
  return (
    <div className="pk-typing">
      <b>{who}</b> is typing
      <span className="dots">
        <span />
        <span />
        <span />
      </span>
    </div>
  );
}

/* ───────────────────────── Main component ───────────────────────── */

export default function PeakChat() {
  const [tab, setTab] = useState<"global" | "team">("global");
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState<Item[]>(SAMPLE_MESSAGES);
  const scrollRef = useRef<HTMLDivElement>(null);

  const showSlash = inputValue.startsWith("/");
  const len = inputValue.length;
  const canSend = inputValue.trim().length > 0;

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const send = () => {
    if (!canSend) return;
    const next: MsgItem = {
      type: "msg",
      author: "You",
      avatar: { initials: "TU", variant: "default", status: "on" },
      time: "now",
      text: inputValue,
    };
    // Insert before trailing typing indicator if present
    setMessages((prev) => {
      const last = prev[prev.length - 1];
      if (last && last.type === "typing") {
        return [...prev.slice(0, -1), next, last];
      }
      return [...prev, next];
    });
    setInputValue("");
  };

  // Group consecutive messages from the same author
  const rendered = useMemo(() => {
    const out: { item: Item; grouped: boolean }[] = [];
    for (let i = 0; i < messages.length; i++) {
      const cur = messages[i];
      const prev = messages[i - 1];
      const grouped =
        cur.type === "msg" && prev && prev.type === "msg" && prev.author === cur.author;
      out.push({ item: cur, grouped: !!grouped });
    }
    return out;
  }, [messages]);

  return (
    <div className="pk-root">
      <style>{PEAK_CSS}</style>
      <div className="pk-panel">
        {/* Header */}
        <div className="pk-header">
          <div className="pk-row" style={{ marginBottom: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div className="pk-logo">▲</div>
              <span className="pk-title pk-font-display">PeakGG Chat</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span className="pk-online pk-font-mono">
                <span className="dot" />
                247 online
              </span>
              <button className="pk-iconbtn" aria-label="Search">
                <Search size={15} />
              </button>
              <button className="pk-iconbtn" aria-label="Close">
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
              className={`pk-tab ${tab === "global" ? "active" : ""}`}
              onClick={() => setTab("global")}
            >
              <Globe size={13} />
              Global
              <span className="pk-count pk-font-mono">247</span>
            </button>
            <button
              className={`pk-tab ${tab === "team" ? "active" : ""}`}
              onClick={() => setTab("team")}
            >
              <Users size={13} />
              Team
              <span className="pk-count pk-font-mono">5</span>
              <span className="pk-notif" />
            </button>
          </div>
        </div>

        {/* Pinned */}
        <div className="pk-pinned">
          <Pin size={13} color="#ff4655" style={{ marginTop: 3, flexShrink: 0 }} />
          <span>
            Welcome to <b>PeakGG Season 0 Beta</b>. Find teams, ask questions, and{" "}
            <a href="#" onClick={(e) => e.preventDefault()}>
              join the Discord →
            </a>
          </span>
        </div>

        {/* Messages */}
        <div className="pk-messages" ref={scrollRef}>
          {rendered.map(({ item, grouped }, idx) => {
            if (item.type === "date") {
              return (
                <div className="pk-date-wrap" key={idx}>
                  <span className="pk-date pk-font-mono">{item.label}</span>
                </div>
              );
            }
            if (item.type === "system") {
              return (
                <div className="pk-system" key={idx}>
                  <AlertTriangle size={12} color="#ffb454" />
                  <span>{item.text}</span>
                  <span className="time pk-font-mono">{item.time}</span>
                </div>
              );
            }
            if (item.type === "unread") {
              return (
                <div className="pk-unread pk-font-mono" key={idx}>
                  <span>{item.label}</span>
                </div>
              );
            }
            if (item.type === "typing") {
              return <TypingIndicator key={idx} who={item.who} />;
            }
            return <MessageRow key={idx} m={item} grouped={grouped} />;
          })}
        </div>

        {/* Composer */}
        <div className="pk-composer">
          {showSlash && (
            <div className="pk-slash">
              <div className="pk-slash-head pk-font-mono">COMMANDS</div>
              {SLASH_COMMANDS.map((c, i) => (
                <div
                  key={c.cmd}
                  className={`pk-slash-item ${i === 0 ? "active" : ""}`}
                  onClick={() => setInputValue(c.cmd + " ")}
                >
                  <span className="pk-slash-cmd pk-font-mono">{c.cmd}</span>
                  <span className="pk-slash-desc">{c.desc}</span>
                  {c.args && <span className="pk-slash-args pk-font-mono">{c.args}</span>}
                </div>
              ))}
            </div>
          )}
          <div className="pk-input-wrap">
            <button className="pk-tool" aria-label="Attach">
              <Paperclip size={15} />
            </button>
            <button className="pk-tool" aria-label="Emoji">
              <Smile size={15} />
            </button>
            <input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value.slice(0, 200))}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder="Message PeakGG…  Type / for commands"
              maxLength={200}
            />
            <span className={`pk-counter pk-font-mono ${len > 170 ? "warn" : ""}`}>
              {len}/200
            </span>
            <button className="pk-send" disabled={!canSend} onClick={send} aria-label="Send">
              <Send size={14} />
            </button>
          </div>
          <div className="pk-hint pk-font-mono">
            <span>
              Markdown · <kbd>@</kbd> mention · <kbd>/</kbd> commands
            </span>
            <span>
              <kbd>↵</kbd> send · <kbd>⇧</kbd>+<kbd>↵</kbd> new line
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
import { useState } from "react";
// GearsNL dashboard
import { CalendarBlock } from "./components/CalendarBlock";
import { TodoBlock } from "./components/TodoBlock";
import { MembersModal } from "./components/MembersModal";
import { IcicleChart } from "./components/IcicleChart";
import { FilesBlock } from "./components/FilesBlock";
import { BUDGET, NOTIFICATIONS, DEPARTMENTS, DEPT_COLORS, SUBTEAMS } from "./data";
import type { AppNotification } from "./types";

// ─── Notifications block ──────────────────────────────────────────────────────
const NOTIF_TYPE_COLOR: Record<AppNotification["type"], string> = {
  order: "#FFD142", member: "#F0684D", event: "#60a5fa", todo: "#a78bfa", budget: "#F0684D",
};

function NotificationsBlock() {
  const [notifs, setNotifs] = useState<AppNotification[]>(NOTIFICATIONS);
  const markRead = (id: string) => setNotifs(p => p.map(n => n.id === id ? { ...n, read: true } : n));
  const unread = notifs.filter(n => !n.read).length;
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-2 shrink-0">
        <h2 className="text-sm font-semibold text-[#FFEDD1]">Notifications</h2>
        {unread > 0 && (
          <span className="px-1.5 py-0.5 rounded-full bg-[#F0684D]/20 text-[#F0684D] text-[9px] font-bold">{unread} new</span>
        )}
      </div>
      <div className="flex-1 overflow-auto space-y-1.5 min-h-0">
        {notifs.map(n => (
          <button key={n.id} onClick={() => markRead(n.id)}
            className={`w-full text-left flex items-start gap-2.5 p-2.5 rounded-xl border transition-all ${
              n.read ? "bg-[#232120] border-[#3D3330] opacity-60" : "bg-[#2A2724] border-[#3D3330] hover:border-[#4A3F38]"
            }`}>
            <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: n.read ? "#3D3330" : NOTIF_TYPE_COLOR[n.type] }} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-[#FFEDD1] truncate">{n.title}</span>
                <span className="text-[9px] text-[#7A6555] shrink-0">{n.time}</span>
              </div>
              <p className="text-[10px] text-[#9C8272] mt-0.5 leading-snug">{n.body}</p>
            </div>
          </button>
        ))}
        {notifs.length === 0 && (
          <div className="flex flex-col items-center justify-center h-32 text-[#7A6555] text-sm gap-2">
            <span className="text-3xl font-thin text-[#4A3F38]">—</span>
            <span>All clear</span>
          </div>
        )}
      </div>
    </div>
  );
}

const ORGS = ["GearsNL", "GearsNL B-team", "GearsNL Alumni"];

function SubteamsNav() {
  const [open, setOpen] = useState(false);
  const [openDept, setOpenDept] = useState<string | null>(null);
  return (
    <div>
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs transition-all text-left text-[#9C8272] hover:text-[#FFEDD1] hover:bg-white/5">
        <span className="text-[8px] transition-transform duration-150" style={{ transform: open ? "rotate(90deg)" : "none" }}>▶</span>
        <span>Subteams</span>
      </button>
      {open && (
        <div className="pl-3 space-y-0.5">
          {DEPARTMENTS.map(dept => (
            <div key={dept}>
              <button onClick={() => setOpenDept(d => d === dept ? null : dept)}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] transition-all text-left text-[#9C8272] hover:text-[#FFEDD1] hover:bg-white/5">
                <span className="w-1.5 h-1.5 rounded-sm shrink-0" style={{ background: DEPT_COLORS[dept] }} />
                <span className="flex-1">{dept}</span>
                <span className="text-[8px] opacity-50">{openDept === dept ? "▲" : "▼"}</span>
              </button>
              {openDept === dept && (
                <div className="pl-4 space-y-0.5">
                  {(SUBTEAMS[dept] ?? []).map(sub => (
                    <button key={sub} className="w-full flex items-center gap-2 px-2.5 py-1 rounded-lg text-[10px] text-[#7A6555] hover:text-[#C4A882] hover:bg-white/5 transition-colors text-left">
                      <span className="w-px h-3 shrink-0" style={{ background: DEPT_COLORS[dept] + "60" }} />
                      {sub}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Sidebar ───────────────────────────────────────────────────────────────────
function Sidebar({ onManageMembers }: { onManageMembers: () => void }) {
  const [org, setOrg] = useState("GearsNL");
  const [orgOpen, setOrgOpen] = useState(false);

  return (
    <aside className="w-52 shrink-0 flex flex-col border-r border-[#FFEDD1]/10 bg-[#141212] h-full">
      {/* Org dropdown */}
      <div className="p-3 border-b border-white/8 relative">
        <button onClick={() => setOrgOpen(o => !o)}
          className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors group">
          <div className="w-7 h-7 rounded-lg bg-[#F0684D] flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-[10px]">{org[0]}</span>
          </div>
          <span className="flex-1 text-[#FFEDD1] font-semibold text-xs tracking-wide truncate text-left">{org}</span>
          <span className="text-[#7A6555] text-[9px] shrink-0">{orgOpen ? "▲" : "▼"}</span>
        </button>
        {orgOpen && (
          <div className="absolute left-3 right-3 top-full mt-1 z-50 rounded-xl border border-[#3D3330] bg-[#232120] shadow-xl overflow-hidden">
            {ORGS.map(o => (
              <button key={o} onClick={() => { setOrg(o); setOrgOpen(false); }}
                className={`w-full px-3 py-2 text-xs text-left transition-colors ${o === org ? "text-[#F0684D] bg-[#F0684D]/10" : "text-[#C4A882] hover:bg-white/5 hover:text-[#FFEDD1]"}`}>
                {o}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-auto p-3 space-y-0.5">
        <div className="text-[9px] font-semibold text-[#9C8272] uppercase tracking-widest px-2 mb-2 mt-1">Navigation</div>
        <button className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs transition-all text-left bg-[#F0684D]/20 text-[#F0684D]">
          <span className="w-1 h-1 rounded-full shrink-0 bg-[#F0684D]" />
          <span>Dashboard</span>
        </button>
        <div className="pt-1 space-y-0.5">
          <SubteamsNav />
          <button onClick={onManageMembers}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs transition-all text-left text-[#9C8272] hover:text-[#FFEDD1] hover:bg-white/5">
            <span className="w-1 h-1 rounded-full shrink-0 bg-[#9C8272]/50" />
            <span>Manage members</span>
          </button>
          <button className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs transition-all text-left text-[#9C8272] hover:text-[#FFEDD1] hover:bg-white/5">
            <span className="w-1 h-1 rounded-full shrink-0 bg-[#9C8272]/50" />
            <span>Manage orders</span>
          </button>
        </div>
      </nav>

      {/* User */}
      <div className="p-3 border-t border-white/8">
        <div className="flex items-center gap-2 py-1">
          <div className="w-7 h-7 rounded-full bg-[#F0684D] flex items-center justify-center text-white text-xs font-bold shrink-0">A</div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-[#FFEDD1] truncate">Admin user</div>
            <div className="text-[10px] text-[#9C8272] truncate">board@gearsnl.org</div>
          </div>
        </div>
      </div>
    </aside>
  );
}

// ─── Header ────────────────────────────────────────────────────────────────────
function Header() {
  return (
    <header className="shrink-0 flex items-center justify-between px-5 py-2.5 border-b border-white/8 bg-[#141212]">
      <h1 className="text-base font-semibold text-[#FFEDD1] tracking-wide">Member Dashboard</h1>
      <div className="flex items-center gap-1.5">
        {(["Settings", "Logout"] as const).map(label => (
          <button key={label}
            className="px-2.5 py-1.5 rounded-lg border border-white/10 bg-white/5 text-xs text-[#9C8272] hover:text-[#FFEDD1] hover:border-white/20 transition-all">
            {label}
          </button>
        ))}
      </div>
    </header>
  );
}

// ─── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [showMembers, setShowMembers] = useState(false);

  return (
    <div className="flex h-full bg-[#1A1919] overflow-hidden" style={{ fontFamily: "'Inter',sans-serif" }}>
      <Sidebar onManageMembers={() => setShowMembers(true)} />
      <div className="flex flex-col flex-1 min-w-0 h-full">
        <Header />
        <main className="flex-1 overflow-hidden p-4 min-h-0 flex flex-col gap-3">
          <IcicleChart data={BUDGET} />
          <div className="grid grid-cols-2 grid-rows-2 gap-3 flex-1 min-h-0">
            <div className="rounded-2xl border border-[#3D3330] bg-[#232120] p-3 overflow-hidden flex flex-col">
              <CalendarBlock />
            </div>
            <div className="rounded-2xl border border-[#3D3330] bg-[#232120] p-3 overflow-hidden flex flex-col">
              <NotificationsBlock />
            </div>
            <div className="rounded-2xl border border-[#3D3330] bg-[#232120] p-3 overflow-hidden flex flex-col">
              <h2 className="text-sm font-semibold text-[#FFEDD1] mb-2 shrink-0">Todo</h2>
              <TodoBlock />
            </div>
            <div className="rounded-2xl border border-[#3D3330] bg-[#232120] p-3 overflow-hidden flex flex-col">
              <FilesBlock />
            </div>
          </div>
        </main>
      </div>
      {showMembers && <MembersModal currentTeam="Board" onClose={() => setShowMembers(false)} />}
    </div>
  );
}

import { useState, useRef } from "react";
import type { Member } from "../types";
import { MEMBERS, DEPARTMENTS, avatarBg, memberIdx } from "../data";
import { ModalShell, ModalHeader, Inp, Sel } from "./shared";

// ─── Sub-modals ───────────────────────────────────────────────────────────────

function StrikeModal({ member, onClose }: { member: Member; onClose: () => void }) {
  const [comment, setComment] = useState("");
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="animate-slide-up w-full max-w-sm rounded-2xl border border-[#3D3330] bg-[#2A2724] shadow-2xl p-5" onClick={e=>e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-[#FFEDD1]">Issue Strike</h3>
            <p className="text-xs text-[#7A6555]">{member.name}</p>
          </div>
          <button onClick={onClose} className="text-[#C4A882] hover:text-[#FFEDD1]">✕</button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-[#C4A882] mb-1 block">Comment</label>
            <textarea value={comment} onChange={e=>setComment(e.target.value)} rows={3}
              placeholder="Reason for strike…"
              className="w-full bg-[#232120] border border-[#3D3330] rounded-lg px-3 py-2 text-sm text-[#FFEDD1] placeholder:text-[#7A6555] focus:outline-none focus:border-[#F0684D] resize-none" />
          </div>
          <div>
            <label className="text-xs text-[#C4A882] mb-1 block">Attach file (optional)</label>
            <div
              className={`rounded-xl border-2 border-dashed px-3 py-3 text-center cursor-pointer transition-colors ${dragOver ? "border-[#F0684D] bg-[#F0684D]/8" : "border-[#3D3330] hover:border-[#7A6555]"}`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) setAttachedFile(f); }}>
              <input ref={fileInputRef} type="file" className="hidden" onChange={e => { if (e.target.files?.[0]) setAttachedFile(e.target.files[0]); }} />
              {attachedFile ? (
                <div className="flex items-center justify-center gap-2">
                  <span className="text-xs text-[#FFEDD1] truncate max-w-[180px]">{attachedFile.name}</span>
                  <button className="text-[#7A6555] hover:text-[#F0684D] text-xs" onClick={e => { e.stopPropagation(); setAttachedFile(null); }}>✕</button>
                </div>
              ) : (
                <span className="text-[10px] text-[#7A6555]">Drop file or click to browse</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <button onClick={onClose} className="flex-1 py-2 rounded-xl text-sm bg-[#232120] border border-[#3D3330] text-[#FFEDD1] hover:bg-[#2E2B2A] transition-colors">Cancel</button>
          <button onClick={onClose} className="flex-1 py-2 rounded-xl text-sm bg-rose-600 text-white hover:bg-rose-700 transition-colors font-medium">Issue Strike</button>
        </div>
      </div>
    </div>
  );
}

function RemoveModal({ member, onClose }: { member: Member; onClose: () => void }) {
  const [pw, setPw] = useState("");
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="animate-slide-up w-full max-w-xs rounded-2xl border border-[#3D3330] bg-white shadow-2xl p-5" onClick={e=>e.stopPropagation()}>
        <div className="mb-4">
          <h3 className="font-semibold text-[#FFEDD1]">Remove Member</h3>
          <p className="text-xs text-[#7A6555] mt-0.5">This action cannot be undone. Enter your password to confirm.</p>
        </div>
        <div className="flex items-center gap-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 mb-4">
          <span className={`w-9 h-9 rounded-full ${avatarBg(memberIdx(member.id))} text-white text-sm font-bold flex items-center justify-center shrink-0`}>{member.avatar}</span>
          <div>
            <div className="text-sm font-medium text-[#FFEDD1]">{member.name}</div>
            <div className="text-xs text-[#7A6555]">{member.team} · {member.role}</div>
          </div>
        </div>
        <Inp value={pw} onChange={setPw} type="password" placeholder="Enter password…" className="mb-3" />
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2 rounded-xl text-sm bg-[#232120] border border-[#3D3330] text-[#FFEDD1] hover:bg-[#2E2B2A] transition-colors">Cancel</button>
          <button onClick={onClose} className="flex-1 py-2 rounded-xl text-sm bg-rose-600 text-white hover:bg-rose-700 transition-colors font-medium">Remove</button>
        </div>
      </div>
    </div>
  );
}

// ─── Invite Members tab ───────────────────────────────────────────────────────

type InviteState = Record<string, "invite"|"pending"|"declined">;

function InviteTab({ currentTeam }: { currentTeam: string }) {
  const [q, setQ] = useState("");
  const [states, setStates] = useState<InviteState>({});
  const [hovered, setHovered] = useState<string|null>(null);

  const outside = MEMBERS.filter(m =>
    m.team !== currentTeam &&
    m.name.toLowerCase().includes(q.toLowerCase())
  );

  const statusCls = (s?: InviteState[string]) => {
    if (!s || s==="invite") return "bg-[#F0684D]/20 text-[#F0684D] border-[#F0684D]/40";
    if (s==="pending") return "bg-amber-500/20 text-amber-400 border-amber-500/40";
    return "bg-rose-500/20 text-rose-400 border-rose-500/40";
  };

  const invite = (id: string) => setStates(p => ({ ...p, [id]:"pending" }));

  return (
    <div className="flex flex-col h-full">
      <Inp value={q} onChange={setQ} placeholder="Search members outside your team…" className="mb-3" />
      <div className="flex-1 overflow-auto space-y-1.5 min-h-0">
        {outside.map((m,i) => {
          const st = states[m.id];
          const isDeclined = st==="declined";
          const isHovered = hovered===m.id;
          return (
            <div key={m.id} className="flex items-center gap-3 p-3 rounded-xl bg-[#232120] border border-[#3D3330]">
              <div className={`w-9 h-9 rounded-full ${avatarBg(MEMBERS.indexOf(m))} flex items-center justify-center text-white text-sm font-bold shrink-0`}>{m.avatar}</div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-[#FFEDD1] truncate">{m.name}</div>
                <div className="text-xs text-[#7A6555]">{m.team} · {m.role}</div>
              </div>
              <button
                onClick={() => { if (!st || st==="invite" || isDeclined) invite(m.id); else if (st==="pending") setStates(p=>({...p,[m.id]:"declined"})); }}
                onMouseEnter={() => setHovered(m.id)}
                onMouseLeave={() => setHovered(null)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  isDeclined && isHovered ? "bg-[#F0684D]/20 text-[#F0684D] border-[#F0684D]/40" : statusCls(st)
                }`}>
                {isDeclined && isHovered ? "Invite" : (st ? { invite:"Invite", pending:"Pending", declined:"Declined" }[st] : "Invite")}
              </button>
            </div>
          );
        })}
        {outside.length===0 && (
          <div className="text-center text-[#7A6555] text-sm py-8">No members found outside your team</div>
        )}
      </div>
    </div>
  );
}

// ─── Manage Members tab ───────────────────────────────────────────────────────

function ManageTab({ currentTeam }: { currentTeam: string }) {
  const [q, setQ] = useState("");
  const [strikeTarget, setStrikeTarget] = useState<Member|null>(null);
  const [removeTarget, setRemoveTarget] = useState<Member|null>(null);
  const [depts, setDepts] = useState<Record<string,string>>({});

  const team = MEMBERS.filter(m =>
    m.team===currentTeam &&
    m.name.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full">
      <Inp value={q} onChange={setQ} placeholder="Search team members…" className="mb-3" />
      <div className="flex-1 overflow-auto space-y-2 min-h-0">
        {team.map((m,i) => (
          <div key={m.id} className="p-3 rounded-xl bg-[#232120] border border-[#3D3330] space-y-2.5">
            <div className="flex items-center gap-2.5">
              <div className={`w-9 h-9 rounded-full ${avatarBg(MEMBERS.indexOf(m))} flex items-center justify-center text-white text-sm font-bold shrink-0 relative`}>
                {m.avatar}
                {m.isSubLead && <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-amber-400 border-2 border-[#252d3d] flex items-center justify-center text-[7px] font-bold text-black">★</span>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-[#FFEDD1] flex items-center gap-1.5">
                  {m.name}
                  {m.strikes>0 && <span className="text-[10px] text-rose-400 font-semibold">⚡{m.strikes}</span>}
                </div>
                <div className="text-xs text-[#7A6555]">{m.role}</div>
              </div>
              <span className={`w-2 h-2 rounded-full ${m.status==="active"?"bg-emerald-400":"bg-[#4a5568]"}`} />
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {/* Department */}
              <select value={depts[m.id]??m.department}
                onChange={e=>setDepts(p=>({...p,[m.id]:e.target.value}))}
                className="px-2 py-1 rounded-lg text-[10px] bg-white border border-[#3D3330] text-[#C4A882] focus:outline-none focus:border-[#F0684D] transition-colors cursor-pointer">
                {DEPARTMENTS.map(d=><option key={d} value={d}>{d}</option>)}
              </select>
              {/* Sub-lead */}
              <button className="px-2.5 py-1 rounded-lg text-[10px] font-medium bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30 transition-colors">
                {m.isSubLead ? "★ Sub-lead" : "Make sub-lead"}
              </button>
              {/* Strike */}
              <button onClick={()=>setStrikeTarget(m)}
                className="px-2.5 py-1 rounded-lg text-[10px] font-medium bg-orange-500/20 text-orange-400 border border-orange-500/30 hover:bg-orange-500/30 transition-colors">
                ⚡ Strike
              </button>
              {/* Remove */}
              <button onClick={()=>setRemoveTarget(m)}
                className="px-2.5 py-1 rounded-lg text-[10px] font-medium bg-rose-500/20 text-rose-400 border border-rose-500/30 hover:bg-rose-500/30 transition-colors">
                🗑 Remove
              </button>
            </div>
          </div>
        ))}
        {team.length===0 && <div className="text-center text-[#7A6555] text-sm py-8">No members found</div>}
      </div>
      {strikeTarget && <StrikeModal member={strikeTarget} onClose={()=>setStrikeTarget(null)} />}
      {removeTarget && <RemoveModal member={removeTarget} onClose={()=>setRemoveTarget(null)} />}
    </div>
  );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────

export function MembersModal({ currentTeam, onClose }: { currentTeam: string; onClose: () => void }) {
  const [tab, setTab] = useState<"invite"|"manage">("invite");

  return (
    <ModalShell onClose={onClose} width="max-w-lg">
      <ModalHeader title="Members" sub={`Current team: ${currentTeam}`} onClose={onClose} />
      {/* Tab toggle */}
      <div className="flex gap-1.5 p-4 pb-0 shrink-0">
        <button onClick={()=>setTab("invite")}
          className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all ${tab==="invite"?"bg-[#F0684D] border-[#F0684D] text-white":"bg-[#232120] border-[#3D3330] text-[#C4A882] hover:text-[#FFEDD1]"}`}>
          Invite Members
        </button>
        <button onClick={()=>setTab("manage")}
          className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all ${tab==="manage"?"bg-[#F0684D] border-[#F0684D] text-white":"bg-[#232120] border-[#3D3330] text-[#C4A882] hover:text-[#FFEDD1]"}`}>
          Manage Members
        </button>
      </div>
      <div className="flex-1 overflow-hidden p-4 flex flex-col min-h-0">
        {tab==="invite"
          ? <InviteTab currentTeam={currentTeam} />
          : <ManageTab currentTeam={currentTeam} />
        }
      </div>
    </ModalShell>
  );
}

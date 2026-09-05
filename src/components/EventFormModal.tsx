import { useState } from "react";
import type { CalEvent, MemberInvite, InviteStatus, DiscussionPoint, VoteGroup } from "../types";
import { MEMBERS, FILES, DEPARTMENTS, formatDate, parseDate, avatarBg, memberIdx } from "../data";
import { ModalShell, ModalHeader, Inp, Sel, Field } from "./shared";
import { MiniCalPicker } from "./MiniCalPicker";

const TYPE_COLOR: Record<CalEvent["type"], string> = { event:"#10b981", meeting:"#4f6ef7" };
const STATUS_CLS: Record<InviteStatus, string> = {
  accepted: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
  pending:  "bg-amber-500/20  text-amber-400  border-amber-500/40",
  declined: "bg-rose-500/20   text-rose-400   border-rose-500/40",
};

interface Props { initial?: CalEvent; onSave:(ev:CalEvent)=>void; onClose:()=>void; }

export function EventFormModal({ initial, onSave, onClose }: Props) {
  const today = formatDate(new Date());
  const blank: CalEvent = {
    id: Date.now().toString(), title:"", type:"event",
    date:today, startTime:"10:00", endDate:today, endTime:"11:00",
    color:"#10b981", description:"", location:"",
    invitees:[], sendMail:false, linkedFiles:[], localFiles:[], repeat:null, discussionPoints:[],
  };
  const [ev, setEv] = useState<CalEvent>(initial ?? blank);
  const [mSearch, setMSearch] = useState("");
  const [showStartCal, setShowStartCal] = useState(false);
  const [showEndCal, setShowEndCal] = useState(false);
  const [activeInvMenu, setActiveInvMenu] = useState<string|null>(null);
  const [dpVoteSearch, setDpVoteSearch] = useState<Record<string,string>>({});
  const [fileSearch, setFileSearch] = useState("");
  const [fileDragActive, setFileDragActive] = useState(false);

  const set = (patch: Partial<CalEvent>) => setEv(p => ({ ...p, ...patch }));

  // ─ Type
  const changeType = (type: CalEvent["type"]) => set({ type, color: TYPE_COLOR[type] });

  // ─ Invitees
  const addInvitee = (id: string) => {
    if (ev.invitees.find(i => i.memberId === id)) return;
    set({ invitees:[...ev.invitees, { memberId:id, status:"pending" }] });
  };
  const removeInvitee = (id: string) => set({ invitees: ev.invitees.filter(i => i.memberId !== id) });
  const setStatus = (id: string, status: InviteStatus) => {
    set({ invitees: ev.invitees.map(i => i.memberId===id ? {...i,status} : i) });
    setActiveInvMenu(null);
  };
  const addByDept = (dept: string) => {
    const toAdd = MEMBERS.filter(m => m.department===dept && !ev.invitees.find(i=>i.memberId===m.id));
    set({ invitees:[...ev.invitees, ...toAdd.map(m=>({ memberId:m.id, status:"pending" as InviteStatus }))] });
  };

  const filteredM = MEMBERS.filter(m =>
    !ev.invitees.find(i=>i.memberId===m.id) &&
    m.name.toLowerCase().includes(mSearch.toLowerCase())
  );

  // ─ Discussion points
  const addDp = () => set({ discussionPoints:[...ev.discussionPoints, {
    id:Date.now().toString(), title:"", notes:"", votingEnabled:false, votes:{ for:[], against:[], abstain:[] }
  }]});

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault(); setFileDragActive(false);
    Array.from(e.dataTransfer.files).forEach(f=>{
      if (!ev.localFiles.includes(f.name)) set({localFiles:[...ev.localFiles, f.name]});
    });
  };
  const removeDp = (id:string) => set({ discussionPoints: ev.discussionPoints.filter(d=>d.id!==id) });
  const updateDp = (id:string, patch:Partial<DiscussionPoint>) =>
    set({ discussionPoints: ev.discussionPoints.map(d=>d.id===id?{...d,...patch}:d) });
  const addVote = (dpId:string, mId:string, g:keyof VoteGroup) =>
    set({ discussionPoints: ev.discussionPoints.map(dp => {
      if (dp.id!==dpId) return dp;
      const v = { for:[...dp.votes.for], against:[...dp.votes.against], abstain:[...dp.votes.abstain] };
      v.for=v.for.filter(x=>x!==mId); v.against=v.against.filter(x=>x!==mId); v.abstain=v.abstain.filter(x=>x!==mId);
      v[g]=[...v[g],mId];
      return { ...dp, votes:v };
    })});
  const removeVote = (dpId:string, mId:string, g:keyof VoteGroup) =>
    set({ discussionPoints: ev.discussionPoints.map(dp =>
      dp.id===dpId ? { ...dp, votes:{ ...dp.votes, [g]:dp.votes[g].filter(x=>x!==mId) } } : dp
    )});

  const fmtDate = (s:string) => {
    if (!s) return "Select date";
    const d = parseDate(s);
    return d.toLocaleDateString("en-GB",{ weekday:"short", day:"numeric", month:"short" });
  };

  return (
    <ModalShell onClose={onClose} width="max-w-2xl">
      <ModalHeader title={initial ? "Edit Event" : "New Event"} onClose={onClose} />

      <div className="flex-1 overflow-auto p-5 space-y-5">

        {/* Type toggle */}
        <div className="flex gap-2">
          {(["event","meeting"] as const).map(t => (
            <button key={t} onClick={() => changeType(t)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all ${ev.type===t ? "text-white border-transparent" : "bg-[#232120] border-[#3D3330] text-[#C4A882] hover:text-[#FFEDD1]"}`}
              style={ev.type===t ? { background:TYPE_COLOR[t] } : {}}>
              {t==="event" ? "📅 Event" : "🗓 Meeting"}
            </button>
          ))}
        </div>

        {/* Title + Location */}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Title">
            <Inp value={ev.title} onChange={v=>set({title:v})} placeholder="Title…" />
          </Field>
          <Field label="Location">
            <Inp value={ev.location} onChange={v=>set({location:v})} placeholder="Room, link…" />
          </Field>
        </div>

        <Field label="Description">
          <textarea value={ev.description} onChange={e=>set({description:e.target.value})} rows={2}
            placeholder="Description…"
            className="w-full bg-[#232120] border border-[#3D3330] rounded-lg px-3 py-2 text-sm text-[#FFEDD1] placeholder:text-[#7A6555] focus:outline-none focus:border-[#F0684D] resize-none" />
        </Field>

        {/* Date / Time picker */}
        <div className="rounded-xl bg-[#232120] border border-[#3D3330] p-3 space-y-2.5">
          <div className="text-xs font-semibold text-[#C4A882] uppercase tracking-wider">Date & Time</div>
          {/* Starts */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#7A6555] w-10 shrink-0">Starts</span>
            <div className="relative flex-1">
              <button onClick={()=>{setShowStartCal(!showStartCal);setShowEndCal(false);}}
                className="w-full text-left px-3 py-1.5 rounded-lg bg-white border border-[#3D3330] text-sm text-[#FFEDD1] hover:border-[#F0684D]/40 transition-colors">
                {fmtDate(ev.date)}
              </button>
              {showStartCal && (
                <MiniCalPicker value={ev.date} onChange={v=>{set({date:v});setShowStartCal(false);}} onClose={()=>setShowStartCal(false)} />
              )}
            </div>
            <input type="time" value={ev.startTime} onChange={e=>set({startTime:e.target.value})}
              className="px-2 py-1.5 rounded-lg bg-white border border-[#3D3330] text-sm text-[#FFEDD1] focus:outline-none focus:border-[#F0684D] w-24" />
          </div>
          {/* Ends */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#7A6555] w-10 shrink-0">Ends</span>
            <div className="relative flex-1">
              <button onClick={()=>{setShowEndCal(!showEndCal);setShowStartCal(false);}}
                className="w-full text-left px-3 py-1.5 rounded-lg bg-white border border-[#3D3330] text-sm text-[#FFEDD1] hover:border-[#F0684D]/40 transition-colors">
                {fmtDate(ev.endDate)}
              </button>
              {showEndCal && (
                <MiniCalPicker value={ev.endDate} onChange={v=>{set({endDate:v});setShowEndCal(false);}} onClose={()=>setShowEndCal(false)} />
              )}
            </div>
            <input type="time" value={ev.endTime} onChange={e=>set({endTime:e.target.value})}
              className="px-2 py-1.5 rounded-lg bg-white border border-[#3D3330] text-sm text-[#FFEDD1] focus:outline-none focus:border-[#F0684D] w-24" />
          </div>
          {/* Repeat */}
          <div className="flex items-center gap-2 pt-0.5">
            <label className="flex items-center gap-2 text-xs text-[#C4A882] cursor-pointer select-none">
              <input type="checkbox" className="accent-[#F0684D]"
                checked={!!ev.repeat} onChange={e=>set({repeat:e.target.checked?{every:1,unit:"weeks"}:null})} />
              Repeat every
            </label>
            {ev.repeat && (
              <>
                <input type="number" min={1} max={52} value={ev.repeat.every}
                  onChange={e=>set({repeat:{...ev.repeat!,every:Math.max(1,Number(e.target.value))}})}
                  className="w-14 px-2 py-1 rounded-lg bg-white border border-[#3D3330] text-sm text-[#FFEDD1] text-center focus:outline-none focus:border-[#F0684D]" />
                <Sel value={ev.repeat.unit} onChange={v=>set({repeat:{...ev.repeat!,unit:v as "days"|"weeks"}})} className="w-24">
                  <option value="days">days</option>
                  <option value="weeks">weeks</option>
                </Sel>
              </>
            )}
          </div>
        </div>

        {/* Invitees */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#C4A882] uppercase tracking-wider">Invitees</span>
            <label className="flex items-center gap-1.5 text-xs text-[#C4A882] cursor-pointer select-none">
              <input type="checkbox" className="accent-[#F0684D]"
                checked={ev.sendMail} onChange={e=>set({sendMail:e.target.checked})} />
              Send mail to invitees
            </label>
          </div>
          {/* Dept bulk-add */}
          <div className="flex flex-wrap gap-1.5 mb-2">
            {DEPARTMENTS.map(dept => (
              <button key={dept} onClick={()=>addByDept(dept)}
                className="px-2 py-0.5 rounded-lg text-[10px] font-medium bg-white border border-[#3D3330] text-[#C4A882] hover:border-[#F0684D]/40 hover:text-[#F0684D] transition-colors">
                + {dept}
              </button>
            ))}
          </div>
          {/* Search */}
          <div className="relative mb-2">
            <Inp value={mSearch} onChange={setMSearch} placeholder="Search members…" />
            {mSearch && filteredM.length > 0 && (
              <div className="absolute top-full left-0 right-0 z-20 mt-0.5 rounded-xl bg-[#232120] border border-[#3D3330] shadow-xl overflow-hidden">
                {filteredM.slice(0,5).map(m => (
                  <button key={m.id} onClick={()=>{addInvitee(m.id);setMSearch("");}}
                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[#232120] transition-colors text-left">
                    <span className={`w-5 h-5 rounded-full ${avatarBg(memberIdx(m.id))} text-white text-[9px] font-bold flex items-center justify-center shrink-0`}>{m.avatar}</span>
                    <span className="text-sm text-[#FFEDD1]">{m.name}</span>
                    <span className="text-xs text-[#7A6555] ml-auto">{m.department}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          {/* Chips */}
          {ev.invitees.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {ev.invitees.map(inv => {
                const m = MEMBERS.find(x=>x.id===inv.memberId); if (!m) return null;
                const mi = memberIdx(m.id);
                return (
                  <div key={inv.memberId} className="relative">
                    <div className={`group flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs cursor-pointer select-none ${STATUS_CLS[inv.status]}`}
                      onClick={()=>setActiveInvMenu(activeInvMenu===inv.memberId?null:inv.memberId)}>
                      <span className={`w-4 h-4 rounded-full ${avatarBg(mi)} text-white text-[8px] font-bold flex items-center justify-center shrink-0`}>{m.avatar}</span>
                      <span>{m.name.split(" ")[0]}</span>
                      <span className="opacity-60 capitalize text-[10px]">({inv.status})</span>
                      <button onClick={e=>{e.stopPropagation();removeInvitee(inv.memberId);}}
                        className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-white ml-0.5">✕</button>
                    </div>
                    {activeInvMenu===inv.memberId && (
                      <div className="absolute top-full left-0 z-30 mt-1 rounded-xl bg-[#232120] border border-[#3D3330] shadow-xl overflow-hidden min-w-[7rem]">
                        {(["accepted","pending","declined"] as InviteStatus[]).map(s => (
                          <button key={s} onClick={()=>setStatus(inv.memberId,s)}
                            className={`w-full px-3 py-2 text-xs capitalize text-left hover:bg-[#232120] transition-colors ${inv.status===s?"text-[#F0684D]":"text-[#C4A882]"}`}>
                            {s}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Linked Files */}
        <div>
          <div className="text-xs font-semibold text-[#C4A882] uppercase tracking-wider mb-2">Linked Files</div>
          {/* Drag zone */}
          <div
            onDragOver={e=>{e.preventDefault();setFileDragActive(true);}}
            onDragLeave={()=>setFileDragActive(false)}
            onDrop={handleFileDrop}
            className={`rounded-xl border-2 border-dashed px-3 py-2.5 text-center text-xs mb-2 transition-colors ${fileDragActive?"border-[#F0684D] bg-[#F0684D]/10 text-[#F0684D]":"border-[#3D3330] text-[#7A6555]"}`}>
            📎 Drop files here to attach
          </div>
          {/* Show dropped local files */}
          {ev.localFiles.length>0&&(
            <div className="flex flex-wrap gap-1.5 mb-2">
              {ev.localFiles.map((name,i)=>(
                <div key={i} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#232120] border border-[#3D3330] text-xs text-[#FFEDD1]">
                  📎 {name}
                  <button onClick={()=>set({localFiles:ev.localFiles.filter((_,j)=>j!==i)})} className="text-[#7A6555] hover:text-rose-400">✕</button>
                </div>
              ))}
            </div>
          )}
          {/* Drive file search */}
          <input value={fileSearch} onChange={e=>setFileSearch(e.target.value)} placeholder="Search Drive files…"
            className="w-full bg-[#232120] border border-[#3D3330] rounded-lg px-3 py-1.5 text-xs text-[#FFEDD1] placeholder:text-[#7A6555] focus:outline-none focus:border-[#F0684D] mb-2" />
          <div className="grid grid-cols-2 gap-1 max-h-28 overflow-auto">
            {FILES.filter(f=>f.name.toLowerCase().includes(fileSearch.toLowerCase())).map(f => (
              <label key={f.id} className="flex items-center gap-2 cursor-pointer group py-0.5">
                <input type="checkbox" className="accent-[#F0684D] shrink-0"
                  checked={ev.linkedFiles.includes(f.id)}
                  onChange={()=>set({linkedFiles:ev.linkedFiles.includes(f.id)?ev.linkedFiles.filter(x=>x!==f.id):[...ev.linkedFiles,f.id]})} />
                <span className="text-xs text-[#C4A882] group-hover:text-[#FFEDD1] transition-colors truncate">{f.name}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Discussion points (meeting only) */}
        {ev.type==="meeting" && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-[#C4A882] uppercase tracking-wider">Discussion Points</span>
              <button onClick={addDp} className="text-xs text-[#F0684D] hover:underline">+ Add point</button>
            </div>
            <div className="space-y-3">
              {ev.discussionPoints.map((dp, idx) => (
                <div key={dp.id} className="rounded-xl bg-[#232120] border border-[#3D3330] p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#7A6555] font-mono shrink-0">{idx+1}.</span>
                    <Inp value={dp.title} onChange={v=>updateDp(dp.id,{title:v})} placeholder="Point title…" />
                    <button onClick={()=>removeDp(dp.id)} className="text-[#7A6555] hover:text-rose-400 shrink-0 transition-colors">✕</button>
                  </div>
                  <textarea value={dp.notes} onChange={e=>updateDp(dp.id,{notes:e.target.value})} rows={2}
                    placeholder="Notes / minutes…"
                    className="w-full bg-white border border-[#3D3330] rounded-lg px-3 py-2 text-sm text-[#FFEDD1] placeholder:text-[#7A6555] focus:outline-none focus:border-[#F0684D] resize-none" />
                  {/* Voting */}
                  <div>
                    <label className="flex items-center gap-2 text-[9px] font-bold text-[#7A6555] uppercase mb-1.5 tracking-wider cursor-pointer select-none">
                      <input type="checkbox" className="accent-[#F0684D]"
                        checked={dp.votingEnabled}
                        onChange={e=>updateDp(dp.id,{votingEnabled:e.target.checked})} />
                      Enable voting for this point
                    </label>
                    {dp.votingEnabled && <><div className="relative mb-2">
                      <Inp value={dpVoteSearch[dp.id]??""} onChange={v=>setDpVoteSearch(p=>({...p,[dp.id]:v}))} placeholder="Add member to vote…" />
                      {(dpVoteSearch[dp.id]??"") && (
                        <div className="absolute top-full left-0 right-0 z-20 mt-0.5 rounded-xl bg-[#232120] border border-[#3D3330] shadow-xl overflow-hidden">
                          {MEMBERS.filter(m=>m.name.toLowerCase().includes((dpVoteSearch[dp.id]??'').toLowerCase())).slice(0,4).map(m => (
                            <div key={m.id} className="flex items-center gap-2 px-3 py-2 border-b border-[#3D3330] last:border-0">
                              <span className={`w-5 h-5 rounded-full ${avatarBg(memberIdx(m.id))} text-white text-[9px] font-bold flex items-center justify-center shrink-0`}>{m.avatar}</span>
                              <span className="flex-1 text-xs text-[#FFEDD1]">{m.name.split(" ")[0]}</span>
                              {(["for","abstain","against"] as const).map(g => (
                                <button key={g} onClick={()=>{addVote(dp.id,m.id,g);setDpVoteSearch(p=>({...p,[dp.id]:""}));}}
                                  className={`px-2 py-0.5 rounded text-[9px] font-semibold border ${g==="for"?"bg-emerald-500/20 text-emerald-400 border-emerald-500/30":g==="against"?"bg-rose-500/20 text-rose-400 border-rose-500/30":"bg-amber-500/20 text-amber-400 border-amber-500/30"}`}>
                                  {g}
                                </button>
                              ))}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                      {(["for","abstain","against"] as const).map(g => {
                        const gcls = {
                          for:    { bg:"bg-emerald-500/10 border-emerald-500/20", label:"text-emerald-400", name:"text-emerald-300" },
                          abstain:{ bg:"bg-amber-500/10 border-amber-500/20",   label:"text-amber-400",   name:"text-amber-300" },
                          against:{ bg:"bg-rose-500/10 border-rose-500/20",     label:"text-rose-400",    name:"text-rose-300" },
                        }[g];
                        return (
                          <div key={g} className={`rounded-lg p-2 border ${gcls.bg}`}>
                            <div className={`text-[9px] font-bold uppercase mb-1 ${gcls.label}`}>{g} ({dp.votes[g].length})</div>
                            <div className="flex flex-wrap gap-1">
                              {dp.votes[g].map(id => {
                                const m=MEMBERS.find(x=>x.id===id); if (!m) return null;
                                return (
                                  <span key={id} className={`flex items-center gap-0.5 text-[9px] ${gcls.name}`}>
                                    {m.name.split(" ")[0]}
                                    <button onClick={()=>removeVote(dp.id,id,g)} className="text-[#7A6555] hover:text-rose-400">✕</button>
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div></>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-2 px-5 py-4 border-t border-[#3D3330] shrink-0">
        <button onClick={onClose} className="flex-1 py-2 rounded-xl text-sm font-medium bg-[#232120] border border-[#3D3330] text-[#FFEDD1] hover:bg-[#2E2B2A] transition-colors">Cancel</button>
        <button onClick={()=>{if(ev.title.trim())onSave(ev);}}
          className="flex-1 py-2 rounded-xl text-sm font-medium bg-[#F0684D] text-white hover:bg-[#E05538] transition-colors">
          {initial ? "Save changes" : "Create"}
        </button>
      </div>
    </ModalShell>
  );
}

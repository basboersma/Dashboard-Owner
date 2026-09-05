import type { CalEvent, InviteStatus } from "../types";
import { MEMBERS, FILES, avatarBg, memberIdx, DAY_FULL, parseDate, MONTH_NAMES } from "../data";
import { ModalShell, ModalHeader } from "./shared";

const STATUS_CLS: Record<InviteStatus, string> = {
  accepted: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
  pending:  "bg-amber-500/20  text-amber-400  border-amber-500/40",
  declined: "bg-rose-500/20   text-rose-400   border-rose-500/40",
};
const STATUS_DOT: Record<InviteStatus, string> = {
  accepted: "bg-emerald-400", pending: "bg-amber-400", declined: "bg-rose-400",
};
const TYPE_COLOR: Record<CalEvent["type"], string> = { event:"#10b981", meeting:"#4f6ef7" };
const FILE_ICON: Record<string, string> = { pdf:"📄", doc:"📝", sheet:"📊", slide:"📑", other:"📁" };

function fmtDateTime(date: string, time: string) {
  const d = parseDate(date);
  const dayName = DAY_FULL[(d.getDay()+6)%7];
  return `${dayName}, ${d.getDate()} ${MONTH_NAMES[d.getMonth()]} · ${time}`;
}

interface Props { event: CalEvent; onEdit: () => void; onClose: () => void; }

export function EventDetailModal({ event, onEdit, onClose }: Props) {
  const typeColor = TYPE_COLOR[event.type];

  return (
    <ModalShell onClose={onClose} width="max-w-lg">
      <ModalHeader title="" onClose={onClose} />

      <div className="flex-1 overflow-auto px-5 pb-5 space-y-4">
        {/* Title + badges */}
        <div className="flex items-start gap-3 pt-1">
          <div className="w-3 h-3 rounded-full mt-1 shrink-0" style={{ background: typeColor }} />
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-[#FFEDD1] leading-tight">{event.title}</h2>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <span className="text-xs font-medium px-2 py-0.5 rounded-full capitalize"
                style={{ background: typeColor+"22", color: typeColor, border: `1px solid ${typeColor}44` }}>
                {event.type}
              </span>
              {event.repeat && (
                <span className="text-xs text-[#7A6555]">🔁 Every {event.repeat.every} {event.repeat.unit}</span>
              )}
            </div>
          </div>
        </div>

        {/* Time */}
        <div className="flex items-center gap-2 text-sm text-[#C4A882]">
          <span>🕐</span>
          <span>{fmtDateTime(event.date, event.startTime)} – {event.endTime}</span>
        </div>
        {event.location && (
          <div className="flex items-center gap-2 text-sm text-[#C4A882]">
            <span>📍</span><span>{event.location}</span>
          </div>
        )}
        {event.description && (
          <p className="text-sm text-[#C4A882] bg-[#232120] rounded-xl px-3 py-2.5">{event.description}</p>
        )}

        {/* Invitees */}
        {event.invitees.length > 0 && (
          <div>
            <div className="text-xs font-semibold text-[#7A6555] uppercase tracking-wider mb-2">
              Invitees ({event.invitees.length})
            </div>
            <div className="flex flex-wrap gap-2">
              {event.invitees.map(inv => {
                const m = MEMBERS.find(x=>x.id===inv.memberId); if (!m) return null;
                const mi = memberIdx(m.id);
                return (
                  <div key={inv.memberId}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs ${STATUS_CLS[inv.status]}`}
                    title={`${m.name}: ${inv.status}`}>
                    <span className={`w-4 h-4 rounded-full ${avatarBg(mi)} text-white text-[8px] font-bold flex items-center justify-center shrink-0`}>{m.avatar}</span>
                    <span>{m.name.split(" ")[0]}</span>
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_DOT[inv.status]}`} />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Discussion points */}
        {event.type === "meeting" && event.discussionPoints.length > 0 && (
          <div>
            <div className="text-xs font-semibold text-[#7A6555] uppercase tracking-wider mb-2">Discussion Points</div>
            <div className="space-y-2">
              {event.discussionPoints.map((dp, i) => (
                <div key={dp.id} className="rounded-xl bg-[#232120] border border-[#3D3330] p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-[#7A6555] font-mono">{i+1}.</span>
                    <span className="text-sm font-medium text-[#FFEDD1]">{dp.title}</span>
                  </div>
                  {dp.notes && <p className="text-xs text-[#C4A882] mb-2 pl-5">{dp.notes}</p>}
                  {dp.votingEnabled && (
                    <div className="grid grid-cols-3 gap-2 pl-5">
                      {(["for","abstain","against"] as const).map(g => {
                        const cls = g==="for"?"text-emerald-400":g==="against"?"text-rose-400":"text-amber-400";
                        return (
                          <div key={g} className="text-center">
                            <div className={`text-xs font-bold capitalize ${cls}`}>{g}</div>
                            <div className="text-[10px] text-[#C4A882]">
                              {dp.votes[g].map(id=>MEMBERS.find(m=>m.id===id)?.name.split(" ")[0]).join(", ")||"—"}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Linked files */}
        {(event.linkedFiles.length > 0 || event.localFiles.length > 0) && (
          <div>
            <div className="text-xs font-semibold text-[#7A6555] uppercase tracking-wider mb-2">Files</div>
            <div className="space-y-1">
              {event.linkedFiles.map(fid => {
                const f = FILES.find(x=>x.id===fid); if (!f) return null;
                const ext = f.name.split(".").pop() as string;
                return (
                  <a key={fid} href={f.url} target="_blank" rel="noreferrer"
                    className="flex items-center gap-2 p-2 rounded-lg bg-[#232120] border border-[#3D3330] hover:border-[#F0684D]/40 transition-colors">
                    <span className="text-sm">{FILE_ICON[ext] ?? FILE_ICON.other}</span>
                    <span className="text-xs text-[#FFEDD1] truncate">{f.name}</span>
                  </a>
                );
              })}
              {event.localFiles.map((name, i) => (
                <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-[#232120] border border-[#3D3330]">
                  <span className="text-sm">📎</span>
                  <span className="text-xs text-[#FFEDD1] truncate">{name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-2 px-5 py-4 border-t border-[#3D3330] shrink-0">
        <button onClick={onClose} className="flex-1 py-2 rounded-xl text-sm font-medium bg-[#232120] border border-[#3D3330] text-[#FFEDD1] hover:bg-[#2E2B2A] transition-colors">Close</button>
        <button onClick={onEdit} className="flex-1 py-2 rounded-xl text-sm font-medium bg-[#F0684D] text-white hover:bg-[#E05538] transition-colors">✏️ Edit</button>
      </div>
    </ModalShell>
  );
}

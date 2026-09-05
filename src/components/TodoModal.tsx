import { useState } from "react";
import type { TodoItem, Subtask } from "../types";
import { MEMBERS, FILES, avatarBg, memberIdx } from "../data";
import { ModalShell, ModalHeader } from "./shared";
import { MiniCalPicker } from "./MiniCalPicker";

const TASK_COLORS = ["#f43f5e", "#f59e0b", "#10b981", "#4f6ef7", "#8b5cf6", "#ec4899"];
const fileIcon = (name: string) => name.endsWith(".pdf") ? "📄" : name.endsWith(".doc") ? "📝" : name.endsWith(".sheet") ? "📊" : name.endsWith(".slide") ? "📑" : "📁";

interface Props {
  initial?: TodoItem;
  onSave: (item: TodoItem) => void;
  onDelete?: () => void;
  onClose: () => void;
}

export function TodoModal({ initial, onSave, onDelete, onClose }: Props) {
  const blank: TodoItem = {
    id: Date.now().toString(), text: "", description: "", done: false,
    color: TASK_COLORS[0], assignedMembers: [], linkedFiles: [],
    addToCalendar: false, calendarDate: "", subtasks: [],
  };
  const [item, setItem] = useState<TodoItem>(initial ? { ...initial, subtasks: initial.subtasks ?? [] } : blank);
  const [mSearch, setMSearch] = useState("");
  const [fileSearch, setFileSearch] = useState("");
  const [showCal, setShowCal] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [newSubtask, setNewSubtask] = useState("");

  const set = (patch: Partial<TodoItem>) => setItem(p => ({ ...p, ...patch }));

  const toggleMember = (id: string) =>
    set({ assignedMembers: item.assignedMembers.includes(id) ? item.assignedMembers.filter(x => x !== id) : [...item.assignedMembers, id] });

  const toggleFile = (fid: string) =>
    set({ linkedFiles: item.linkedFiles.includes(fid) ? item.linkedFiles.filter(x => x !== fid) : [...item.linkedFiles, fid] });

  const filteredM = MEMBERS.filter(m =>
    !item.assignedMembers.includes(m.id) && m.name.toLowerCase().includes(mSearch.toLowerCase())
  );
  const filteredFiles = FILES.filter(f => f.name.toLowerCase().includes(fileSearch.toLowerCase()));

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragActive(false);
    Array.from(e.dataTransfer.files).forEach(f => {
      const key = `local:${f.name}`;
      if (!item.linkedFiles.includes(key)) set({ linkedFiles: [...item.linkedFiles, key] });
    });
  };

  const addSubtask = () => {
    if (!newSubtask.trim()) return;
    const st: Subtask = { id: Date.now().toString(), text: newSubtask.trim(), done: false };
    set({ subtasks: [...item.subtasks, st] });
    setNewSubtask("");
  };

  const toggleSubtask = (id: string) =>
    set({ subtasks: item.subtasks.map(s => s.id === id ? { ...s, done: !s.done } : s) });

  const removeSubtask = (id: string) =>
    set({ subtasks: item.subtasks.filter(s => s.id !== id) });

  return (
    <ModalShell onClose={onClose} width="max-w-lg">
      <ModalHeader title={initial ? "Edit Task" : "New Task"} onClose={onClose} />

      <div className="flex-1 overflow-auto p-5 space-y-4">
        {/* Color picker */}
        <div className="flex gap-1.5">
          {TASK_COLORS.map(c => (
            <button key={c} onClick={() => set({ color: c })}
              className="w-5 h-5 rounded-full transition-all hover:scale-110"
              style={{ background: c, outline: item.color === c ? `2px solid ${c}` : "none", outlineOffset: 2 }} />
          ))}
        </div>

        {/* Title */}
        <input value={item.text} onChange={e => set({ text: e.target.value })} placeholder="Task title…"
          className="w-full bg-transparent border-b-2 border-[#3D3330] focus:border-[#F0684D] outline-none px-0 py-1 text-base font-medium text-[#FFEDD1] placeholder:text-[#7A6555] transition-colors" />

        {/* Description */}
        <div>
          <label className="text-xs text-[#7A6555] uppercase font-semibold tracking-wider mb-1 block">Description</label>
          <textarea value={item.description} onChange={e => set({ description: e.target.value })} rows={2}
            placeholder="Add details…"
            className="w-full bg-[#232120] border border-[#3D3330] rounded-xl px-3 py-2 text-sm text-[#FFEDD1] placeholder:text-[#7A6555] focus:outline-none focus:border-[#F0684D] resize-none" />
        </div>

        {/* Subtasks */}
        <div>
          <label className="text-xs text-[#7A6555] uppercase font-semibold tracking-wider mb-2 block">Subtasks</label>
          <div className="space-y-1 mb-2">
            {item.subtasks.map(st => (
              <div key={st.id} className="flex items-center gap-2 group">
                <button onClick={() => toggleSubtask(st.id)}
                  className={`w-4 h-4 rounded border-2 shrink-0 flex items-center justify-center transition-colors ${st.done ? "border-[#F0684D] bg-[#F0684D]" : "border-[#4a5568]"}`}>
                  {st.done && <span className="text-white text-[8px] font-bold">✓</span>}
                </button>
                <span className={`flex-1 text-sm ${st.done ? "line-through text-[#7A6555]" : "text-[#FFEDD1]"}`}>{st.text}</span>
                <button onClick={() => removeSubtask(st.id)} className="opacity-0 group-hover:opacity-100 text-[#7A6555] hover:text-rose-400 text-xs transition-opacity">✕</button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input value={newSubtask} onChange={e => setNewSubtask(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addSubtask()}
              placeholder="Add subtask… (Enter)"
              className="flex-1 bg-[#232120] border border-[#3D3330] rounded-lg px-3 py-1.5 text-sm text-[#FFEDD1] placeholder:text-[#7A6555] focus:outline-none focus:border-[#F0684D]" />
            <button onClick={addSubtask} className="px-3 py-1.5 rounded-lg bg-[#232120] border border-[#3D3330] text-[#C4A882] hover:text-[#F0684D] hover:border-[#F0684D]/40 text-xs transition-colors">+</button>
          </div>
        </div>

        {/* Members */}
        <div>
          <label className="text-xs text-[#7A6555] uppercase font-semibold tracking-wider mb-2 block">Assigned Members</label>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {item.assignedMembers.map(id => {
              const m = MEMBERS.find(x => x.id === id); if (!m) return null;
              return (
                <button key={id} onClick={() => toggleMember(id)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-[#3D3330] bg-[#232120] text-xs text-[#FFEDD1] hover:border-rose-400/40 hover:text-rose-400 transition-colors">
                  <span className={`w-4 h-4 rounded-full ${avatarBg(memberIdx(id))} text-white text-[8px] font-bold flex items-center justify-center`}>{m.avatar}</span>
                  {m.name.split(" ")[0]} ✕
                </button>
              );
            })}
          </div>
          <div className="relative">
            <input value={mSearch} onChange={e => setMSearch(e.target.value)} placeholder="Search members…"
              className="w-full bg-[#232120] border border-[#3D3330] rounded-lg px-3 py-2 text-sm text-[#FFEDD1] placeholder:text-[#7A6555] focus:outline-none focus:border-[#F0684D]" />
            {mSearch && filteredM.length > 0 && (
              <div className="absolute top-full left-0 right-0 z-10 mt-0.5 rounded-xl bg-[#232120] border border-[#3D3330] shadow-xl overflow-hidden">
                {filteredM.slice(0, 5).map(m => (
                  <button key={m.id} onClick={() => { toggleMember(m.id); setMSearch(""); }}
                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[#232120] transition-colors text-left">
                    <span className={`w-5 h-5 rounded-full ${avatarBg(memberIdx(m.id))} text-white text-[9px] font-bold flex items-center justify-center shrink-0`}>{m.avatar}</span>
                    <span className="text-sm text-[#FFEDD1]">{m.name}</span>
                    <span className="text-xs text-[#7A6555] ml-auto">{m.department}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Files */}
        <div>
          <label className="text-xs text-[#7A6555] uppercase font-semibold tracking-wider mb-2 block">Files</label>
          <div onDragOver={e => { e.preventDefault(); setDragActive(true); }} onDragLeave={() => setDragActive(false)} onDrop={handleDrop}
            className={`rounded-xl border-2 border-dashed px-3 py-2.5 text-center text-xs mb-2 transition-colors ${dragActive ? "border-[#F0684D] bg-[#F0684D]/10 text-[#F0684D]" : "border-[#3D3330] text-[#7A6555]"}`}>
            📎 Drop files here
          </div>
          <input value={fileSearch} onChange={e => setFileSearch(e.target.value)} placeholder="Search Drive files…"
            className="w-full bg-[#232120] border border-[#3D3330] rounded-lg px-3 py-2 text-sm text-[#FFEDD1] placeholder:text-[#7A6555] focus:outline-none focus:border-[#F0684D] mb-2" />
          <div className="space-y-1 max-h-24 overflow-auto">
            {filteredFiles.map(f => (
              <label key={f.id} className="flex items-center gap-2 cursor-pointer group py-0.5">
                <input type="checkbox" className="accent-[#F0684D]" checked={item.linkedFiles.includes(f.id)} onChange={() => toggleFile(f.id)} />
                <span className="text-xs text-[#C4A882] group-hover:text-[#FFEDD1] transition-colors truncate">{fileIcon(f.name)} {f.name}</span>
              </label>
            ))}
          </div>
          {item.linkedFiles.filter(x => x.startsWith("local:")).map((x, i) => (
            <div key={i} className="flex items-center gap-2 mt-1 p-1.5 rounded-lg bg-[#232120] border border-[#3D3330]">
              <span className="text-xs">📎</span>
              <span className="flex-1 text-xs text-[#FFEDD1] truncate">{x.replace("local:", "")}</span>
              <button onClick={() => set({ linkedFiles: item.linkedFiles.filter(y => y !== x) })} className="text-[#7A6555] hover:text-rose-400 text-xs">✕</button>
            </div>
          ))}
        </div>

        {/* Calendar */}
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-[#C4A882] cursor-pointer select-none">
            <input type="checkbox" className="accent-[#F0684D]" checked={item.addToCalendar} onChange={e => set({ addToCalendar: e.target.checked })} />
            📅 Add to calendar
          </label>
          {item.addToCalendar && (
            <div className="relative">
              <button onClick={() => setShowCal(!showCal)}
                className="px-3 py-1.5 rounded-lg bg-[#232120] border border-[#3D3330] text-xs text-[#FFEDD1] hover:border-[#F0684D]/40 transition-colors">
                {item.calendarDate || "Pick date"}
              </button>
              {showCal && <MiniCalPicker value={item.calendarDate} onChange={v => { set({ calendarDate: v }); setShowCal(false); }} onClose={() => setShowCal(false)} />}
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-2 px-5 py-4 border-t border-[#3D3330] shrink-0">
        {onDelete && (
          <button onClick={onDelete} className="px-4 py-2 rounded-xl text-sm font-medium bg-rose-500/20 text-rose-400 border border-rose-500/30 hover:bg-rose-500/30 transition-colors">Delete</button>
        )}
        <button onClick={onClose} className="flex-1 py-2 rounded-xl text-sm font-medium bg-[#232120] border border-[#3D3330] text-[#FFEDD1] hover:bg-[#2E2B2A] transition-colors">Cancel</button>
        <button onClick={() => { if (item.text.trim()) onSave(item); }}
          className="flex-1 py-2 rounded-xl text-sm font-medium bg-[#F0684D] text-white hover:bg-[#E05538] transition-colors">
          {initial ? "Save" : "Create"}
        </button>
      </div>
    </ModalShell>
  );
}

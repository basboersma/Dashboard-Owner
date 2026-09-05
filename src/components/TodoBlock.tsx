import { useState } from "react";
import type { TodoItem } from "../types";
import { MEMBERS, avatarBg, memberIdx, INIT_TODOS } from "../data";
import { TodoModal } from "./TodoModal";

function daysUntil(dateStr: string): number {
  const today = new Date(); today.setHours(0,0,0,0);
  const due = new Date(dateStr); due.setHours(0,0,0,0);
  return Math.round((due.getTime() - today.getTime()) / 86400000);
}

function SubtaskTrack({ item, onToggle }: { item: TodoItem; onToggle: (stId: string) => void }) {
  const [tooltip, setTooltip] = useState<{idx: number; text: string} | null>(null);
  const raw = item.subtasks ?? [];
  if (raw.length === 0) return null;
  // Sort: done subtasks move to front so bar is always contiguous
  const subtasks = [...raw.filter(s => s.done), ...raw.filter(s => !s.done)];
  const doneCount = subtasks.filter(s => s.done).length;
  const fillPct = item.done
    ? 100
    : doneCount === 0 ? 0
    : Math.min(97, ((doneCount - 0.5) / subtasks.length) * 100);

  return (
    <div className="mt-1.5 mb-0.5">
      <div className="relative flex items-center h-3 w-full">
        <div className="absolute inset-y-1 left-0 right-0 rounded-full bg-[#3D3330]" />
        {fillPct > 0 && (
          <div className="absolute inset-y-1 left-0 rounded-full transition-all"
            style={{ width: `${fillPct}%`, background: item.color }} />
        )}
        {subtasks.map((st, i) => {
          const pos = ((i + 0.5) / subtasks.length) * 100;
          return (
            <div key={st.id} className="absolute z-10 -translate-x-1/2" style={{ left: `${pos}%` }}>
              {tooltip?.idx === i && (
                <div className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 px-2 py-1 rounded-md bg-[#141212] border border-[#3D3330] text-[9px] text-[#FFEDD1] whitespace-nowrap pointer-events-none shadow-lg">
                  {tooltip.text}
                </div>
              )}
              <button
                className="w-3 h-3 rounded-full border-2 transition-all hover:scale-125 block"
                style={{ background: st.done ? item.color : "#2A2724", borderColor: st.done ? item.color : "#D4B896" }}
                onMouseEnter={() => setTooltip({ idx: i, text: st.text })}
                onMouseLeave={() => setTooltip(null)}
                onClick={e => { e.stopPropagation(); onToggle(st.id); }} />
            </div>
          );
        })}
      </div>
      <div className="flex items-center justify-between mt-0.5">
        <span className="text-[9px] text-[#7A6555]">{doneCount}/{subtasks.length} subtasks</span>
        <span className="text-[9px] font-medium" style={{ color: item.color }}>{Math.round(fillPct)}%</span>
      </div>
    </div>
  );
}

function DueBadge({ dueDate, done }: { dueDate: string; done: boolean }) {
  if (done) return <span className="text-[9px] text-[#7A6555] shrink-0">Done</span>;
  const days = daysUntil(dueDate);
  if (days < 0) return <span className="text-[9px] font-semibold text-[#F0684D] shrink-0">{Math.abs(days)}d overdue</span>;
  if (days === 0) return <span className="text-[9px] font-semibold text-[#F0684D] shrink-0">Due today</span>;
  if (days <= 3) return <span className="text-[9px] font-semibold text-amber-600 shrink-0">{days}d left</span>;
  return <span className="text-[9px] text-[#7A6555] shrink-0">{days}d</span>;
}

export function TodoBlock() {
  const [todos, setTodos] = useState<TodoItem[]>(INIT_TODOS);
  const [modal, setModal] = useState<"new" | TodoItem | null>(null);
  const [tab, setTab] = useState<"active" | "previous">("active");

  const save = (item: TodoItem) => {
    setTodos(p => p.some(t => t.id === item.id) ? p.map(t => t.id === item.id ? item : t) : [...p, item]);
    setModal(null);
  };
  const remove = (id: string) => { setTodos(p => p.filter(t => t.id !== id)); setModal(null); };
  const toggle = (id: string) => setTodos(p => p.map(t => t.id === id ? { ...t, done: !t.done } : t));
  const toggleSubtask = (todoId: string, stId: string) =>
    setTodos(p => p.map(t => t.id === todoId
      ? { ...t, subtasks: (t.subtasks ?? []).map(s => s.id === stId ? { ...s, done: !s.done } : s) }
      : t));

  const active = todos.filter(t => !t.done);
  const previous = todos.filter(t => t.done);
  const displayed = tab === "active" ? active : previous;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-2 shrink-0">
        <div className="flex items-center gap-0.5 rounded-lg bg-[#232120] border border-[#3D3330] p-0.5">
          <button onClick={() => setTab("active")}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${tab === "active" ? "bg-[#3D3330] text-[#FFEDD1]" : "text-[#7A6555] hover:text-[#C4A882]"}`}>
            Active{active.length > 0 && <span className="ml-1 text-[#F0684D]">{active.length}</span>}
          </button>
          <button onClick={() => setTab("previous")}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${tab === "previous" ? "bg-[#3D3330] text-[#FFEDD1]" : "text-[#7A6555] hover:text-[#C4A882]"}`}>
            Previous{previous.length > 0 && <span className="ml-1 text-[#7A6555]">{previous.length}</span>}
          </button>
        </div>
        <button onClick={() => setModal("new")}
          className="px-2.5 py-1 rounded-lg bg-[#F0684D] text-white text-xs font-medium hover:bg-[#E05538] transition-colors">
          + New task
        </button>
      </div>

      <div className="flex-1 overflow-auto space-y-2 min-h-0">
        {displayed.map(t => (
          <div key={t.id}
            className={`rounded-xl border transition-all group ${t.done ? "bg-[#232120] border-[#3D3330] opacity-60" : "bg-[#2A2724] border-[#3D3330] hover:border-[#4A3F38]"}`}
            style={{ borderLeftColor: t.color, borderLeftWidth: 3 }}>
            <div className="flex items-center gap-2.5 px-3 pt-2.5 pb-1">
              <button onClick={() => toggle(t.id)}
                className="w-4 h-4 rounded border-2 shrink-0 flex items-center justify-center transition-colors"
                style={{ borderColor: t.done ? t.color : "#D4B896", background: t.done ? t.color : "transparent" }}>
                {t.done && <span className="text-white text-[9px] font-bold">✓</span>}
              </button>
              <span className={`flex-1 text-sm truncate cursor-pointer font-medium ${t.done ? "line-through text-[#7A6555]" : "text-[#FFEDD1]"}`}
                onClick={() => setModal(t)}>
                {t.text}
              </span>
              {t.assignedMembers.length > 0 && (
                <div className="flex -space-x-1 shrink-0">
                  {t.assignedMembers.slice(0, 3).map(id => {
                    const m = MEMBERS.find(x => x.id === id); if (!m) return null;
                    return <span key={id} title={m.name}
                      className={`w-5 h-5 rounded-full ${avatarBg(memberIdx(id))} border-2 border-[#2A2724] text-white text-[8px] font-bold flex items-center justify-center`}>
                      {m.avatar}
                    </span>;
                  })}
                </div>
              )}
              {t.dueDate && <DueBadge dueDate={t.dueDate} done={t.done} />}
              <button onClick={() => setModal(t)}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-[#7A6555] hover:text-[#FFEDD1] text-[10px] shrink-0 ml-1 font-medium">
                Edit
              </button>
            </div>
            {(t.subtasks ?? []).length > 0 && (
              <div className="px-3 pb-2">
                <SubtaskTrack item={{ ...t, subtasks: t.subtasks ?? [] }} onToggle={stId => toggleSubtask(t.id, stId)} />
              </div>
            )}
          </div>
        ))}
        {displayed.length === 0 && (
          <div className="flex flex-col items-center justify-center h-32 text-[#7A6555] text-sm gap-2">
            <span className="text-3xl font-thin text-[#4A3F38]">—</span>
            <span>{tab === "active" ? "All caught up" : "Nothing here yet"}</span>
          </div>
        )}
      </div>

      {modal && (
        <TodoModal
          initial={modal === "new" ? undefined : modal}
          onSave={save}
          onDelete={modal !== "new" ? () => remove(modal.id) : undefined}
          onClose={() => setModal(null)} />
      )}
    </div>
  );
}

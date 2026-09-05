import { useState, useRef, useEffect, useCallback } from "react";
import type { RoadmapItem } from "../types";
import {
  DEPARTMENTS, DEPT_COLORS, INIT_ROADMAP,
  MONTH_NAMES, addDays, formatDate, parseDate, diffDays,
} from "../data";
import { ModalShell, ModalHeader, Inp, Sel, Field } from "./shared";
import { MiniCalPicker } from "./MiniCalPicker";

const DEPT_COL_W = 110;
const ROW_H = 26;
const ROW_GAP = 4;
const HEADER_H = 32;

type SpanLabel = "1M" | "3M" | "6M" | "1Y";
const SPAN_MONTHS: Record<SpanLabel, number> = { "1M": 1, "3M": 3, "6M": 6, "1Y": 12 };

function assignRows(items: RoadmapItem[]): (RoadmapItem & { row: number })[] {
  const sorted = [...items].sort((a, b) => a.startDate.localeCompare(b.startDate));
  const rowEnds: string[] = [];
  return sorted.map(item => {
    const r = rowEnds.findIndex(end => end < item.startDate);
    if (r === -1) { rowEnds.push(item.endDate); return { ...item, row: rowEnds.length - 1 }; }
    rowEnds[r] = item.endDate;
    return { ...item, row: r };
  });
}

interface FormProps { initial?: RoadmapItem; onSave: (item: RoadmapItem) => void; onDelete?: () => void; onClose: () => void; }
function RoadmapForm({ initial, onSave, onDelete, onClose }: FormProps) {
  const today = formatDate(new Date());
  const blank: RoadmapItem = { id: Date.now().toString(), title: "", department: "Mechanical", startDate: today, endDate: today, color: DEPT_COLORS.Mechanical, progress: 0 };
  const [item, setItem] = useState<RoadmapItem>(initial ?? blank);
  const [showStart, setShowStart] = useState(false);
  const [showEnd, setShowEnd] = useState(false);
  const set = (p: Partial<RoadmapItem>) => setItem(prev => ({ ...prev, ...p }));
  const fmtBtn = (d: string) => d ? parseDate(d).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "Select date";
  return (
    <ModalShell onClose={onClose} width="max-w-md">
      <ModalHeader title={initial ? "Edit Item" : "Add Item"} onClose={onClose} />
      <div className="flex-1 overflow-auto p-5 space-y-4">
        <Field label="Title"><Inp value={item.title} onChange={v => set({ title: v })} placeholder="Item title…" /></Field>
        <Field label="Department">
          <Sel value={item.department} onChange={v => set({ department: v, color: DEPT_COLORS[v] ?? DEPT_COLORS.Mechanical })}>
            {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
          </Sel>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Start date">
            <div className="relative">
              <button onClick={() => { setShowStart(!showStart); setShowEnd(false); }}
                className="w-full text-left px-3 py-2 rounded-lg bg-[#232120] border border-[#3D3330] text-sm text-[#FFEDD1] hover:border-[#F0684D]/40 transition-colors">
                {fmtBtn(item.startDate)}
              </button>
              {showStart && <MiniCalPicker value={item.startDate} onChange={v => { set({ startDate: v }); setShowStart(false); }} onClose={() => setShowStart(false)} />}
            </div>
          </Field>
          <Field label="End date">
            <div className="relative">
              <button onClick={() => { setShowEnd(!showEnd); setShowStart(false); }}
                className="w-full text-left px-3 py-2 rounded-lg bg-[#232120] border border-[#3D3330] text-sm text-[#FFEDD1] hover:border-[#F0684D]/40 transition-colors">
                {fmtBtn(item.endDate)}
              </button>
              {showEnd && <MiniCalPicker value={item.endDate} onChange={v => { set({ endDate: v }); setShowEnd(false); }} onClose={() => setShowEnd(false)} />}
            </div>
          </Field>
        </div>
        <Field label={`Progress: ${item.progress}%`}>
          <input type="range" min={0} max={100} value={item.progress} onChange={e => set({ progress: Number(e.target.value) })}
            className="w-full accent-[#F0684D]" />
        </Field>
        <div className="flex items-center gap-2 text-sm text-[#C4A882]">
          <span className="w-3 h-3 rounded-full" style={{ background: item.color }} />
          <span>{item.department}</span>
        </div>
      </div>
      <div className="flex gap-2 px-5 py-4 border-t border-[#3D3330] shrink-0">
        {onDelete && <button onClick={onDelete} className="px-4 py-2 rounded-xl text-sm bg-[#F0684D]/10 text-[#F0684D] border border-[#F0684D]/25 hover:bg-[#F0684D]/20 transition-colors">Delete</button>}
        <button onClick={onClose} className="flex-1 py-2 rounded-xl text-sm bg-[#232120] border border-[#3D3330] text-[#C4A882] hover:bg-[#2E2B2A] transition-colors">Cancel</button>
        <button onClick={() => { if (item.title.trim()) onSave(item); }}
          className="flex-1 py-2 rounded-xl text-sm bg-[#F0684D] text-white hover:bg-[#E05538] transition-colors font-medium">
          {initial ? "Save" : "Add"}
        </button>
      </div>
    </ModalShell>
  );
}

interface DragState { type: "move" | "resize-left" | "resize-right"; id: string; startX: number; initialStart: string; initialEnd: string; }

export function RoadmapBlock() {
  const [items, setItems] = useState<RoadmapItem[]>(INIT_ROADMAP);
  const [viewStart, setViewStart] = useState<Date>(() => { const d = new Date(); d.setDate(1); d.setHours(0, 0, 0, 0); return d; });
  const [span, setSpan] = useState<SpanLabel>("1M");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<RoadmapItem | null>(null);
  const [drag, setDrag] = useState<DragState | null>(null);
  const [deptOrder, setDeptOrder] = useState<string[]>(DEPARTMENTS);
  const [rowDragging, setRowDragging] = useState<string | null>(null);
  const [rowDragOver, setRowDragOver] = useState<string | null>(null);
  const [dayWidth, setDayWidth] = useState(36);
  const scrollRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const spanMonths = SPAN_MONTHS[span];
  const viewEnd = (() => {
    const d = new Date(viewStart);
    d.setMonth(d.getMonth() + spanMonths);
    d.setDate(d.getDate() - 1);
    return d;
  })();
  const viewStartStr = formatDate(viewStart);
  const viewEndStr = formatDate(viewEnd);

  const totalDays = diffDays(viewStartStr, viewEndStr) + 1;
  const dayLabels = Array.from({ length: totalDays }, (_, i) => addDays(viewStart, i));

  useEffect(() => {
    if (!scrollRef.current) return;
    const obs = new ResizeObserver(() => {
      if (scrollRef.current) setDayWidth(Math.max(span === "1M" ? 24 : span === "3M" ? 10 : 5, (scrollRef.current.clientWidth - DEPT_COL_W) / totalDays));
    });
    obs.observe(scrollRef.current);
    return () => obs.disconnect();
  }, [totalDays, span]);

  const goToday = () => {
    const d = new Date(); d.setDate(1); d.setHours(0, 0, 0, 0);
    setViewStart(d);
  };

  const nav = (dir: 1 | -1) => setViewStart(d => {
    const r = new Date(d);
    r.setMonth(r.getMonth() + dir * spanMonths);
    r.setDate(1);
    return r;
  });

  const dateToX = useCallback((dateStr: string): number => {
    return diffDays(viewStartStr, dateStr) * dayWidth;
  }, [dayWidth, viewStartStr]);

  const pxToDays = (px: number) => Math.round(px / dayWidth);
  const shiftDate = (dateStr: string, days: number): string => formatDate(addDays(parseDate(dateStr), days));

  const saveItem = (item: RoadmapItem) => {
    setItems(prev => prev.some(x => x.id === item.id) ? prev.map(x => x.id === item.id ? item : x) : [...prev, item]);
    setCreating(false); setEditing(null);
  };
  const deleteItem = (id: string) => { setItems(prev => prev.filter(x => x.id !== id)); setEditing(null); };

  useEffect(() => {
    if (!drag) return;
    const onMove = (e: MouseEvent) => {
      const dx = e.clientX - drag.startX;
      const days = pxToDays(dx);
      if (days === 0) return;
      if (drag.type === "move") {
        setItems(prev => prev.map(x => x.id !== drag.id ? x : { ...x, startDate: shiftDate(drag.initialStart, days), endDate: shiftDate(drag.initialEnd, days) }));
      } else if (drag.type === "resize-left") {
        const newStart = shiftDate(drag.initialStart, days);
        if (newStart < drag.initialEnd) setItems(prev => prev.map(x => x.id !== drag.id ? x : { ...x, startDate: newStart }));
      } else {
        const newEnd = shiftDate(drag.initialEnd, days);
        if (newEnd > drag.initialStart) setItems(prev => prev.map(x => x.id !== drag.id ? x : { ...x, endDate: newEnd }));
      }
    };
    const onUp = () => setDrag(null);
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    return () => { document.removeEventListener("mousemove", onMove); document.removeEventListener("mouseup", onUp); };
  }, [drag, dayWidth]);

  const handleRowDrop = (targetDept: string) => {
    if (!rowDragging || rowDragging === targetDept) return;
    setDeptOrder(prev => {
      const next = prev.filter(d => d !== rowDragging);
      const idx = next.indexOf(targetDept);
      next.splice(idx, 0, rowDragging);
      return next;
    });
    setRowDragging(null); setRowDragOver(null);
  };

  const deptItems = deptOrder.map(dept => ({
    dept,
    color: DEPT_COLORS[dept],
    rows: assignRows(items.filter(x =>
      x.department === dept &&
      x.startDate <= viewEndStr &&
      x.endDate >= viewStartStr
    )),
  }));

  // Compute month boundary positions for markers
  const monthBoundaries: { x: number; label: string }[] = [];
  if (span !== "1M") {
    let cur = new Date(viewStart);
    while (cur <= viewEnd) {
      const y = cur.getFullYear(), m = cur.getMonth();
      const dayOffset = diffDays(viewStartStr, formatDate(cur));
      monthBoundaries.push({ x: dayOffset * dayWidth, label: `${MONTH_NAMES[m].slice(0, 3)}${span === "1Y" ? ` '${String(y).slice(2)}` : ""}` });
      cur = new Date(y, m + 1, 1);
    }
  }

  const renderHeaderCells = () => {
    if (span === "1M") {
      return dayLabels.map((d, i) => {
        const today = new Date();
        const isToday = d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth() && d.getDate() === today.getDate();
        return (
          <div key={i} className={`shrink-0 flex flex-col items-center justify-center border-r border-[#3D3330]/40 last:border-0 ${isToday ? "bg-[#F0684D]/10" : ""}`}
            style={{ width: dayWidth }}>
            <span className={`text-[9px] font-semibold ${isToday ? "text-[#F0684D]" : "text-[#7A6555]"}`}>{d.getDate()}</span>
            {dayWidth > 20 && <span className="text-[8px] text-[#5A4A3E]">{["M","T","W","T","F","S","S"][(d.getDay() + 6) % 7]}</span>}
          </div>
        );
      });
    }
    const months: { label: string; days: number }[] = [];
    let cur = new Date(viewStart);
    while (cur <= viewEnd) {
      const y = cur.getFullYear(), m = cur.getMonth();
      const monthEnd = new Date(y, m + 1, 0);
      const end = monthEnd < viewEnd ? monthEnd : viewEnd;
      const days = diffDays(formatDate(cur), formatDate(end)) + 1;
      months.push({ label: `${MONTH_NAMES[m].slice(0, 3)}${span === "1Y" ? ` '${String(y).slice(2)}` : ""}`, days });
      cur = new Date(y, m + 1, 1);
    }
    return months.map((mo, i) => (
      <div key={i} className="border-r border-[#3D3330]/60 last:border-0 flex items-center justify-center shrink-0"
        style={{ width: mo.days * dayWidth }}>
        <span className="text-[10px] font-semibold text-[#C4A882]">{mo.label}</span>
      </div>
    ));
  };

  const navLabel = span === "1M"
    ? `${MONTH_NAMES[viewStart.getMonth()]} ${viewStart.getFullYear()}`
    : `${MONTH_NAMES[viewStart.getMonth()]} – ${MONTH_NAMES[viewEnd.getMonth()]} ${viewEnd.getFullYear()}`;

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-2 mb-2 shrink-0 flex-wrap">
        <button onClick={() => nav(-1)} className="w-6 h-6 flex items-center justify-center rounded-lg text-[#7A6555] hover:text-[#FFEDD1] hover:bg-[#2E2B2A] text-sm">‹</button>
        <span className="text-sm font-semibold text-[#FFEDD1] min-w-0">{navLabel}</span>
        <button onClick={() => nav(1)} className="w-6 h-6 flex items-center justify-center rounded-lg text-[#7A6555] hover:text-[#FFEDD1] hover:bg-[#2E2B2A] text-sm">›</button>
        <button onClick={goToday}
          className="px-2 py-0.5 rounded-md text-[10px] font-semibold border border-[#3D3330] bg-[#232120] text-[#C4A882] hover:border-[#F0684D]/40 hover:text-[#F0684D] transition-colors">
          Today
        </button>
        {/* Span selector */}
        <div className="flex rounded-lg bg-[#232120] border border-[#3D3330] p-0.5">
          {(["1M", "3M", "6M", "1Y"] as SpanLabel[]).map(s => (
            <button key={s} onClick={() => setSpan(s)}
              className={`px-2 py-0.5 rounded-md text-[10px] font-semibold transition-colors ${span === s ? "bg-[#F0684D] text-white" : "text-[#7A6555] hover:text-[#FFEDD1]"}`}>
              {s}
            </button>
          ))}
        </div>
        <div className="flex-1" />
        <div className="flex gap-2 flex-wrap">
          {DEPARTMENTS.map(d => (
            <div key={d} className="flex items-center gap-1 text-[10px] text-[#C4A882]">
              <span className="w-2 h-2 rounded-sm" style={{ background: DEPT_COLORS[d] }} />{d}
            </div>
          ))}
        </div>
        <button onClick={() => setCreating(true)}
          className="px-3 py-1.5 rounded-lg bg-[#F0684D] text-white text-xs font-semibold hover:bg-[#E05538] transition-colors">
          + Add
        </button>
      </div>

      {/* Gantt grid — single scroll container */}
      <div className="flex-1 min-h-0 rounded-xl border border-[#3D3330] overflow-auto" ref={scrollRef}>
        <div ref={gridRef} style={{ minWidth: DEPT_COL_W + totalDays * dayWidth }}>

          {/* Sticky header row */}
          <div className="flex sticky top-0 z-20 bg-[#232120] border-b border-[#3D3330]" style={{ height: HEADER_H }}>
            {/* Corner cell - sticky left AND top */}
            <div className="shrink-0 sticky left-0 z-30 bg-[#232120] border-r border-[#3D3330]" style={{ width: DEPT_COL_W }} />
            {/* Date/month header cells */}
            <div className="flex" style={{ minWidth: totalDays * dayWidth }}>
              {renderHeaderCells()}
            </div>
          </div>

          {/* Today line */}
          {(() => {
            const today = new Date();
            const todayStr = formatDate(today);
            if (todayStr >= viewStartStr && todayStr <= viewEndStr) {
              const x = DEPT_COL_W + dateToX(todayStr) + dayWidth / 2;
              return <div className="absolute top-0 bottom-0 z-10 pointer-events-none"
                style={{ left: x, width: 1.5, background: "#F0684D60" }} />;
            }
          })()}

          {/* Department rows */}
          {deptItems.map(({ dept, color, rows }) => {
            const numRows = Math.max(1, rows.length > 0 ? Math.max(...rows.map(r => r.row)) + 1 : 1);
            const h = numRows * (ROW_H + ROW_GAP) + ROW_GAP;
            const isDragTarget = rowDragOver === dept;
            return (
              <div key={dept} className="flex border-b border-[#3D3330] relative"
                style={{ height: h, outline: isDragTarget ? "2px solid #F0684D40" : "none", outlineOffset: -1 }}>
                {/* Sticky dept label */}
                <div
                  draggable
                  onDragStart={e => { e.dataTransfer.effectAllowed = "move"; setRowDragging(dept); }}
                  onDragOver={e => { e.preventDefault(); setRowDragOver(dept); }}
                  onDragLeave={() => setRowDragOver(null)}
                  onDrop={() => handleRowDrop(dept)}
                  onDragEnd={() => { setRowDragging(null); setRowDragOver(null); }}
                  className="shrink-0 sticky left-0 z-10 border-r border-[#3D3330] bg-[#232120] flex items-center justify-center gap-1.5 cursor-grab select-none"
                  style={{ width: DEPT_COL_W, opacity: rowDragging === dept ? 0.4 : 1 }}>
                  <span className="text-[#3D3330] text-[10px] select-none">⠿</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded truncate"
                    style={{ background: color + "22", color }}>
                    {dept}
                  </span>
                </div>
                {/* Timeline area */}
                <div className="relative flex-1" style={{ background: color + "08", minWidth: totalDays * dayWidth }}>
                  {/* Month boundary lines */}
                  {span !== "1M" && monthBoundaries.slice(1).map((mb, i) => (
                    <div key={i} className="absolute top-0 bottom-0 pointer-events-none"
                      style={{ left: mb.x, width: 1, background: "#3D3330" }} />
                  ))}
                  {/* Day grid lines */}
                  <div className="absolute inset-0 flex pointer-events-none">
                    {dayLabels.map((_, i) => (
                      <div key={i} className="shrink-0 border-r border-[#3D3330]/20" style={{ width: dayWidth }} />
                    ))}
                  </div>
                  {rows.map(item => {
                    const clampStart = item.startDate < viewStartStr ? viewStartStr : item.startDate;
                    const clampEnd = item.endDate > viewEndStr ? viewEndStr : item.endDate;
                    const x = dateToX(clampStart);
                    const w = Math.max(dayWidth - 2, (diffDays(clampStart, clampEnd) + 1) * dayWidth - 2);
                    const y = ROW_GAP + item.row * (ROW_H + ROW_GAP);
                    return (
                      <div key={item.id}
                        className="absolute rounded group cursor-grab active:cursor-grabbing select-none"
                        style={{ left: x + 1, top: y, width: w, height: ROW_H, background: color, opacity: 0.92 }}
                        onMouseDown={e => { e.preventDefault(); e.stopPropagation(); setDrag({ type: "move", id: item.id, startX: e.clientX, initialStart: item.startDate, initialEnd: item.endDate }); }}
                        onDoubleClick={e => { e.stopPropagation(); setEditing(item); }}>
                        <div className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize z-10 rounded-l hover:bg-black/20"
                          onMouseDown={e => { e.preventDefault(); e.stopPropagation(); setDrag({ type: "resize-left", id: item.id, startX: e.clientX, initialStart: item.startDate, initialEnd: item.endDate }); }} />
                        <div className="px-2 h-full flex items-center gap-1.5 overflow-hidden relative">
                          {item.progress > 0 && (
                            <div className="absolute bottom-0 left-0 h-1 rounded-bl" style={{ width: `${item.progress}%`, background: "rgba(255,255,255,0.45)" }} />
                          )}
                          <span className="text-white text-[10px] font-semibold truncate leading-tight z-10">{item.title}</span>
                          {item.progress > 0 && span === "1M" && <span className="text-white/70 text-[9px] shrink-0 z-10">{item.progress}%</span>}
                        </div>
                        <div className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize z-10 rounded-r hover:bg-black/20"
                          onMouseDown={e => { e.preventDefault(); e.stopPropagation(); setDrag({ type: "resize-right", id: item.id, startX: e.clientX, initialStart: item.startDate, initialEnd: item.endDate }); }} />
                      </div>
                    );
                  })}
                  {rows.length === 0 && (
                    <div className="absolute inset-0 flex items-center pl-3">
                      <span className="text-[10px] text-[#4A3F38]">No items this period</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {creating && <RoadmapForm onSave={saveItem} onClose={() => setCreating(false)} />}
      {editing && <RoadmapForm initial={editing} onSave={saveItem} onDelete={() => deleteItem(editing.id)} onClose={() => setEditing(null)} />}
    </div>
  );
}

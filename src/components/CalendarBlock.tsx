import { useState, useRef, useEffect, useCallback } from "react";
import type { CalEvent, CalView, InviteStatus, Order } from "../types";
import {
  HOURS, HOUR_H, HEADER_H, TIME_COL_W,
  DAY_SHORT, MONTH_NAMES,
  addDays, getMonday, formatDate, isSameDay,
  MEMBERS, avatarBg, memberIdx, INIT_EVENTS, ORDERS,
} from "../data";
import { EventFormModal } from "./EventFormModal";
import { EventDetailModal } from "./EventDetailModal";
import { RoadmapBlock } from "./RoadmapBlock";

const STATUS_DOT: Record<InviteStatus, string> = {
  accepted: "bg-emerald-400", pending: "bg-amber-400", declined: "bg-rose-400",
};

interface DragState {
  type: "move" | "resize-bottom" | "resize-top";
  eventId: string;
  offsetRows: number;
  initialDate: string;
  initialStart: string;
  initialEnd: string;
}
interface MonthDrag { eventId: string; targetDate: string; }
interface Ghost { date: string; startTime: string; endTime: string; }

function timeToFrac(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return (h - HOURS[0]) + m / 60;
}
function fracToTime(frac: number): string {
  const clamped = Math.max(0, Math.min(HOURS.length - 0.5, frac));
  const total = Math.round(clamped * 60);
  const h = Math.floor(total / 60) + HOURS[0];
  const m = total % 60;
  return `${String(Math.min(23, h)).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function OrderPopup({ order, onClose }: { order: Order; onClose: () => void }) {
  const total = order.items.reduce((s, i) => s + i.qty * i.price, 0);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="animate-slide-up w-full max-w-sm rounded-2xl border border-[#3D3330] bg-[#2A2724] shadow-2xl p-5" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-semibold text-[#FFEDD1]">{order.title}</h2>
            <div className="text-xs text-[#7A6555]">{order.date} · {order.startTime}</div>
          </div>
          <button onClick={onClose} className="text-[#7A6555] hover:text-[#FFEDD1] text-sm">✕</button>
        </div>
        <div className="space-y-2 mb-4">
          {order.items.map((item, i) => (
            <div key={i} className="flex items-center justify-between text-sm">
              <span className="text-[#C4A882]">{item.name}</span>
              <div className="flex items-center gap-3">
                <span className="text-[#7A6555] text-xs">×{item.qty}</span>
                <span className="text-[#FFEDD1] font-medium">€{item.qty * item.price}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between pt-3 border-t border-[#3D3330]">
          <span className="text-sm text-[#C4A882]">Total</span>
          <span className="font-bold text-[#FFEDD1]">€{total}</span>
        </div>
      </div>
    </div>
  );
}

function HoverTooltip({ event, x, y }: { event: CalEvent; x: number; y: number }) {
  const statusCount = (s: InviteStatus) => event.invitees.filter(i => i.status === s).length;
  return (
    <div className="fixed z-[200] pointer-events-none animate-fade-in"
      style={{ left: Math.min(x + 14, window.innerWidth - 220), top: Math.max(8, y - 8) }}>
      <div className="w-52 rounded-xl border border-[#3D3330] bg-[#2A2724] shadow-xl p-3 text-xs">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: event.color }} />
          <span className="font-semibold text-[#FFEDD1] truncate">{event.title}</span>
        </div>
        <div className="text-[#C4A882] space-y-0.5">
          <div>{event.startTime} – {event.endTime}</div>
          {event.location && <div>{event.location}</div>}
          {event.invitees.length > 0 && (
            <div className="flex gap-2 mt-1">
              {statusCount("accepted") > 0 && <span className="text-emerald-600">✓{statusCount("accepted")}</span>}
              {statusCount("pending") > 0 && <span className="text-amber-600">?{statusCount("pending")}</span>}
              {statusCount("declined") > 0 && <span className="text-[#F0684D]">✗{statusCount("declined")}</span>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SyncModal({ onClose }: { onClose: () => void }) {
  const [id, setId] = useState("");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="animate-slide-up w-full max-w-sm rounded-2xl border border-[#3D3330] bg-[#2A2724] shadow-2xl p-5" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-[#FFEDD1]">Sync Google Calendar</h2>
          <button onClick={onClose} className="text-[#7A6555] hover:text-[#FFEDD1] text-sm">✕</button>
        </div>
        <input value={id} onChange={e => setId(e.target.value)} placeholder="calendar@group.calendar.google.com"
          className="w-full bg-[#232120] border border-[#3D3330] rounded-lg px-3 py-2 text-sm text-[#FFEDD1] placeholder:text-[#7A6555] focus:outline-none focus:border-[#F0684D] mb-3" />
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2 rounded-xl text-sm bg-[#232120] border border-[#3D3330] text-[#C4A882] hover:bg-[#2E2B2A]">Cancel</button>
          <button className="flex-1 py-2 rounded-xl text-sm bg-[#F0684D] text-white hover:bg-[#E05538]">Connect</button>
        </div>
      </div>
    </div>
  );
}

export function CalendarBlock() {
  const [mode, setMode] = useState<"agenda" | "roadmap">("agenda");
  const [view, setView] = useState<CalView>("week");
  const [viewDate, setViewDate] = useState<Date>(() => getMonday(new Date()));
  const [events, setEvents] = useState<CalEvent[]>(INIT_EVENTS);
  const [search, setSearch] = useState("");
  const [personFilter, setPersonFilter] = useState<string | null>(null);
  const [showSync, setShowSync] = useState(false);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<CalEvent | null>(null);
  const [detail, setDetail] = useState<CalEvent | null>(null);
  const [orderPopup, setOrderPopup] = useState<Order | null>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [ghost, setGhost] = useState<Ghost | null>(null);
  const [monthDrag, setMonthDrag] = useState<MonthDrag | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const eventIdsRef = useRef<Set<string>>(new Set());

  // Document-level hover tracking
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (dragState) { setHoveredId(null); setTooltipPos(null); return; }
      const el = document.elementFromPoint(e.clientX, e.clientY);
      const closest = el?.closest("[data-event-id]");
      const id = closest?.getAttribute("data-event-id") ?? null;
      if (id && eventIdsRef.current.has(id)) {
        setHoveredId(id);
        setTooltipPos({ x: e.clientX, y: e.clientY });
      } else {
        setHoveredId(null);
        setTooltipPos(null);
      }
    };
    document.addEventListener("mousemove", onMove);
    return () => document.removeEventListener("mousemove", onMove);
  }, [dragState]);

  eventIdsRef.current = new Set(events.map(e => e.id));

  const viewDates: Date[] = (() => {
    if (view === "day") return [viewDate];
    if (view === "week") { const mon = getMonday(viewDate); return Array.from({ length: 7 }, (_, i) => addDays(mon, i)); }
    const y = viewDate.getFullYear(), m = viewDate.getMonth();
    return Array.from({ length: new Date(y, m + 1, 0).getDate() }, (_, i) => new Date(y, m, i + 1));
  })();
  const numCols = viewDates.length;

  const navTitle = (() => {
    if (view === "day") return viewDate.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
    if (view === "week") {
      const mon = getMonday(viewDate), sun = addDays(mon, 6);
      return `${mon.toLocaleDateString("en-GB", { day: "numeric", month: "short" })} – ${sun.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`;
    }
    return `${MONTH_NAMES[viewDate.getMonth()]} ${viewDate.getFullYear()}`;
  })();

  const navigate = (dir: 1 | -1) => setViewDate(d => {
    if (view === "day") return addDays(d, dir);
    if (view === "week") return addDays(d, dir * 7);
    const r = new Date(d); r.setMonth(r.getMonth() + dir); return r;
  });

  const goToday = () => {
    const today = new Date();
    setViewDate(view === "week" ? getMonday(today) : today);
  };

  const filteredEvents = events.filter(ev => {
    if (search && !ev.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (personFilter && !ev.invitees.some(i => i.memberId === personFilter)) return false;
    return true;
  });
  const eventsForDate = (d: Date) => filteredEvents.filter(ev => ev.date === formatDate(d));
  const ordersForDate = (d: Date) => ORDERS.filter(o => o.date === formatDate(d));

  const startDrag = useCallback((e: React.MouseEvent, ev: CalEvent) => {
    e.preventDefault(); e.stopPropagation();
    setHoveredId(null); setTooltipPos(null);
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setDragState({ type: "move", eventId: ev.id, offsetRows: (e.clientY - rect.top) / HOUR_H, initialDate: ev.date, initialStart: ev.startTime, initialEnd: ev.endTime });
    setGhost({ date: ev.date, startTime: ev.startTime, endTime: ev.endTime });
  }, []);

  const startResizeBottom = useCallback((e: React.MouseEvent, ev: CalEvent) => {
    e.preventDefault(); e.stopPropagation();
    setDragState({ type: "resize-bottom", eventId: ev.id, offsetRows: 0, initialDate: ev.date, initialStart: ev.startTime, initialEnd: ev.endTime });
    setGhost({ date: ev.date, startTime: ev.startTime, endTime: ev.endTime });
  }, []);

  const startResizeTop = useCallback((e: React.MouseEvent, ev: CalEvent) => {
    e.preventDefault(); e.stopPropagation();
    setDragState({ type: "resize-top", eventId: ev.id, offsetRows: 0, initialDate: ev.date, initialStart: ev.startTime, initialEnd: ev.endTime });
    setGhost({ date: ev.date, startTime: ev.startTime, endTime: ev.endTime });
  }, []);

  useEffect(() => {
    if (!dragState) return;
    const onMove = (e: MouseEvent) => {
      if (!gridRef.current) return;
      const rect = gridRef.current.getBoundingClientRect();
      const scrollTop = gridRef.current.scrollTop;
      const colW = (rect.width - TIME_COL_W) / numCols;

      if (dragState.type === "move") {
        const relX = e.clientX - rect.left - TIME_COL_W;
        const colIdx = Math.max(0, Math.min(numCols - 1, Math.floor(relX / colW)));
        const targetDate = viewDates[colIdx] ?? viewDates[0];
        const relY = e.clientY - rect.top + scrollTop - HEADER_H;
        const rawRow = relY / HOUR_H - dragState.offsetRows;
        const snapped = Math.round(rawRow * 2) / 2;
        const clamped = Math.max(0, Math.min(HOURS.length - 2, snapped));
        const startTime = fracToTime(clamped);
        const [sh, sm] = dragState.initialStart.split(":").map(Number);
        const [eh, em] = dragState.initialEnd.split(":").map(Number);
        const durMins = (eh * 60 + em) - (sh * 60 + sm);
        const [nsh, nsm] = startTime.split(":").map(Number);
        const endMins = nsh * 60 + nsm + durMins;
        const endTime = `${String(Math.min(23, Math.floor(endMins / 60))).padStart(2, "0")}:${String(endMins % 60).padStart(2, "0")}`;
        setGhost({ date: formatDate(targetDate), startTime, endTime });

      } else if (dragState.type === "resize-bottom") {
        const relY = e.clientY - rect.top + scrollTop - HEADER_H;
        const endFrac = Math.round((relY / HOUR_H) * 2) / 2;
        // endFrac is relative to HOURS[0]; compare against start position in same scale
        if (endFrac > timeToFrac(dragState.initialStart) + 0.5) {
          setGhost(g => g ? { ...g, endTime: fracToTime(Math.max(0, endFrac)) } : null);
        }
      } else if (dragState.type === "resize-top") {
        const relY = e.clientY - rect.top + scrollTop - HEADER_H;
        const startFrac = Math.round((relY / HOUR_H) * 2) / 2;
        if (startFrac < timeToFrac(dragState.initialEnd) - 0.5) {
          setGhost(g => g ? { ...g, startTime: fracToTime(Math.max(0, startFrac)) } : null);
        }
      }
    };
    const onUp = () => {
      if (ghost) setEvents(prev => prev.map(ev => ev.id === dragState.eventId
        ? { ...ev, date: ghost.date, startTime: ghost.startTime, endTime: ghost.endTime, endDate: ghost.date }
        : ev));
      setDragState(null); setGhost(null); setHoveredId(null);
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    return () => { document.removeEventListener("mousemove", onMove); document.removeEventListener("mouseup", onUp); };
  }, [dragState, ghost, numCols, viewDates]);

  const startMonthDrag = useCallback((e: React.MouseEvent, ev: CalEvent) => {
    e.preventDefault(); e.stopPropagation();
    setMonthDrag({ eventId: ev.id, targetDate: ev.date });
  }, []);

  useEffect(() => {
    if (!monthDrag) return;
    const onUp = () => {
      if (monthDrag.targetDate) {
        setEvents(prev => prev.map(ev => ev.id === monthDrag.eventId
          ? { ...ev, date: monthDrag.targetDate, endDate: monthDrag.targetDate } : ev));
      }
      setMonthDrag(null);
    };
    document.addEventListener("mouseup", onUp);
    return () => document.removeEventListener("mouseup", onUp);
  }, [monthDrag]);

  const saveEvent = (ev: CalEvent) => {
    setEvents(prev => prev.some(e => e.id === ev.id) ? prev.map(e => e.id === ev.id ? ev : e) : [...prev, ev]);
    setEditing(null); setCreating(false);
    if (detail?.id === ev.id) setDetail(ev);
  };

  const suggestions = search
    ? MEMBERS.filter(m => m.name.toLowerCase().includes(search.toLowerCase()) && !personFilter)
    : [];

  const renderWeekDayGrid = () => {
    const today = new Date();
    const HANDLE = 7;
    return (
      <div ref={gridRef} className="flex flex-1 overflow-auto min-h-0 rounded-xl border border-[#3D3330] bg-[#2A2724]">
        {/* Time column */}
        <div className="shrink-0 sticky left-0 z-10 bg-[#232120] border-r border-[#3D3330]" style={{ width: TIME_COL_W, alignSelf: "flex-start", minHeight: "100%" }}>
          <div style={{ height: HEADER_H }} className="border-b border-[#3D3330]" />
          {HOURS.map(h => (
            <div key={h} style={{ height: HOUR_H }} className="flex items-start justify-end pr-2 border-b border-[#3D3330]/30">
              <span className="text-[9px] text-[#5A4A3E] -mt-1.5">{h}:00</span>
            </div>
          ))}
        </div>
        {/* Day columns */}
        <div className="flex flex-1 bg-[#2A2724]">
          {viewDates.map((d, colIdx) => {
            const isToday = isSameDay(d, today);
            const colEvs = eventsForDate(d);
            const colOrders = ordersForDate(d);
            const dateStr = formatDate(d);
            return (
              <div key={colIdx} className="flex-1 border-r border-[#3D3330] last:border-r-0 min-w-[64px]">
                <div style={{ height: HEADER_H }} className={`sticky top-0 z-10 border-b border-[#3D3330] flex flex-col items-center justify-center ${isToday ? "bg-[#F0684D]/10" : "bg-[#2A2724]"}`}>
                  <span className="text-[9px] text-[#5A4A3E]">{DAY_SHORT[colIdx % 7]}</span>
                  <span className={`text-xs font-semibold ${isToday ? "text-[#F0684D]" : "text-[#C4A882]"}`}>{d.getDate()}</span>
                </div>
                <div className="relative">
                  {HOURS.map(h => <div key={h} style={{ height: HOUR_H }} className="border-b border-[#3D3330]/20" />)}
                  {isToday && (() => {
                    const now = new Date();
                    const frac = (now.getHours() - HOURS[0]) + now.getMinutes() / 60;
                    if (frac < 0 || frac > HOURS.length) return null;
                    return <div className="absolute left-0 right-0 z-20 flex items-center pointer-events-none" style={{ top: frac * HOUR_H }}>
                      <div className="w-2 h-2 rounded-full bg-[#F0684D] -ml-1" /><div className="flex-1 h-px bg-[#F0684D]/50" />
                    </div>;
                  })()}

                  {colEvs.map(ev => {
                    const isDragging = dragState?.eventId === ev.id;
                    const disp = isDragging && ghost ? { ...ev, startTime: ghost.startTime, endTime: ghost.endTime } : ev;
                    const top = timeToFrac(disp.startTime) * HOUR_H;
                    const [sh, sm] = disp.startTime.split(":").map(Number);
                    const [eh, em] = disp.endTime.split(":").map(Number);
                    const height = Math.max(22, ((eh * 60 + em) - (sh * 60 + sm)) / 60 * HOUR_H - 2);
                    return (
                      <div key={ev.id}
                        data-event-id={ev.id}
                        className="absolute inset-x-0.5 rounded-md select-none"
                        style={{ top, height, opacity: isDragging ? 0.5 : 1, background: ev.color + "20", borderLeft: `3px solid ${ev.color}`, zIndex: 2 }}>
                        <div className="absolute left-0 right-0 z-10 cursor-n-resize hover:bg-black/5"
                          style={{ height: HANDLE, top: 0 }}
                          onMouseDown={e => { e.stopPropagation(); if (!dragState) startResizeTop(e, ev); }} />
                        <div className="absolute left-0 right-0 overflow-hidden px-1.5 cursor-grab active:cursor-grabbing"
                          style={{ top: HANDLE, bottom: HANDLE }}
                          onMouseDown={e => { if (!dragState) startDrag(e, ev); }}
                          onClick={e => { e.stopPropagation(); if (!dragState) setDetail(ev); }}>
                          <div className="text-[9px] font-bold truncate leading-tight mt-0.5" style={{ color: ev.color }}>{ev.title}</div>
                          <div className="text-[8px] opacity-60" style={{ color: ev.color }}>{disp.startTime}–{disp.endTime}</div>
                          {ev.invitees.length > 0 && (
                            <div className="flex gap-0.5 mt-0.5 flex-wrap">
                              {ev.invitees.slice(0, 6).map(inv => (
                                <span key={inv.memberId} className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[inv.status]}`} />
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="absolute left-0 right-0 z-10 cursor-s-resize hover:bg-black/5"
                          style={{ height: HANDLE, bottom: 0 }}
                          onMouseDown={e => { e.stopPropagation(); if (!dragState) startResizeBottom(e, ev); }} />
                      </div>
                    );
                  })}

                  {colOrders.map(ord => {
                    const top = timeToFrac(ord.startTime) * HOUR_H;
                    const [sh, sm] = ord.startTime.split(":").map(Number);
                    const [eh, em] = ord.endTime.split(":").map(Number);
                    const height = Math.max(20, ((eh * 60 + em) - (sh * 60 + sm)) / 60 * HOUR_H - 2);
                    return (
                      <div key={ord.id}
                        className="absolute inset-x-0.5 rounded-md cursor-pointer hover:opacity-80 transition-opacity select-none"
                        style={{ top, height, background: "#FFD14233", borderLeft: "3px solid #FFD142", zIndex: 3 }}
                        onClick={e => { e.stopPropagation(); setOrderPopup(ord); }}>
                        <div className="px-1.5 pt-0.5">
                          <div className="text-[9px] font-bold text-amber-700 truncate">{ord.title}</div>
                          <div className="text-[8px] text-amber-600/70">{ord.items.length} items</div>
                        </div>
                      </div>
                    );
                  })}

                  {dragState?.type === "move" && ghost?.date === dateStr && (() => {
                    const [sh, sm] = ghost.startTime.split(":").map(Number);
                    const [eh, em] = ghost.endTime.split(":").map(Number);
                    const top = timeToFrac(ghost.startTime) * HOUR_H;
                    const height = Math.max(22, ((eh * 60 + em) - (sh * 60 + sm)) / 60 * HOUR_H - 2);
                    const origEv = events.find(e => e.id === dragState.eventId);
                    return <div className="absolute inset-x-0.5 rounded-md pointer-events-none border-2 border-dashed z-10"
                      style={{ top, height, background: origEv?.color + "10", borderColor: origEv?.color + "60" }} />;
                  })()}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderMonthGrid = () => {
    const today = new Date();
    const y = viewDate.getFullYear(), mo = viewDate.getMonth();
    const first = new Date(y, mo, 1);
    const offset = (first.getDay() + 6) % 7;
    const gridStart = addDays(first, -offset);
    const cells = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
    const weeks = Array.from({ length: 6 }, (_, i) => cells.slice(i * 7, (i + 1) * 7));
    return (
      <div className="flex-1 flex flex-col min-h-0 rounded-xl border border-[#3D3330] overflow-hidden">
        <div className="grid grid-cols-7 border-b border-[#3D3330] bg-[#232120]">
          {["Mo","Tu","We","Th","Fr","Sa","Su"].map(d => (
            <div key={d} className="text-center text-[10px] font-semibold text-[#7A6555] py-1.5 border-r border-[#3D3330] last:border-0">{d}</div>
          ))}
        </div>
        <div className="flex-1 overflow-auto bg-[#2A2724]">
          {weeks.map((week, wi) => (
            <div key={wi} className="grid grid-cols-7 border-b border-[#3D3330] last:border-0" style={{ minHeight: 72 }}>
              {week.map((d, di) => {
                const isCurMo = d.getMonth() === mo;
                const isToday = isSameDay(d, today);
                const dayEvs = eventsForDate(d);
                const dayOrds = ordersForDate(d);
                const dateStr = formatDate(d);
                const isTarget = monthDrag?.targetDate === dateStr;
                return (
                  <div key={di}
                    className={`border-r border-[#3D3330] last:border-0 p-1 transition-colors ${isCurMo ? "" : "opacity-30"} ${isTarget ? "bg-[#F0684D]/5" : ""}`}
                    onMouseEnter={() => monthDrag && setMonthDrag(prev => prev ? { ...prev, targetDate: dateStr } : null)}>
                    <div className={`text-[10px] font-semibold mb-0.5 w-5 h-5 rounded-full flex items-center justify-center ${isToday ? "bg-[#F0684D] text-white" : "text-[#C4A882]"}`}>{d.getDate()}</div>
                    {dayOrds.map(ord => (
                      <div key={ord.id}
                        className="w-full truncate text-[9px] rounded px-1 py-0.5 mb-0.5 cursor-pointer hover:opacity-80"
                        style={{ background: "#FFD14222", color: "#b45309" }}
                        onClick={e => { e.stopPropagation(); setOrderPopup(ord); }}>
                        {ord.title}
                      </div>
                    ))}
                    {dayEvs.slice(0, 2).map(ev => (
                      <button key={ev.id}
                        className={`w-full text-left truncate text-[9px] font-medium rounded px-1 py-0.5 mb-0.5 select-none ${monthDrag?.eventId === ev.id ? "opacity-30" : "hover:opacity-80"}`}
                        style={{ background: ev.color + "22", color: ev.color }}
                        onMouseDown={e => startMonthDrag(e, ev)}
                        onClick={e => { e.stopPropagation(); setDetail(ev); }}>
                        {ev.startTime} {ev.title}
                      </button>
                    ))}
                    {dayEvs.length > 2 && <div className="text-[8px] text-[#7A6555]">+{dayEvs.length - 2} more</div>}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full gap-2">
      {/* Toolbar */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="flex rounded-lg bg-[#232120] border border-[#3D3330] p-0.5 shrink-0">
          {(["agenda", "roadmap"] as const).map(m => (
            <button key={m} onClick={() => setMode(m)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium capitalize transition-colors ${mode === m ? "bg-[#F0684D] text-white" : "text-[#7A6555] hover:text-[#FFEDD1]"}`}>
              {m === "agenda" ? "Agenda" : "Roadmap"}
            </button>
          ))}
        </div>

        {mode === "agenda" && <>
          <button onClick={() => setShowSync(true)} title="Sync Google Calendar"
            className="w-7 h-7 flex items-center justify-center rounded-lg border border-[#3D3330] bg-[#232120] text-[#7A6555] hover:text-[#FFEDD1] text-xs shrink-0">
            Sync
          </button>
          <div className="relative flex-1">
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search events or members…"
              className="w-full bg-[#232120] border border-[#3D3330] rounded-lg pl-3 pr-3 py-1.5 text-xs text-[#FFEDD1] placeholder:text-[#7A6555] focus:outline-none focus:border-[#F0684D] transition-colors" />
            {suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 z-20 mt-0.5 rounded-xl border border-[#3D3330] bg-[#2A2724] shadow-xl overflow-hidden">
                {suggestions.map((m, i) => (
                  <button key={m.id} onClick={() => { setPersonFilter(m.id); setSearch(""); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-[#232120] transition-colors">
                    <span className={`w-5 h-5 rounded-full ${avatarBg(i)} text-white text-[9px] font-bold flex items-center justify-center`}>{m.avatar}</span>
                    <span className="text-[#FFEDD1]">{m.name}</span>
                    <span className="text-[#7A6555] ml-auto">{m.team}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          {personFilter && (() => {
            const m = MEMBERS.find(x => x.id === personFilter);
            return m ? (
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-[#F0684D]/10 text-[#F0684D] border border-[#F0684D]/25 text-xs shrink-0">
                <span>{m.name.split(" ")[0]}</span>
                <button onClick={() => setPersonFilter(null)} className="hover:text-[#FFEDD1]">✕</button>
              </div>
            ) : null;
          })()}
          <div className="flex rounded-lg bg-[#232120] border border-[#3D3330] p-0.5 shrink-0">
            {(["day", "week", "month"] as CalView[]).map(v => (
              <button key={v} onClick={() => setView(v)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium capitalize transition-colors ${view === v ? "bg-[#F0684D] text-white" : "text-[#7A6555] hover:text-[#FFEDD1]"}`}>
                {v}
              </button>
            ))}
          </div>
        </>}

        <button onClick={() => setCreating(true)}
          className="shrink-0 px-2.5 py-1.5 rounded-lg bg-[#F0684D] text-white text-xs font-semibold hover:bg-[#E05538] transition-colors">
          + New
        </button>
      </div>

      {/* Navigation */}
      {mode === "agenda" && (
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={() => navigate(-1)} className="w-6 h-6 flex items-center justify-center rounded-lg text-[#7A6555] hover:text-[#FFEDD1] hover:bg-[#2E2B2A] text-sm">‹</button>
          <span className="flex-1 text-center text-xs font-medium text-[#C4A882]">{navTitle}</span>
          <button onClick={() => navigate(1)} className="w-6 h-6 flex items-center justify-center rounded-lg text-[#7A6555] hover:text-[#FFEDD1] hover:bg-[#2E2B2A] text-sm">›</button>
          <button onClick={goToday}
            className="px-2 py-0.5 rounded-md text-[10px] font-semibold border border-[#3D3330] bg-[#232120] text-[#C4A882] hover:border-[#F0684D]/40 hover:text-[#F0684D] transition-colors">
            Today
          </button>
        </div>
      )}

      {mode === "roadmap" ? <RoadmapBlock /> : (view === "month" ? renderMonthGrid() : renderWeekDayGrid())}

      {mode === "agenda" && hoveredId && !dragState && tooltipPos && (() => {
        const ev = events.find(e => e.id === hoveredId);
        return ev ? <HoverTooltip event={ev} x={tooltipPos.x} y={tooltipPos.y} /> : null;
      })()}

      {showSync && <SyncModal onClose={() => setShowSync(false)} />}
      {creating && <EventFormModal onSave={saveEvent} onClose={() => setCreating(false)} />}
      {editing && <EventFormModal initial={editing} onSave={saveEvent} onClose={() => setEditing(null)} />}
      {detail && !editing && (
        <EventDetailModal event={detail} onClose={() => setDetail(null)} onEdit={() => { setEditing(detail); setDetail(null); }} />
      )}
      {orderPopup && <OrderPopup order={orderPopup} onClose={() => setOrderPopup(null)} />}
    </div>
  );
}

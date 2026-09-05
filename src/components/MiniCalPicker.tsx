import { useState } from "react";
import { MONTH_NAMES, DAY_SHORT, addDays, formatDate, parseDate, isSameDay } from "../data";

interface Props {
  value: string;       // YYYY-MM-DD
  onChange: (d: string) => void;
  onClose?: () => void;
  inline?: boolean;    // render without absolute positioning
}

export function MiniCalPicker({ value, onChange, onClose, inline }: Props) {
  const today = new Date();
  const selected = value ? parseDate(value) : null;
  const [viewDate, setViewDate] = useState<Date>(() => {
    if (value) { const d = parseDate(value); d.setDate(1); return d; }
    const d = new Date(today); d.setDate(1); return d;
  });

  const prevMonth = () => setViewDate(d => { const r = new Date(d); r.setMonth(r.getMonth() - 1); return r; });
  const nextMonth = () => setViewDate(d => { const r = new Date(d); r.setMonth(r.getMonth() + 1); return r; });

  const firstDay = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
  const startOffset = (firstDay.getDay() + 6) % 7; // Mon=0
  const gridStart = addDays(firstDay, -startOffset);
  const cells: Date[] = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));

  const cls = inline
    ? "bg-[#232120] border border-[#3D3330] rounded-xl p-3 w-60"
    : "absolute z-40 top-full left-0 mt-1 bg-[#232120] border border-[#3D3330] rounded-xl shadow-2xl p-3 w-60";

  return (
    <div className={cls} onClick={e => e.stopPropagation()}>
      <div className="flex items-center justify-between mb-2">
        <button onClick={prevMonth}
          className="w-6 h-6 flex items-center justify-center text-[#C4A882] hover:text-[#FFEDD1] rounded hover:bg-[#232120] text-lg">
          ‹
        </button>
        <span className="text-sm font-semibold text-[#FFEDD1]">
          {MONTH_NAMES[viewDate.getMonth()]} {viewDate.getFullYear()}
        </span>
        <button onClick={nextMonth}
          className="w-6 h-6 flex items-center justify-center text-[#C4A882] hover:text-[#FFEDD1] rounded hover:bg-[#232120] text-lg">
          ›
        </button>
      </div>
      <div className="grid grid-cols-7 mb-1">
        {DAY_SHORT.map(d => (
          <div key={d} className="text-center text-[9px] font-semibold text-[#7A6555] py-0.5">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-px">
        {cells.map((d, i) => {
          const isToday = isSameDay(d, today);
          const isSel = selected && isSameDay(d, selected);
          const isCurMonth = d.getMonth() === viewDate.getMonth();
          return (
            <button key={i}
              onClick={() => { onChange(formatDate(d)); onClose?.(); }}
              className={[
                "h-7 w-7 rounded-full text-xs flex items-center justify-center mx-auto transition-colors",
                isSel ? "bg-[#F0684D] text-white font-semibold" :
                isToday ? "bg-rose-600 text-white font-semibold" :
                isCurMonth ? "text-[#FFEDD1] hover:bg-[#232120]" :
                "text-[#7A6555] hover:bg-[#232120]"
              ].join(" ")}>
              {d.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

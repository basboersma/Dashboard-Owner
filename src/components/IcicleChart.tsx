import { useState } from "react";
import { ResponsiveIcicle } from "@nivo/icicle";
import type { BudgetData } from "../types";
import { MONTHLY_SPEND } from "../data";

interface Props { data: BudgetData; }

const fmt = (n: number) => `€${n.toLocaleString("nl-NL")}`;

const DARK_THEME = {
  background: "transparent",
  text: { fill: "#C4A882", fontSize: 10 },
  labels: { text: { fill: "#fff", fontSize: 9, fontWeight: 700 } },
  tooltip: { container: { background: "#2A2724", color: "#FFEDD1", borderRadius: 8, fontSize: 12, border: "1px solid #3D3330", boxShadow: "0 4px 16px rgba(0,0,0,0.4)" } },
};

type Period = "1M" | "6M" | "1Y";
const PERIOD_MONTHS: Record<Period, number> = { "1M": 1, "6M": 6, "1Y": 12 };

function smoothPath(pts: { x: number; y: number }[]): string {
  if (pts.length < 2) return "";
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    const prev = pts[i - 1], curr = pts[i];
    const cpx = (prev.x + curr.x) / 2;
    d += ` C ${cpx} ${prev.y} ${cpx} ${curr.y} ${curr.x} ${curr.y}`;
  }
  return d;
}

function SpendingChart({ name, color }: { name: string; color: string }) {
  const [period, setPeriod] = useState<Period>("6M");
  const allData = MONTHLY_SPEND[name] ?? MONTHLY_SPEND.Total;
  const data = allData.slice(-PERIOD_MONTHS[period]);
  const maxY = Math.max(...data.map(d => Math.max(d.budget, d.spent))) * 1.15;
  const W = 240, H = 120, PAD = { l: 34, r: 8, t: 12, b: 24 };
  const iW = W - PAD.l - PAD.r, iH = H - PAD.t - PAD.b;
  const toX = (i: number) => PAD.l + (i / (data.length - 1 || 1)) * iW;
  const toY = (v: number) => PAD.t + iH - (v / maxY) * iH;

  const budgetPts = data.map((d, i) => ({ x: toX(i), y: toY(d.budget) }));
  const spentPts  = data.map((d, i) => ({ x: toX(i), y: toY(d.spent) }));

  const areaPath = spentPts.length > 1
    ? `${smoothPath(spentPts)} L ${spentPts[spentPts.length - 1].x} ${PAD.t + iH} L ${spentPts[0].x} ${PAD.t + iH} Z`
    : "";

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-1 shrink-0">
        <span className="text-[10px] font-semibold text-[#C4A882] uppercase tracking-wider truncate">{name}</span>
        <div className="flex items-center gap-0.5">
          {(["1M","6M","1Y"] as Period[]).map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-1.5 py-0.5 rounded text-[8px] font-semibold transition-colors ${period === p ? "bg-[#3D3330] text-[#FFEDD1]" : "text-[#7A6555] hover:text-[#C4A882]"}`}>
              {p}
            </button>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-3 mb-1 shrink-0">
        <span className="flex items-center gap-1 text-[8px] text-[#7A6555]">
          <svg width="14" height="2"><line x1="0" y1="1" x2="14" y2="1" stroke={color} strokeWidth="1.5" strokeDasharray="3,2" /></svg>
          Budget
        </span>
        <span className="flex items-center gap-1 text-[8px] text-[#7A6555]">
          <svg width="14" height="2"><line x1="0" y1="1" x2="14" y2="1" stroke={color} strokeWidth="1.5" /></svg>
          Spent
        </span>
      </div>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} className="flex-1">
        <defs>
          <linearGradient id={`grad-${name.replace(/\s/g,"")}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.25" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {[0, 0.25, 0.5, 0.75, 1].map(f => {
          const y = PAD.t + iH * (1 - f);
          const val = Math.round(maxY * f);
          return (
            <g key={f}>
              <line x1={PAD.l} x2={W - PAD.r} y1={y} y2={y} stroke="#3D3330" strokeWidth={0.5} />
              <text x={PAD.l - 3} y={y + 3} textAnchor="end" fontSize={7} fill="#7A6555">
                {val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}
              </text>
            </g>
          );
        })}
        {areaPath && <path d={areaPath} fill={`url(#grad-${name.replace(/\s/g,"")})`} />}
        {budgetPts.length > 1 && (
          <path d={smoothPath(budgetPts)} fill="none" stroke={color} strokeWidth={1} strokeDasharray="4,3" strokeOpacity={0.5} />
        )}
        {spentPts.length > 1 && (
          <path d={smoothPath(spentPts)} fill="none" stroke={color} strokeWidth={1.5} />
        )}
        {spentPts.map((pt, i) => (
          <circle key={i} cx={pt.x} cy={pt.y} r={2} fill={color} />
        ))}
        {data.map((d, i) => (
          <text key={i} x={toX(i)} y={H - 6} textAnchor="middle" fontSize={7} fill="#7A6555">{d.month}</text>
        ))}
      </svg>
    </div>
  );
}

function buildNivoData(data: BudgetData, drillStack: string[]) {
  if (drillStack.length === 0) {
    return {
      id: "Budget",
      children: data.departments.map(d => ({ id: d.name, value: d.budget, color: d.color })),
    };
  }
  const dept = data.departments.find(d => d.name === drillStack[0]);
  if (!dept) return { id: "Budget", children: data.departments.map(d => ({ id: d.name, value: d.budget, color: d.color })) };
  if (drillStack.length === 1) {
    return {
      id: dept.name,
      color: dept.color,
      children: dept.subs.map(sub => ({
        id: sub.name,
        value: sub.budget,
        color: dept.color + "bb",
        ...(sub.subs && sub.subs.length > 0 ? {
          children: sub.subs.map(ss => ({ id: ss.name, value: ss.budget, color: dept.color + "77" })),
        } : {}),
      })),
    };
  }
  const sub = dept.subs.find(s => s.name === drillStack[1]);
  if (!sub) return { id: dept.name, color: dept.color, children: dept.subs.map(s => ({ id: s.name, value: s.budget, color: dept.color + "bb" })) };
  return {
    id: sub.name,
    color: dept.color + "bb",
    children: (sub.subs ?? []).map(ss => ({ id: ss.name, value: ss.budget, color: dept.color + "77" })),
  };
}

export function IcicleChart({ data }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [drillStack, setDrillStack] = useState<string[]>([]);
  const [selectedNode, setSelectedNode] = useState<{ name: string; color: string } | null>(null);

  const totalPct = Math.round(data.spent / data.total * 100);
  const nivoData = buildNivoData(data, drillStack);

  const getDeptColor = (name: string) => data.departments.find(d => d.name === name)?.color ?? "#F0684D";

  const handleClick = (node: any) => {
    const depth: number = node.hierarchy?.depth ?? 0;
    const id: string = node.data?.id ?? "";

    if (depth === 0 && drillStack.length > 0) {
      setDrillStack(s => s.slice(0, -1));
      setSelectedNode(null);
      return;
    }

    const deptName = drillStack[0] ?? id;
    const deptColor = getDeptColor(deptName);

    // Show spending chart for whatever was clicked (dept or sub)
    const spendName = drillStack.length === 0 ? id : id;
    setSelectedNode({ name: spendName, color: deptColor });

    if (drillStack.length === 0) {
      // Clicking a dept — drill in to show its subs
      setDrillStack([id]);
    } else if (drillStack.length === 1) {
      // Clicking a sub — drill in if it has subsubs
      const dept = data.departments.find(d => d.name === drillStack[0]);
      const sub = dept?.subs.find(s => s.name === id);
      if (sub?.subs && sub.subs.length > 0) setDrillStack([drillStack[0], id]);
    }
  };

  const breadcrumb = ["Budget", ...drillStack];

  return (
    <div className="shrink-0 rounded-2xl border border-[#3D3330] bg-[#232120] overflow-hidden">
      {/* Collapsed header — just title + summary + spend line */}
      <div className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-[#2E2B2A] transition-colors select-none"
        onClick={() => { setExpanded(e => !e); if (!expanded) { setDrillStack([]); setSelectedNode(null); } }}>
        <span className="text-xs font-bold text-[#FFEDD1] shrink-0">Budget {new Date().getFullYear()}</span>
        <div className="relative flex-1 h-1.5 rounded-full bg-[#3D3330] overflow-visible">
          <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${totalPct}%`, background: "#F0684D" }} />
          <div className="absolute top-1/2 -translate-y-1/2 w-px h-3 bg-[#F0684D]" style={{ left: `${totalPct}%` }} />
        </div>
        <span className="text-xs text-[#C4A882] shrink-0">{fmt(data.spent)} / {fmt(data.total)}</span>
        <span className="text-[10px] text-[#7A6555] shrink-0 ml-1">{expanded ? "▲" : "▼"}</span>
      </div>

      {expanded && (
        <div className="border-t border-[#3D3330]">
          {/* Breadcrumb */}
          <div className="flex items-center gap-1 px-3 pt-2 pb-1">
            {breadcrumb.map((crumb, i) => (
              <span key={i} className="flex items-center gap-1">
                {i > 0 && <span className="text-[#3D3330] text-[9px]">/</span>}
                <button
                  className={`text-[9px] font-medium transition-colors ${i === breadcrumb.length - 1 ? "text-[#FFEDD1]" : "text-[#7A6555] hover:text-[#C4A882]"}`}
                  onClick={() => {
                    if (i === breadcrumb.length - 1) return;
                    setDrillStack(drillStack.slice(0, i));
                    setSelectedNode(null);
                  }}>
                  {crumb}
                </button>
              </span>
            ))}
            {drillStack.length > 0 && (
              <button onClick={() => { setDrillStack([]); setSelectedNode(null); }}
                className="ml-auto text-[8px] text-[#7A6555] hover:text-[#F0684D] transition-colors">
                ↑ Back
              </button>
            )}
          </div>

          <div className="flex" style={{ height: 170 }}>
            <div className="flex-1 min-w-[280px]">
              <ResponsiveIcicle
                data={nivoData}
                identity="id"
                value="value"
                valueFormat=">-.3~s"
                colors={(node: any) => node.data?.color ?? "#F0684D"}
                colorBy="id"
                inheritColorFromParent={false}
                orientation="bottom"
                gapX={2}
                gapY={2}
                borderRadius={3}
                borderWidth={0}
                enableLabels
                label="id"
                labelSkipWidth={32}
                labelSkipHeight={12}
                labelTextColor="#fff"
                enableZooming={false}
                theme={DARK_THEME}
                animate={false}
                isInteractive
                onClick={handleClick}
                margin={{ top: 6, right: 6, bottom: 6, left: 6 }}
              />
            </div>

            {selectedNode ? (
              <div className="w-56 shrink-0 border-l border-[#3D3330] px-3 py-2">
                <SpendingChart name={selectedNode.name} color={selectedNode.color} />
              </div>
            ) : (
              <div className="w-36 shrink-0 border-l border-[#3D3330] flex items-center justify-center px-3">
                <span className="text-[10px] text-[#4A3F38] text-center leading-relaxed">Click a bar to see spending</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

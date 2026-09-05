import type { ReactNode } from "react";

export function ModalShell({ children, onClose, width = "max-w-xl" }: {
  children: ReactNode; onClose: () => void; width?: string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onClose}>
      <div className={`animate-slide-up relative w-full ${width} rounded-2xl border border-[#3D3330] bg-[#2A2724] shadow-2xl overflow-hidden max-h-[92vh] flex flex-col`}
        onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

export function ModalHeader({ title, onClose, sub }: { title: string; onClose: () => void; sub?: string }) {
  return (
    <div className="flex items-center justify-between px-5 py-4 border-b border-[#3D3330] shrink-0">
      <div>
        <h2 className="font-semibold text-[#FFEDD1]">{title}</h2>
        {sub && <p className="text-xs text-[#7A6555] mt-0.5">{sub}</p>}
      </div>
      <button onClick={onClose}
        className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#2E2B2A] text-[#7A6555] hover:text-[#FFEDD1] transition-colors text-sm">
        ✕
      </button>
    </div>
  );
}

export function Inp({ value, onChange, placeholder, className = "", type = "text", onKeyDown }: {
  value: string; onChange: (v: string) => void; placeholder?: string;
  className?: string; type?: string; onKeyDown?: (e: React.KeyboardEvent) => void;
}) {
  return (
    <input type={type} value={value} onChange={e => onChange(e.target.value)}
      placeholder={placeholder} onKeyDown={onKeyDown}
      className={`w-full bg-[#232120] border border-[#3D3330] rounded-lg px-3 py-2 text-sm text-[#FFEDD1] placeholder:text-[#7A6555] focus:outline-none focus:border-[#F0684D] transition-colors ${className}`} />
  );
}

export function Sel({ value, onChange, children, className = "" }: {
  value: string; onChange: (v: string) => void; children: ReactNode; className?: string;
}) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      className={`w-full bg-[#232120] border border-[#3D3330] rounded-lg px-3 py-2 text-sm text-[#FFEDD1] focus:outline-none focus:border-[#F0684D] transition-colors ${className}`}>
      {children}
    </select>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className="block text-xs text-[#C4A882] mb-1 font-medium">{label}</label>
      {children}
    </div>
  );
}

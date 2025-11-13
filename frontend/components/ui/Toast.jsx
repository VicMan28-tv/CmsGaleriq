import React, { useEffect } from "react";

export default function Toast({ open, type = "success", message = "", onClose }) {
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => onClose && onClose(), 1800);
    return () => clearTimeout(t);
  }, [open, onClose]);

  if (!open) return null;

  const isSuccess = type === "success";
  const borderClass = isSuccess ? "border-purple-300" : "border-rose-300";
  const icon = isSuccess ? "✅" : "⚠️";

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[60]">
      <div className={`flex items-center gap-2 rounded-2xl border ${borderClass} bg-white px-4 py-2 shadow-2xl anim-in`}>
        <span className="text-lg">{icon}</span>
        <span className="text-sm font-medium text-slate-800">{message}</span>
        <button
          onClick={onClose}
          className="ml-2 rounded-lg px-2 py-1 text-slate-500 hover:bg-purple-50 transition-base"
          aria-label="Cerrar notificación"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
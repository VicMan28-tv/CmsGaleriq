import React from "react";

export default function Modal({
  open,
  onClose,
  title,
  children,
  wide = false,
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4 anim-overlay">
      <div
        className={`w-full ${
          wide ? "max-w-3xl" : "max-w-lg"
        } overflow-hidden rounded-2xl border border-purple-200 bg-white shadow-2xl anim-modal`}
      >
        <div className="flex items-center justify-between border-b border-purple-100 px-5 py-3">
          <h3 className="text-base font-semibold text-slate-800">{title}</h3>
          <button
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-slate-500 hover:bg-purple-50 transition-base"
          >
            ✕
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

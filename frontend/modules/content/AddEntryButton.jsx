import React, { useMemo, useState } from "react";
import useCMSStore from "../../store/useCMSStore.js";

export default function AddEntryButton() {
  const [open, setOpen] = useState(false);
  const types = useCMSStore((s) => s.contentTypes);
  const createEntryRemote = useCMSStore((s) => s.createEntryRemote);
  const [creating, setCreating] = useState(false);

  const sorted = useMemo(
    () => [...types].sort((a, b) => a.name.localeCompare(b.name)),
    [types]
  );

  const createFor = async (typeId) => {
    const ct = types.find((t) => t.id === typeId);
    if (!ct) return;
    const fieldIds = Array.isArray(ct.fields)
      ? ct.fields.map((f) => f.apiId)
      : Array.isArray(ct.schema)
      ? ct.schema.map((fd) => fd.id)
      : [];
    const payload = {
      id: crypto.randomUUID(),
      content_type_id: typeId,
      title: "",
      fields: Object.fromEntries(fieldIds.map((id) => [id, null])),
    };
    try {
      setCreating(true);
      await createEntryRemote(payload);
      // Permanecemos en la lista (estilo Contentful): se verá la nueva row
      setOpen(false);
    } catch (err) {
      alert(err?.message || "No se pudo crear la entrada");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="relative z-10">
      <button
        onClick={() => setOpen((x) => !x)}
        disabled={creating}
        className="rounded-xl bg-purple-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-60"
      >
        {creating ? "Creating…" : "Add entry ▾"}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-72 rounded-xl border border-purple-200 bg-white p-2 shadow-xl z-50">
          <div className="p-2 text-xs font-medium text-slate-500">
            All Content Types
          </div>
          <div className="max-h-72 overflow-auto">
            {sorted.length === 0 && (
              <div className="px-3 py-2 text-sm text-slate-500">
                No content types yet.
              </div>
            )}
            {sorted.map((t) => (
              <button
                key={t.id}
                onClick={() => createFor(t.id)}
                className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-purple-50"
              >
                {t.name}
                <div className="text-xs text-slate-500">{t.apiId}</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

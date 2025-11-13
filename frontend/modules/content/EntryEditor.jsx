import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import useCMSStore from "../../store/useCMSStore.js";

function FieldInput({ field, value, onChange }) {
  // Helper: normaliza valor y estilo para campos de texto
  const normalizeText = (raw) => {
    if (Array.isArray(raw)) return { text: raw, style: {} };
    if (raw && typeof raw === "object") {
      const { text = "", style = {} } = raw;
      return { text, style };
    }
    return { text: raw || "", style: {} };
  };

  if (field.typeKey === "shortText") {
    // Valor y estilo actuales (para single/long)
    const { text, style } = normalizeText(value);

    const applyStyle = (s) => ({
      color: s?.color || undefined,
      fontFamily: s?.fontFamily || undefined,
      fontSize: s?.fontSize ? `${s.fontSize}px` : undefined,
      fontWeight: s?.fontWeight || undefined,
    });

    const StyleControls = (
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        <label className="flex items-center gap-2 text-xs">
          <span className="w-20">Color</span>
          <input
            type="color"
            value={style.color || "#000000"}
            onChange={(e) => onChange({ text, style: { ...style, color: e.target.value } })}
          />
        </label>
        <label className="flex items-center gap-2 text-xs">
          <span className="w-20">Fuente</span>
          <select
            className="rounded border px-2 py-1"
            value={style.fontFamily || ""}
            onChange={(e) => onChange({ text, style: { ...style, fontFamily: e.target.value } })}
          >
            <option value="">Default</option>
            <option value="ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto">Sans</option>
            <option value="Georgia, Cambria, Times New Roman, Times, serif">Serif</option>
            <option value="Menlo, Monaco, Consolas, 'Courier New', monospace">Monospace</option>
          </select>
        </label>
        <label className="flex items-center gap-2 text-xs">
          <span className="w-20">Tamaño</span>
          <input
            type="number"
            min={10}
            max={72}
            className="w-24 rounded border px-2 py-1"
            value={style.fontSize || ""}
            onChange={(e) => onChange({ text, style: { ...style, fontSize: e.target.value ? Number(e.target.value) : undefined } })}
          />
        </label>
        <label className="flex items-center gap-2 text-xs">
          <span className="w-20">Peso</span>
          <select
            className="rounded border px-2 py-1"
            value={style.fontWeight || ""}
            onChange={(e) => onChange({ text, style: { ...style, fontWeight: e.target.value || undefined } })}
          >
            <option value="">Normal</option>
            <option value="500">Medium</option>
            <option value="600">Semibold</option>
            <option value="700">Bold</option>
          </select>
        </label>
      </div>
    );

    if (field.config?.mode === "long") {
      return (
        <div>
          <textarea
            className="w-full rounded-lg border border-purple-200 bg-white px-3 py-2"
            rows={4}
            style={applyStyle(style)}
            value={text}
            onChange={(e) => onChange({ text: e.target.value, style })}
          />
          {StyleControls}
        </div>
      );
    }
    if (field.config?.mode === "list") {
      const list = Array.isArray(value) ? value : [];
      return (
        <div className="space-y-2">
          {list.map((item, idx) => (
            <div key={idx} className="flex gap-2">
              <input
                className="w-full rounded-lg border border-purple-200 bg-white px-3 py-2"
                value={item}
                onChange={(e) => {
                  const next = [...list];
                  next[idx] = e.target.value;
                  onChange(next);
                }}
              />
              <button
                onClick={() => onChange(list.filter((_, i) => i !== idx))}
                className="rounded-lg px-3 py-2 text-sm text-rose-600 hover:bg-rose-50"
              >
                Remove
              </button>
            </div>
          ))}
          <button
            onClick={() => onChange([...(list || []), ""])}
            className="rounded-lg border border-purple-300 bg-white px-3 py-1.5 text-sm text-purple-700"
          >
            + Add item
          </button>
        </div>
      );
    }
    return (
      <div>
        <input
          className="w-full rounded-lg border border-purple-200 bg-white px-3 py-2"
          style={applyStyle(style)}
          value={text}
          onChange={(e) => onChange({ text: e.target.value, style })}
        />
        {StyleControls}
      </div>
    );
  }

  // Rich text: aplicar los mismos controles de estilo que long text
  if (field.typeKey === "richText") {
    const { text, style } = normalizeText(value);

    const applyStyle = (s) => ({
      color: s?.color || undefined,
      fontFamily: s?.fontFamily || undefined,
      fontSize: s?.fontSize ? `${s.fontSize}px` : undefined,
      fontWeight: s?.fontWeight || undefined,
    });

    const StyleControls = (
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        <label className="flex items-center gap-2 text-xs">
          <span className="w-20">Color</span>
          <input
            type="color"
            value={style.color || "#000000"}
            onChange={(e) => onChange({ text, style: { ...style, color: e.target.value } })}
          />
        </label>
        <label className="flex items-center gap-2 text-xs">
          <span className="w-20">Fuente</span>
          <select
            className="rounded border px-2 py-1"
            value={style.fontFamily || ""}
            onChange={(e) => onChange({ text, style: { ...style, fontFamily: e.target.value } })}
          >
            <option value="">Default</option>
            <option value="ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto">Sans</option>
            <option value="Georgia, Cambria, Times New Roman, Times, serif">Serif</option>
            <option value="Menlo, Monaco, Consolas, 'Courier New', monospace">Monospace</option>
          </select>
        </label>
        <label className="flex items-center gap-2 text-xs">
          <span className="w-20">Tamaño</span>
          <input
            type="number"
            min={10}
            max={72}
            className="w-24 rounded border px-2 py-1"
            value={style.fontSize || ""}
            onChange={(e) => onChange({ text, style: { ...style, fontSize: e.target.value ? Number(e.target.value) : undefined } })}
          />
        </label>
        <label className="flex items-center gap-2 text-xs">
          <span className="w-20">Peso</span>
          <select
            className="rounded border px-2 py-1"
            value={style.fontWeight || ""}
            onChange={(e) => onChange({ text, style: { ...style, fontWeight: e.target.value || undefined } })}
          >
            <option value="">Normal</option>
            <option value="500">Medium</option>
            <option value="600">Semibold</option>
            <option value="700">Bold</option>
          </select>
        </label>
      </div>
    );

    return (
      <div>
        <textarea
          className="w-full rounded-lg border border-purple-200 bg-white px-3 py-2"
          rows={6}
          style={applyStyle(style)}
          value={text}
          onChange={(e) => onChange({ text: e.target.value, style })}
        />
        {StyleControls}
      </div>
    );
  }

  if (field.typeKey === "number") {
    return (
      <input
        type="number"
        step={field.config?.variant === "decimal" ? "any" : "1"}
        className="w-full rounded-lg border border-purple-200 bg-white px-3 py-2"
        value={value ?? ""}
        onChange={(e) =>
          onChange(e.target.value === "" ? null : Number(e.target.value))
        }
      />
    );
  }

  if (field.typeKey === "boolean") {
    return (
      <label className="inline-flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={!!value}
          onChange={(e) => onChange(!!e.target.checked)}
        />
        True / False
      </label>
    );
  }

  if (field.typeKey === "datetime") {
    const date = value?.date || "";
    const time = value?.time || "";
    return (
      <div className="flex items-center gap-2">
        <input
          type="date"
          className="rounded-lg border border-purple-200 bg-white px-3 py-2"
          value={date}
          onChange={(e) => onChange({ date: e.target.value, time })}
        />
        {field.config?.withTime && (
          <input
            type="time"
            className="rounded-lg border border-purple-200 bg-white px-3 py-2"
            value={time}
            onChange={(e) => onChange({ date, time: e.target.value })}
          />
        )}
      </div>
    );
  }

  if (field.typeKey === "media") {
    return (
      <div className="rounded-lg border border-dashed border-purple-300 bg-purple-50/40 p-4 text-sm text-slate-500">
        <div className="mb-2 font-medium text-slate-700">Media (mock)</div>
        <button className="rounded-lg border border-purple-300 bg-white px-3 py-1.5 text-sm text-purple-700">
          + Add media
        </button>
        <div className="mt-2 text-xs text-slate-500">
          (Uploader real lo agregamos después)
        </div>
      </div>
    );
  }

  if (field.typeKey === "reference") {
    return (
      <div className="rounded-lg border border-purple-200 bg-purple-50/30 p-3 text-sm text-slate-600">
        Reference selector (mock). Multiple: {String(!!field.config?.multiple)}
      </div>
    );
  }

  if (field.typeKey === "json") {
    return (
      <textarea
        className="w-full font-mono rounded-lg border border-purple-200 bg-white px-3 py-2"
        rows={6}
        value={
          typeof value === "string"
            ? value
            : value
            ? JSON.stringify(value, null, 2)
            : ""
        }
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }

  return <div className="text-slate-500">Unsupported field type</div>;
}

export default function EntryEditor() {
  const { entryId } = useParams();
  const contentTypes = useCMSStore((s) => s.contentTypes) ?? [];
  const foreignTypes = useCMSStore((s) => s.foreignTypes) ?? {};
  const entries = useCMSStore((s) => s.entries) ?? [];
  const updateEntryField = useCMSStore((s) => s.updateEntryField);
  const updateEntryTitle = useCMSStore((s) => s.updateEntryTitle);
  const createEntryRemote = useCMSStore((s) => s.createEntryRemote);
  const updateEntryRemote = useCMSStore((s) => s.updateEntryRemote);
  const publishEntryRemote = useCMSStore((s) => s.publishEntryRemote);
  const getContentTypeRemote = useCMSStore((s) => s.getContentTypeRemote);
  const [message, setMessage] = useState(null);
  const [saving, setSaving] = useState(false);

  const entry = useMemo(
    () => entries.find((e) => e.id === entryId),
    [entries, entryId]
  );
  const typeId = useMemo(() => entry?.typeId ?? entry?.content_type_id, [entry]);
  const ct = useMemo(
    () => contentTypes.find((t) => t.id === typeId) ?? foreignTypes[typeId],
    [contentTypes, foreignTypes, typeId]
  );

  useEffect(() => {
    if (!ct && typeId && getContentTypeRemote) {
      getContentTypeRemote(typeId).catch(() => {});
    }
  }, [ct, typeId, getContentTypeRemote]);

  const fields = useMemo(() => {
    if (!ct) return [];
    if (Array.isArray(ct.fields)) return ct.fields;
    if (Array.isArray(ct.schema)) {
      return ct.schema.map((fd) => ({
        id: fd.id,
        name: fd.name,
        apiId: fd.id,
        typeKey: fd.type,
        config: fd.config ?? {},
      }));
    }
    return [];
  }, [ct]);

  if (!entry || !ct) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
        <p className="text-rose-700">Entry no encontrado.</p>
        <Link
          to="/content"
          className="mt-2 inline-block text-sm text-purple-700 underline"
        >
          Volver
        </Link>
      </div>
    );
  }

  const persistPatch = async () => {
    const patch = { title: entry.title, fields: entry.values };
    try {
      const updated = await updateEntryRemote(entry.id, patch);
      return updated;
    } catch (err) {
      const payload = {
        id: entry.id,
        content_type_id: typeId,
        title: entry.title,
        fields: entry.values,
      };
      const created = await createEntryRemote(payload);
      return created;
    }
  };

  const handleSaveDraft = async () => {
    setSaving(true); setMessage(null);
    try {
      const saved = await persistPatch();
      await updateEntryRemote(saved.id, { status: "DRAFT" }).catch(() => {});
      setMessage("Draft guardado en el backend.");
    } catch (err) {
      setMessage(err?.message || "No se pudo guardar el draft.");
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    setSaving(true); setMessage(null);
    try {
      const saved = await persistPatch();
      await publishEntryRemote(saved.id);
      setMessage("Entrada publicada.");
    } catch (err) {
      setMessage(err?.message || "No se pudo publicar la entrada.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-[1fr,320px]">
      {/* Editor */}
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <Link
            to="/content"
            className="rounded-lg px-2 py-1 text-sm text-slate-600 hover:bg-purple-100"
          >
            ← Back
          </Link>
          <h2 className="text-lg font-semibold">{ct.name}</h2>
          <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
            Editor
          </span>
        </div>

        {message && (
          <div className="rounded-lg border border-purple-300 bg-purple-50 px-3 py-2 text-sm text-purple-800">
            {message}
          </div>
        )}
        <div className="rounded-2xl border border-purple-200 bg-white p-5">
          <div className="mb-5">
            <label className="mb-1 block text-sm font-medium">
              Entry title (solo para listar)
            </label>
            <input
              className="w-full rounded-lg border border-purple-200 bg-white px-3 py-2"
              value={entry.title || ""}
              onChange={(e) => updateEntryTitle(entry.id, e.target.value)}
            />
          </div>

          <div className="space-y-4">
            {fields.length === 0 && (
              <div className="text-slate-500">
                Este Content Type no tiene fields.
              </div>
            )}
            {fields.map((f) => (
              <div key={f.id} className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-800">
                    {f.name}
                  </span>
                  <span className="text-xs text-slate-500">{f.apiId}</span>
                </div>
                <FieldInput
                  field={f}
                  value={entry.values[f.apiId]}
                  onChange={(val) => updateEntryField(entry.id, f.apiId, val)}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div className="space-y-4">
        <div className="rounded-2xl border border-purple-200 bg-white p-5">
          <div className="mb-2 text-sm font-semibold text-slate-800">
            Status
          </div>
          <div className="mb-4">
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                (entry.status === "published" || entry.status === "PUBLISHED")
                  ? "bg-green-100 text-green-700"
                  : "bg-amber-100 text-amber-700"
              }`}
            >
              {entry.status === "published" || entry.status === "PUBLISHED" ? "Published" : "Draft"}
            </span>
          </div>
          <div className="space-x-2">
            <button
              onClick={handlePublish}
              disabled={saving}
              className="rounded-lg bg-green-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60"
            >
              Publish
            </button>
            <button
              onClick={handleSaveDraft}
              disabled={saving}
              className="rounded-lg border border-purple-300 bg-white px-3 py-1.5 text-sm font-medium text-purple-700 hover:bg-purple-50 disabled:opacity-60"
            >
              Save draft
            </button>
          </div>
          <div className="mt-4 text-xs text-slate-500 space-y-0.5">
            <div>
              Last updated: {entry?.updatedAt ? new Date(entry.updatedAt).toLocaleString() : "—"}
            </div>
            <div>
              Updated by: {entry?.updatedBy || entry?.updated_by || "—"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

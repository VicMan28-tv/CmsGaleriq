import React, { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import useCMSStore from "../../store/useCMSStore";
import AddFieldModal from "./AddFieldModal";

export default function TypeEditor() {
  const navigate = useNavigate();
  const { id } = useParams();

  const { contentTypes, deleteField, deleteContentType, updateContentType } = useCMSStore();
  const type = useMemo(
    () => contentTypes.find((t) => t.id === id),
    [contentTypes, id]
  );

  const [open, setOpen] = useState(false);

  if (!type) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
        <p className="text-rose-700">Content Type no encontrado.</p>
        <Link
          to="/"
          className="mt-2 inline-block text-sm text-purple-700 underline"
        >
          Volver
        </Link>
      </div>
    );
  }

  const handleDeleteType = () => {
    const ok = window.confirm(
      `¿Borrar el Content Type "${type.name}"?\n\nEsto también eliminará todas las entries asociadas.`
    );
    if (!ok) return;
    // Usamos la versión remota para borrar en backend
    deleteContentType(type.id);
    navigate("/");
  };

  const fields = useMemo(() => {
    if (Array.isArray(type?.fields)) return type.fields;
    if (Array.isArray(type?.schema)) {
      const labelFor = (def) => {
        switch (def.type) {
          case "shortText": {
            const mode = def?.config?.mode;
            if (mode === "long") return "Long text";
            if (mode === "list") return "Text list";
            return "Short text";
          }
          case "richText":
            return "Rich text";
          case "number":
            return "Number";
          case "media":
            return "Media";
          case "reference":
            return "Reference";
          case "datetime":
            return "Date & time";
          default:
            return def.type || "Field";
        }
      };
      return type.schema.map((fd) => ({
        id: fd.id,
        name: fd.name,
        apiId: fd.id,
        // Map ligeros para que se vea en UI
        typeKey: fd.type,
        typeLabel: labelFor(fd),
      }));
    }
    return [];
  }, [type]);

  const handleDeleteField = async (f) => {
    // Si viene del backend (tiene schema), persistimos vía updateContentType
    if (Array.isArray(type?.schema)) {
      const nextSchema = type.schema.filter((x) => x.id !== f.id);
      try {
        await updateContentType(type.id, { schema: nextSchema });
      } catch (e) {
        alert("No se pudo borrar el campo: " + (e?.message || "Error"));
      }
      return;
    }
    // Caso UI local
    deleteField(type.id, f.id);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="rounded-lg px-2 py-1 text-sm text-slate-600 hover:bg-purple-100"
          >
            ← Back
          </Link>
          <h2 className="text-lg font-semibold">{type.name}</h2>
          <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
            {type.api_id ?? type.apiId}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setOpen(true)}
            className="rounded-xl border border-purple-300 bg-white px-3 py-1.5 text-sm font-medium text-purple-700 shadow-sm hover:bg-purple-50"
          >
            + Add field
          </button>

          <button
            onClick={handleDeleteType}
            className="rounded-xl border border-rose-300 bg-white px-3 py-1.5 text-sm font-medium text-rose-700 hover:bg-rose-50"
            title="Delete content type"
          >
            Delete type
          </button>
        </div>
      </div>

      {/* Fields table */}
      <div className="overflow-hidden rounded-2xl border border-purple-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-purple-50/60 text-slate-600">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Name</th>
              <th className="px-4 py-3 text-left font-medium">Field ID</th>
              <th className="px-4 py-3 text-left font-medium">Field type</th>
              <th className="px-4 py-3 text-left font-medium">Localization</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {fields.length === 0 && (
              <tr>
                <td
                  colSpan="5"
                  className="px-4 py-8 text-center text-slate-500"
                >
                  No fields yet. Click “Add field”.
                </td>
              </tr>
            )}

            {fields.map((f) => (
              <tr
                key={f.id}
                className="border-t border-purple-100/80 hover:bg-purple-50/40"
              >
                <td className="px-4 py-3">
                  <div className="font-medium text-slate-800">{f.name}</div>
                  <div className="text-xs text-slate-500">{f.desc}</div>
                </td>

                <td className="px-4 py-3">{f.apiId}</td>

                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-2 rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
                    {/* si tu template trae icono, lo pintamos */}
                    {f.icon ? <f.icon /> : null}
                    {f.typeLabel}
                  </span>
                </td>

                <td className="px-4 py-3 text-slate-500">—</td>

                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => handleDeleteField(f)}
                    className="rounded-lg px-3 py-1.5 text-sm text-rose-600 hover:bg-rose-50"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Field Modal */}
      <AddFieldModal
        open={open}
        onClose={() => setOpen(false)}
        typeId={type.id}
        existingIds={fields.map((x) => x.apiId)}
      />
    </div>
  );
}

import React, { useMemo, useState } from "react";
import Modal from "../../components/Modal.jsx";
import useCMSStore from "../../store/useCMSStore.js";

const toApiId = (s) =>
  s
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");

export default function CreateTypeModal({ open, onClose }) {
  const [name, setName] = useState("");
  const apiId = useMemo(() => toApiId(name), [name]);
  const createContentType = useCMSStore((s) => s.createContentType);
  const loadContentTypes = useCMSStore((s) => s.loadContentTypes);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    const payload = {
      id: crypto.randomUUID(),
      name: name.trim(),
      api_id: apiId,
      schema: [],
    };
    try {
      setError("");
      await createContentType(payload);
      // Refresca por si hubo cambios en backend
      await loadContentTypes().catch(() => {});
      setName("");
      onClose();
    } catch (err) {
      const msg = err?.message || "No se pudo crear el tipo";
      setError(msg);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Create new content type">
      <form onSubmit={submit} className="space-y-4">
        {error && (
          <div className="rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </div>
        )}
        <div>
          <label className="mb-1 block text-sm font-medium">
            Name (required)
          </label>
          <input
            className="w-full rounded-lg border border-purple-200 bg-purple-50/60 px-3 py-2 outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-200"
            placeholder="Blog Post, Product, Author"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">
            API Identifier (required)
          </label>
          <input
            className="w-full cursor-not-allowed rounded-lg border border-purple-200 bg-purple-100/60 px-3 py-2 text-slate-500"
            value={apiId}
            readOnly
          />
          <p className="mt-1 text-xs text-slate-500">Se genera desde el nombre.</p>
        </div>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-purple-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-lg bg-purple-600 px-3 py-2 text-sm font-semibold text-white hover:bg-purple-700"
          >
            Create
          </button>
        </div>
      </form>
    </Modal>
  );
}

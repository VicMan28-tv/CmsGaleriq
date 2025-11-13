import React, { useState } from "react";
import Modal from "../../components/Modal.jsx";
import useCMSStore from "../../store/useCMSStore.js";
import { useNavigate } from "react-router-dom";

export default function CreateApiKeyModal({ open, onClose }) {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const createApiKeyRemote = useCMSStore((s) => s.createApiKeyRemote);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      const id = await createApiKeyRemote({
        name: name.trim(),
        description: desc.trim(),
      });
      setName("");
      setDesc("");
      onClose();
      navigate(`/api/${id}`);
    } catch (err) {
      alert(err?.message || "Error al crear la API key");
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Create API Key">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">
            Name (required)
          </label>
          <input
            className="w-full rounded-lg border border-purple-200 bg-purple-50/60 px-3 py-2 outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-200"
            placeholder="e.g. Website, Mobile app"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Description</label>
          <textarea
            rows={3}
            className="w-full rounded-lg border border-purple-200 bg-purple-50/60 px-3 py-2 outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-200"
            placeholder="Optional description for later reference"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
          />
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
            Add API Key
          </button>
        </div>
      </form>
    </Modal>
  );
}

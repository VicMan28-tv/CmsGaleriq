import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import useCMSStore from "../../store/useCMSStore.js";
import CreateApiKeyModal from "./CreateApiKeyModal.jsx";

export default function ApiList() {
  const apiKeys = useCMSStore((s) => s.apiKeys) ?? [];
  const loadApiKeys = useCMSStore((s) => s.loadApiKeys);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Carga inicial desde el backend
    loadApiKeys().catch(() => {});
  }, [loadApiKeys]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-800">API keys</h2>
        <button
          onClick={() => setOpen(true)}
          className="rounded-xl bg-purple-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-purple-700"
        >
          + Add API key
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-purple-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-purple-50/60 text-slate-600">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Name</th>
              <th className="px-4 py-3 text-left font-medium">Description</th>
              <th className="px-4 py-3 text-left font-medium">Created by</th>
              <th className="px-4 py-3 text-left font-medium">Updated</th>
            </tr>
          </thead>
          <tbody>
            {apiKeys.length === 0 && (
              <tr>
                <td
                  colSpan="4"
                  className="px-4 py-8 text-center text-slate-500"
                >
                  No API keys yet. Click “Add API key”.
                </td>
              </tr>
            )}
            {apiKeys.map((k) => (
              <tr
                key={k.id}
                className="border-t border-purple-100/80 hover:bg-purple-50/40"
              >
                <td className="px-4 py-3">
                  <Link
                    to={`/api/${k.id}`}
                    className="font-medium text-slate-800 hover:underline"
                  >
                    {k.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {k.description || "—"}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {k.created_by || "—"}
                </td>
                <td className="px-4 py-3">
                  {k.created_at
                    ? new Date(k.created_at).toLocaleDateString()
                    : k.updatedAt
                    ? new Date(k.updatedAt).toLocaleDateString()
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <CreateApiKeyModal open={open} onClose={() => setOpen(false)} />
    </div>
  );
}

import React, { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import useCMSStore from "../../store/useCMSStore.js";

export default function ApiKeyDetail() {
  const { apiId } = useParams();
  const navigate = useNavigate();
  const apiKeys = useCMSStore((s) => s.apiKeys) ?? [];
  const updateApiKey = useCMSStore((s) => s.updateApiKey);
  const deleteApiKeyRemote = useCMSStore((s) => s.deleteApiKeyRemote);

  const key = useMemo(
    () => apiKeys.find((k) => String(k.id) === String(apiId)),
    [apiKeys, apiId]
  );

  const [name, setName] = useState(key?.name ?? "");
  const [desc, setDesc] = useState(key?.description ?? "");
  const [showDelivery, setShowDelivery] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  if (!key) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
        <p className="text-rose-700">API key no encontrada.</p>
        <Link
          to="/api"
          className="mt-2 inline-block text-sm text-purple-700 underline"
        >
          Volver
        </Link>
      </div>
    );
  }

  const save = () => {
    updateApiKey(key.id, { name, description: desc });
  };

  const remove = async () => {
    try {
      await deleteApiKeyRemote(key.id);
      navigate("/api");
    } catch (err) {
      alert(err?.message || "Error al eliminar la API key");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          to="/api"
          className="rounded-lg px-2 py-1 text-sm text-slate-600 hover:bg-purple-100"
        >
          ← Back
        </Link>
        <h2 className="text-lg font-semibold">Galeriq Landing Key</h2>
        <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
          API key
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          {/* Name */}
          <div className="rounded-2xl border border-purple-200 bg-white p-5">
            <label className="mb-1 block text-sm font-medium">
              Name (required)
            </label>
            <input
              className="w-full rounded-lg border border-purple-200 bg-white px-3 py-2"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Description */}
          <div className="rounded-2xl border border-purple-200 bg-white p-5">
            <label className="mb-1 block text-sm font-medium">
              Description
            </label>
            <textarea
              rows={3}
              className="w-full rounded-lg border border-purple-200 bg-white px-3 py-2"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
            />
          </div>

          {/* Created by */}
          <div className="rounded-2xl border border-purple-200 bg-white p-5">
            <div className="mb-1 text-sm font-medium">Created by</div>
            <input
              className="w-full rounded-lg border border-purple-200 bg-purple-50/60 px-3 py-2"
              readOnly
              value={key.created_by || "—"}
            />
          </div>

          {/* Space ID */}
          <div className="rounded-2xl border border-purple-200 bg-white p-5">
            <div className="mb-1 text-sm font-medium">Space ID</div>
            <div className="flex gap-2">
              <input
                className="w-full rounded-lg border border-purple-200 bg-purple-50/60 px-3 py-2"
                readOnly
                value={key.space_id || "—"}
              />
              <button
                type="button"
                className="rounded-lg border border-purple-200 px-3 py-2 text-sm"
                onClick={() => navigator.clipboard.writeText(key.space_id ?? "")}
              >
                Copy
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Access tokens */}
          <div className="rounded-2xl border border-purple-200 bg-white p-5">
            <div className="mb-3 text-sm font-semibold text-slate-800">
              Access tokens
            </div>

            <div className="mb-4">
              <div className="mb-1 text-sm font-medium">
                Content Delivery API - access token
              </div>
              <div className="flex gap-2">
                <input
                  className="w-full rounded-lg border border-purple-200 bg-purple-50/60 px-3 py-2"
                  readOnly
                  type={showDelivery ? "text" : "password"}
                  value={key.delivery_token || ""}
                />
                <button
                  type="button"
                  className="rounded-lg border border-purple-200 px-3 py-2 text-sm"
                  onClick={() => setShowDelivery((v) => !v)}
                >
                  {showDelivery ? "Hide" : "Show"}
                </button>
                <button
                  type="button"
                  className="rounded-lg border border-purple-200 px-3 py-2 text-sm"
                  onClick={() => navigator.clipboard.writeText(key.delivery_token ?? "")}
                >
                  Copy
                </button>
              </div>
            </div>

            <div>
              <div className="mb-1 text-sm font-medium">
                Content Preview API - access token
              </div>
              <div className="flex gap-2">
                <input
                  className="w-full rounded-lg border border-purple-200 bg-purple-50/60 px-3 py-2"
                  readOnly
                  type={showPreview ? "text" : "password"}
                  value={key.preview_token || ""}
                />
                <button
                  type="button"
                  className="rounded-lg border border-purple-200 px-3 py-2 text-sm"
                  onClick={() => setShowPreview((v) => !v)}
                >
                  {showPreview ? "Hide" : "Show"}
                </button>
                <button
                  type="button"
                  className="rounded-lg border border-purple-200 px-3 py-2 text-sm"
                  onClick={() => navigator.clipboard.writeText(key.preview_token ?? "")}
                >
                  Copy
                </button>
              </div>
            </div>
          </div>

          {/* Environments */}
          <div className="rounded-2xl border border-purple-200 bg-white p-5">
            <div className="mb-3 text-sm font-semibold text-slate-800">
              Environments
            </div>
            <label className="inline-flex items-center gap-2 text-sm">
              <input type="checkbox" checked readOnly />
              master
            </label>
            <div className="mt-2 text-xs text-slate-500">
              (Soporte para múltiples environments llegará después)
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2">
        <button
          onClick={remove}
          className="rounded-lg border border-rose-300 bg-white px-3 py-1.5 text-sm font-medium text-rose-700 hover:bg-rose-50"
        >
          Delete
        </button>
        <button
          onClick={save}
          className="rounded-lg bg-purple-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-purple-700"
        >
          Save
        </button>
      </div>
    </div>
  );
}

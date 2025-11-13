import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import useCMSStore from "../../store/useCMSStore.js";
import CreateTypeModal from "./CreateTypeModal.jsx";

export default function ContentTypesList() {
  const { contentTypes, deleteContentType, loadContentTypes } = useCMSStore();
  const [open, setOpen] = React.useState(false);

  const onDelete = (type) => {
    const ok = window.confirm(
      `¿Borrar el Content Type "${type.name}"?\n\nEsto también eliminará todas las entries asociadas.`
    );
    if (ok) deleteContentType(type.id);
  };

  useEffect(() => {
    loadContentTypes().catch(() => {});
  }, [loadContentTypes]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-800">Content model</h2>

        {/* Create */}
        <button
          onClick={() => setOpen(true)}
          className="rounded-xl bg-purple-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-purple-700 hover-raise anim-in shadow-glow"
        >
          + Create content type
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-purple-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-purple-50/60 text-slate-600">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Name</th>
              <th className="px-4 py-3 text-left font-medium">Fields</th>
              <th className="px-4 py-3 text-left font-medium">Updated</th>
              <th className="px-4 py-3 text-left font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {contentTypes.length === 0 && (
              <tr className="anim-in">
                <td
                  colSpan="4"
                  className="px-4 py-8 text-center text-slate-500"
                >
                  No content types yet. Click “Create content type”.
                </td>
              </tr>
            )}

            {contentTypes.map((t, idx) => (
              <tr
                key={t.id}
                className="border-t border-purple-100/80 hover:bg-purple-50/40 anim-in"
                style={{ animationDelay: `${0.02 * (idx + 1)}s` }}
              >
                <td className="px-4 py-3">
                  <Link
                    to={`/types/${t.id}`}
                    className="font-medium text-slate-800 hover:underline"
                  >
                    {t.name}
                  </Link>
                  <div className="text-xs text-slate-500">
                    API ID: {t.api_id ?? t.apiId}
                  </div>
                </td>

                <td className="px-4 py-3">{(t.schema ?? t.fields ?? []).length}</td>

                <td className="px-4 py-3">
                  {new Date(t.updated_at ?? t.updatedAt).toLocaleDateString()}
                </td>

                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {/* Edit */}
                  <Link
                    to={`/types/${t.id}`}
                    className="rounded-lg border border-purple-300 bg-white px-3 py-1.5 text-sm text-purple-700 hover:bg-purple-50 hover:border-purple-400 hover-raise anim-in shadow-glow"
                    style={{ animationDelay: `${0.02 * (idx + 1)}s` }}
                  >
                    Edit
                  </Link>

                    {/* Delete */}
                    <button
                      onClick={() => onDelete(t)}
                      className="rounded-lg border border-rose-300 bg-white px-3 py-1.5 text-sm text-rose-700 hover:bg-rose-50 hover:border-rose-400 hover-raise anim-in shadow-glow"
                      style={{ animationDelay: `${0.02 * (idx + 1)}s` }}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <CreateTypeModal open={open} onClose={() => setOpen(false)} />
    </div>
  );
}

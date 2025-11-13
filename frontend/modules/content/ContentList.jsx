import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import useCMSStore from "../../store/useCMSStore.js";
import AddEntryButton from "./AddEntryButton.jsx";

export default function ContentList() {
  const types = useCMSStore((s) => s.contentTypes) ?? [];
  const foreignTypes = useCMSStore((s) => s.foreignTypes) ?? {};
  const entries = useCMSStore((s) => s.entries) ?? [];
  const loadEntriesRemote = useCMSStore((s) => s.loadEntries);
  const loadContentTypesRemote = useCMSStore((s) => s.loadContentTypes);
  const deleteEntryRemote = useCMSStore((s) => s.deleteEntryRemote);

  const [typeFilter, setTypeFilter] = useState("any");
  const [query, setQuery] = useState("");

  useEffect(() => {
    loadContentTypesRemote().catch(() => {});
    loadEntriesRemote().catch(() => {});
  }, [loadEntriesRemote, loadContentTypesRemote]);

  const allTypesForFilter = useMemo(() => {
    const foreignList = Object.values(foreignTypes);
    const merged = [
      ...types,
      ...foreignList.filter((ft) => !types.some((t) => t.id === ft.id)),
    ];
    return merged;
  }, [types, foreignTypes]);

  const filtered = useMemo(() => {
    return entries.filter((e) => {
      const typeId = e.typeId ?? e.content_type_id;
      const matchesType = typeFilter === "any" ? true : typeId === typeFilter;
      const t = types.find((x) => x.id === typeId) ?? foreignTypes[typeId];
      const title = e.title || "(Untitled)";
      const matchesQuery =
        query.trim() === ""
          ? true
          : title.toLowerCase().includes(query.toLowerCase()) ||
            (t?.name || "").toLowerCase().includes(query.toLowerCase());
      return matchesType && matchesQuery;
    });
  }, [entries, typeFilter, query, types, foreignTypes]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-800">All content</h2>
        <AddEntryButton />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="rounded-lg border border-purple-200 bg-white px-3 py-1.5 text-sm hover-raise anim-in"
        >
          <option value="any">Content type · Any</option>
          {allTypesForFilter.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>

        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Type to search for entries"
          className="min-w-[280px] flex-1 rounded-lg border border-purple-200 bg-white px-3 py-1.5 text-sm hover-raise anim-in"
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-purple-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-purple-50/60 text-slate-600">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Name</th>
              <th className="px-4 py-3 text-left font-medium">Content Type</th>
              <th className="px-4 py-3 text-left font-medium">Updated</th>
              <th className="px-4 py-3 text-left font-medium">Created By</th>
              <th className="px-4 py-3 text-left font-medium">Updated By</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr className="anim-in">
                <td
                  colSpan="4"
                  className="px-4 py-8 text-center text-slate-500"
                >
                  No entries yet.
                </td>
              </tr>
            )}

            {filtered.map((e, idx) => {
              const typeId = e.typeId ?? e.content_type_id;
              const t = types.find((x) => x.id === typeId) ?? foreignTypes[typeId];
              return (
                <tr
                  key={e.id}
                  className="border-t border-purple-100/80 hover:bg-purple-50/40 anim-in"
                  style={{ animationDelay: `${0.02 * (idx + 1)}s` }}
                >
                  <td className="px-4 py-3">
                    <Link
                      to={`/entries/${e.id}`}
                      className="font-medium text-slate-800 hover:underline hover-raise"
                    >
                      {e.title || "(Untitled)"}
                    </Link>
                  </td>

                  <td className="px-4 py-3">{t?.name || typeId || "—"}</td>

                  <td className="px-4 py-3">
                    {new Date(e.updatedAt ?? e.updated_at).toLocaleDateString()}
                  </td>

                  <td className="px-4 py-3">{e.created_by ?? "—"}</td>
                  <td className="px-4 py-3">{e.updated_by ?? "—"}</td>

                  <td className="px-4 py-3">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          (e.status === "published" || e.status === "PUBLISHED")
                            ? "bg-green-100 text-green-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {e.status === "published" || e.status === "PUBLISHED" ? "Published" : "Draft"}
                      </span>

                      {/* Delete entry */}
                      <button
                        title="Eliminar"
                        onClick={async () => {
                          const ok = window.confirm("Estas seguro de querer eliminar?");
                          if (!ok) return;
                          try {
                            await deleteEntryRemote(e.id);
                          } catch (err) {
                            alert(err?.message || "No se pudo eliminar la entrada");
                          }
                        }}
                        className="rounded-lg border border-rose-300 bg-white px-2 py-1 text-xs text-rose-700 hover:bg-rose-50 hover:border-rose-400 hover-raise anim-in"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

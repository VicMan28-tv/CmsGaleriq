import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import useCMSStore from "../../store/useCMSStore.js";

export default function UsersList() {
  const navigate = useNavigate();
  const { listUsers } = useCMSStore();
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ items: [], total: 0, limit: 10 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = async (p = 1) => {
    setLoading(true);
    setError(null);
    try {
      const res = await listUsers({ page: p, limit: 10 });
      setData(res);
      setPage(p);
    } catch (e) {
      setError(e.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(1); }, []);

  const totalPages = Math.ceil((data.total || 0) / (data.limit || 10)) || 1;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="rounded-lg px-2 py-1 text-sm text-slate-600 hover:bg-purple-100"
          >
            ← Volver
          </button>
          <h1 className="text-2xl font-bold text-purple-700">Usuarios</h1>
        </div>
      </div>
      <p className="text-sm text-gray-600 mb-4">Listado de usuarios registrados en el CMS.</p>

      {error && (
        <div className="bg-red-100 text-red-700 px-3 py-2 rounded mb-3">{error}</div>
      )}

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-2 text-sm font-semibold text-gray-700">Foto</th>
              <th className="text-left px-4 py-2 text-sm font-semibold text-gray-700">Nombre</th>
              <th className="text-left px-4 py-2 text-sm font-semibold text-gray-700">Correo</th>
              <th className="text-left px-4 py-2 text-sm font-semibold text-gray-700">Rol</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="px-4 py-6 text-center text-gray-500" colSpan={4}>Cargando…</td></tr>
            ) : data.items.length === 0 ? (
              <tr><td className="px-4 py-6 text-center text-gray-500" colSpan={4}>Sin usuarios</td></tr>
            ) : (
              data.items.map((u) => (
                <tr key={u.email} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    {u.avatar_url ? (
                      <img src={u.avatar_url} alt="avatar" className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-purple-200 text-purple-700 flex items-center justify-center font-semibold">
                        {String(u.full_name || u.email).slice(0,1).toUpperCase()}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">{u.full_name || "—"}</td>
                  <td className="px-4 py-3">{u.email}</td>
                  <td className="px-4 py-3 capitalize">{u.role}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <div className="text-sm text-gray-600">Página {page} de {totalPages}</div>
        <div className="flex gap-2">
          <button
            className="px-3 py-1 bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-base"
            onClick={() => load(Math.max(1, page - 1))}
            disabled={page <= 1 || loading}
          >Anterior</button>
          <button
            className="px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 transition-base"
            onClick={() => load(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages || loading}
          >Siguiente</button>
        </div>
      </div>
    </div>
  );
}
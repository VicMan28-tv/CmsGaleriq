import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import useCMSStore from "../../store/useCMSStore.js";

export default function RolesPermissions() {
  const navigate = useNavigate();
  const { listUsers, assignUserRole, user } = useCMSStore();
  const [activeRole, setActiveRole] = useState("admin");
  const [pageAdmin, setPageAdmin] = useState(1);
  const [pageEmp, setPageEmp] = useState(1);
  const [dataAdmin, setDataAdmin] = useState({ items: [], total: 0, limit: 10 });
  const [dataEmp, setDataEmp] = useState({ items: [], total: 0, limit: 10 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const isAdmin = (user?.role ?? "") === "admin";

  const loadRole = async (roleName, page) => {
    setLoading(true);
    setError(null);
    try {
      const res = await listUsers({ roleFilter: roleName, page, limit: 10 });
      if (roleName === "admin") { setDataAdmin(res); setPageAdmin(page); }
      else { setDataEmp(res); setPageEmp(page); }
    } catch (e) {
      setError(e.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadRole("admin", 1); loadRole("empleado", 1); }, []);

  const totalPagesAdmin = Math.ceil((dataAdmin.total || 0) / (dataAdmin.limit || 10)) || 1;
  const totalPagesEmp = Math.ceil((dataEmp.total || 0) / (dataEmp.limit || 10)) || 1;

  const promoteToAdmin = async (email) => {
    if (!isAdmin) return;
    setLoading(true);
    try {
      await assignUserRole(email, "admin");
      // refrescar ambas listas
      await loadRole("admin", pageAdmin);
      await loadRole("empleado", pageEmp);
    } catch (e) {
      setError(e.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  const normalizeRoleKey = (r) => (r === "employee" || r === "empleado") ? "empleado" : "admin";

  const changeRole = async (email, roleKey) => {
    if (!isAdmin) return;
    const target = roleKey === "admin" ? "admin" : "empleado";
    setLoading(true);
    try {
      await assignUserRole(email, target);
      await loadRole("admin", pageAdmin);
      await loadRole("empleado", pageEmp);
    } catch (e) {
      setError(e.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  const TabButton = ({ label, active, onClick }) => (
    <button
      className={`px-3 py-1 rounded-md text-sm font-medium transition-base ${active ? "bg-purple-200 text-purple-800" : "bg-purple-100 text-purple-700 hover:bg-purple-200"}`}
      onClick={onClick}
    >{label}</button>
  );

  const RoleTable = ({ data, page, totalPages, roleName }) => (
    <div className="mt-3">
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-2 text-sm font-semibold text-gray-700">Foto</th>
              <th className="text-left px-4 py-2 text-sm font-semibold text-gray-700">Nombre</th>
              <th className="text-left px-4 py-2 text-sm font-semibold text-gray-700">Correo</th>
              <th className="text-left px-4 py-2 text-sm font-semibold text-gray-700">Acciones</th>
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
                  <td className="px-4 py-3">
                    <select
                      className={`px-3 py-1 rounded-md text-sm font-medium transition-base ${isAdmin ? "bg-purple-100 text-purple-700 hover:bg-purple-200" : "bg-gray-100 text-gray-500"}`}
                      value={normalizeRoleKey(u.role)}
                      onChange={(e) => changeRole(u.email, e.target.value)}
                      disabled={!isAdmin}
                      title={isAdmin ? "Cambiar rol" : "Solo visualización"}
                    >
                      <option value="empleado">Empleado</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
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
            onClick={() => roleName === "admin" ? loadRole("admin", Math.max(1, page - 1)) : loadRole("empleado", Math.max(1, page - 1))}
            disabled={page <= 1 || loading}
          >Anterior</button>
          <button
            className="px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 transition-base"
            onClick={() => roleName === "admin" ? loadRole("admin", page + 1) : loadRole("empleado", page + 1)}
            disabled={page >= totalPages || loading}
          >Siguiente</button>
        </div>
      </div>
    </div>
  );

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
          <h1 className="text-2xl font-bold text-purple-700">Roles y permisos</h1>
        </div>
      </div>
      <p className="text-sm text-gray-600 mb-4">Admin puede cambiar el rol de empleados a administradores. Empleados solo visualizan.</p>

      {error && (<div className="bg-red-100 text-red-700 px-3 py-2 rounded mb-3">{error}</div>)}

      <div className="flex gap-2 mb-2">
        <TabButton label="Administradores" active={activeRole === "admin"} onClick={() => setActiveRole("admin")} />
        <TabButton label="Empleados" active={activeRole === "empleado"} onClick={() => setActiveRole("empleado")} />
      </div>

      {activeRole === "admin" ? (
        <RoleTable data={dataAdmin} page={pageAdmin} totalPages={totalPagesAdmin} roleName="admin" />
      ) : (
        <RoleTable data={dataEmp} page={pageEmp} totalPages={totalPagesEmp} roleName="empleado" />
      )}
    </div>
  );
}
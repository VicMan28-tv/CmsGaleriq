import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import useCMSStore from "../../store/useCMSStore.js";

const GENDERS = [
  { value: "male", label: "Masculino" },
  { value: "female", label: "Femenino" },
  { value: "nonbinary", label: "No binario" },
  { value: "prefer_not_to_say", label: "Prefiero no decir" },
];

export default function Profile() {
  const navigate = useNavigate();
  const user = useCMSStore((s) => s.user);
  const loadMyProfile = useCMSStore((s) => s.loadMyProfile);
  const updateMyProfile = useCMSStore((s) => s.updateMyProfile);
  const uploadMyAvatar = useCMSStore((s) => s.uploadMyAvatar);
  const changeMyPassword = useCMSStore((s) => s.changeMyPassword);

  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    birthdate: "",
    gender: "prefer_not_to_say",
  });
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [okMsg, setOkMsg] = useState("");

  // Password section
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [newPwd2, setNewPwd2] = useState("");
  const [savingPwd, setSavingPwd] = useState(false);
  const [pwdErr, setPwdErr] = useState("");
  const [pwdOk, setPwdOk] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const data = await loadMyProfile();
        setForm({
          full_name: data?.full_name ?? "",
          phone: data?.phone ?? "",
          birthdate: data?.birthdate ?? "",
          gender: data?.gender ?? "prefer_not_to_say",
        });
        setAvatarPreview(data?.avatar_url ? `${import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000"}${data.avatar_url}` : null);
      } catch (e) {
        setError(e?.message || "No se pudo cargar el perfil");
      }
    })();
  }, [loadMyProfile]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const onPickAvatar = async (file) => {
    if (!file) return;
    try {
      const localUrl = URL.createObjectURL(file);
      setAvatarPreview(localUrl);
      const data = await uploadMyAvatar(file);
      setAvatarPreview(data?.avatar_url ? `${import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000"}${data.avatar_url}` : localUrl);
      setOkMsg("Foto actualizada correctamente");
    } catch (e) {
      setError(e?.message || "No se pudo actualizar la foto");
    }
  };

  const onSave = async () => {
    setSaving(true);
    setError("");
    setOkMsg("");
    try {
      const patch = {
        full_name: form.full_name || undefined,
        phone: form.phone || undefined,
        birthdate: form.birthdate || undefined,
        gender: form.gender || undefined,
      };
      await updateMyProfile(patch);
      setOkMsg("Perfil guardado correctamente");
    } catch (e) {
      setError(e?.message || "No se pudo guardar el perfil");
    } finally {
      setSaving(false);
    }
  };

  const onChangePassword = async () => {
    setSavingPwd(true);
    setPwdErr("");
    setPwdOk("");
    try {
      if (!currentPwd || currentPwd.length < 8) {
        throw new Error("Ingresa tu contraseña actual (mín. 8 caracteres)");
      }
      if (!newPwd || newPwd.length < 8) {
        throw new Error("La nueva contraseña debe tener al menos 8 caracteres");
      }
      if (newPwd !== newPwd2) {
        throw new Error("La nueva contraseña y la repetición no coinciden");
      }
      await changeMyPassword(currentPwd, newPwd);
      setPwdOk("Contraseña actualizada correctamente");
      setCurrentPwd("");
      setNewPwd("");
      setNewPwd2("");
    } catch (e) {
      setPwdErr(e?.message || "No se pudo cambiar la contraseña");
    } finally {
      setSavingPwd(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="rounded-lg px-2 py-1 text-sm text-slate-600 hover:bg-purple-100"
          >
            ← Volver
          </button>
          <h2 className="text-lg font-semibold text-slate-800">Mi perfil</h2>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-rose-700">{error}</div>
      )}
      {okMsg && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-emerald-700">{okMsg}</div>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        {/* Avatar */}
        <div className="rounded-2xl border border-purple-200 bg-white p-5">
          <div className="mb-2 text-sm font-medium">Foto de perfil</div>
          <div className="flex items-center gap-4">
            <div className="h-20 w-20 overflow-hidden rounded-full border border-purple-200 bg-slate-100">
              {avatarPreview ? (
                <img src={avatarPreview} alt="avatar" className="h-full w-full object-cover" />
              ) : (
                <div className="grid h-full w-full place-items-center text-xs text-slate-400">Sin foto</div>
              )}
            </div>
            <div>
              <input type="file" accept="image/*" onChange={(e) => onPickAvatar(e.target.files?.[0])} />
            </div>
          </div>
        </div>

        {/* Datos básicos */}
        <div className="md:col-span-2 rounded-2xl border border-purple-200 bg-white p-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <div className="mb-1 text-sm font-medium">Email</div>
              <input className="w-full rounded-lg border border-purple-200 bg-purple-50/60 px-3 py-2" readOnly value={user?.email || ""} />
            </div>
            <div>
              <div className="mb-1 text-sm font-medium">Nombre completo</div>
              <input name="full_name" className="w-full rounded-lg border border-purple-200 bg-white px-3 py-2" value={form.full_name} onChange={onChange} />
            </div>
            <div>
              <div className="mb-1 text-sm font-medium">Teléfono</div>
              <input name="phone" className="w-full rounded-lg border border-purple-200 bg-white px-3 py-2" value={form.phone} onChange={onChange} />
            </div>
            <div>
              <div className="mb-1 text-sm font-medium">Fecha de nacimiento</div>
              <input type="date" name="birthdate" className="w-full rounded-lg border border-purple-200 bg-white px-3 py-2" value={form.birthdate || ""} onChange={onChange} />
            </div>
            <div>
              <div className="mb-1 text-sm font-medium">Género</div>
              <select name="gender" className="w-full rounded-lg border border-purple-200 bg-white px-3 py-2" value={form.gender} onChange={onChange}>
                {GENDERS.map((g) => (
                  <option key={g.value} value={g.value}>{g.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-4">
            <button onClick={onSave} disabled={saving} className="rounded-xl bg-purple-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-purple-700">
              {saving ? "Guardando…" : "Guardar cambios"}
            </button>
          </div>
        </div>
      </div>

      {/* Contraseña */}
      <div className="rounded-2xl border border-purple-200 bg-white p-5">
        <div className="mb-3 text-sm font-semibold">Cambiar contraseña</div>
        {pwdErr && (
          <div className="mb-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-rose-700">{pwdErr}</div>
        )}
        {pwdOk && (
          <div className="mb-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-emerald-700">{pwdOk}</div>
        )}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="md:col-span-1">
            <div className="mb-1 text-sm font-medium">Contraseña actual</div>
            <input type="password" autoComplete="current-password" className="w-full rounded-lg border border-purple-200 bg-white px-3 py-2" value={currentPwd} onChange={(e) => setCurrentPwd(e.target.value)} />
          </div>
          <div className="md:col-span-1">
            <div className="mb-1 text-sm font-medium">Nueva contraseña</div>
            <input type="password" autoComplete="new-password" className="w-full rounded-lg border border-purple-200 bg-white px-3 py-2" value={newPwd} onChange={(e) => setNewPwd(e.target.value)} />
            <div className="mt-1 text-xs text-slate-500">Usa 8+ caracteres con mayúsculas, números y símbolos.</div>
          </div>
          <div className="md:col-span-1">
            <div className="mb-1 text-sm font-medium">Repetir contraseña</div>
            <input type="password" autoComplete="new-password" className="w-full rounded-lg border border-purple-200 bg-white px-3 py-2" value={newPwd2} onChange={(e) => setNewPwd2(e.target.value)} />
          </div>
        </div>
        <div className="mt-4">
          <button onClick={onChangePassword} disabled={savingPwd} className="rounded-xl bg-purple-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-purple-700">
            {savingPwd ? "Actualizando…" : "Actualizar contraseña"}
          </button>
        </div>
      </div>
    </div>
  );
}
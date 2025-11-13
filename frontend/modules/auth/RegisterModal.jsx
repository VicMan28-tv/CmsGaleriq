// frontend/modules/auth/RegisterModal.jsx
import React, { useMemo, useState } from "react";
import Modal from "../../components/Modal.jsx";

const API_URL = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000";

function isAdult(birthdateStr, minAgeYears = 18) {
  if (!birthdateStr) return true;
  const b = dayjs(birthdateStr);
  if (!b.isValid()) return true;
  const age = dayjs().diff(b, "year", true);
  return age >= minAgeYears;
}

export default function RegisterModal({ open, onClose, onRegistered }) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [gender, setGender] = useState("");

  // Foto de perfil (opcional)
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const MAX_PHOTO_MB = 3;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  const pwdScore = useMemo(() => {
    let s = 0;
    if (password.length >= 8) s++;
    if (/[A-Z]/.test(password)) s++;
    if (/[a-z]/.test(password)) s++;
    if (/[0-9]/.test(password)) s++;
    if (/[^A-Za-z0-9]/.test(password)) s++;
    return s; // 0..5
  }, [password]);

  const resetState = () => {
    setFullName("");
    setEmail("");
    setPhone("");
    setPassword("");
    setPassword2("");
    setBirthdate("");
    setGender("");
    setPhotoFile(null);
    setPhotoPreview(null);
    setLoading(false);
    setError("");
    setOk("");
  };
  const handleClose = () => {
    resetState();
    onClose?.();
  };

  const toBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const onPickPhoto = async (file) => {
    if (!file) return;
    const sizeMb = file.size / (1024 * 1024);
    if (sizeMb > MAX_PHOTO_MB) {
      setError(`La imagen supera ${MAX_PHOTO_MB} MB.`);
      return;
    }
    setError("");
    setPhotoFile(file);
    const dataUrl = await toBase64(file);
    setPhotoPreview(dataUrl);
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setOk("");

    if (!isAdult(birthdate, 18))
      return setError("Debes tener al menos 18 años.");
    if (password !== password2)
      return setError("Las contraseñas no coinciden.");
    if (pwdScore < 3)
      return setError(
        "Contraseña insegura, usa 8+ caracteres con mayúsculas, números y símbolos."
      );

    // Enviamos multipart al endpoint /auth/register
    const fd = new FormData();
    fd.append("full_name", fullName);
    fd.append("email", email);
    fd.append("password", password);
    if (phone) fd.append("phone", phone);
    if (birthdate) fd.append("birthdate", birthdate); // yyyy-mm-dd
    // Normalizamos género a los valores esperados
    const gnorm = !gender
      ? "prefer_not_to_say"
      : gender === "other"
      ? "nonbinary"
      : gender;
    fd.append("gender", gnorm);
    if (photoFile) fd.append("avatar", photoFile);

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        body: fd,
      });

      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        setOk("¡Cuenta creada! Ya puedes iniciar sesión.");
        onRegistered?.({ email, password });
        setTimeout(handleClose, 900);
      } else if (res.status === 409) {
        setError("El email ya está registrado.");
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data?.detail || "No fue posible crear la cuenta.");
      }
    } catch {
      setError("Error de red. Verifica que la API esté encendida.");
    } finally {
      setLoading(false);
    }
  };

  const todayISO = new Date().toISOString().split("T")[0];

  return (
    <Modal open={open} onClose={handleClose} title="Crear una cuenta" wide>
      <form onSubmit={submit} className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {(error || ok) && (
          <div className="md:col-span-2">
            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            )}
            {ok && (
              <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
                {ok}
              </p>
            )}
          </div>
        )}

        {/* 1ª fila */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">
            Nombre completo
          </label>
          <input
            className="w-full rounded-xl border border-purple-200 bg-white/70 px-4 py-2 outline-none focus:border-purple-300 focus:bg-white"
            placeholder="Ej. Juan Perez"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Teléfono</label>
          <input
            className="w-full rounded-xl border border-purple-200 bg-white/70 px-4 py-2 outline-none focus:border-purple-300 focus:bg-white"
            placeholder="+52 55 1234 5678"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>

        {/* 2ª fila */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Email</label>
          <input
            type="email"
            autoComplete="email"
            className="w-full rounded-xl border border-purple-200 bg-white/70 px-4 py-2 outline-none focus:border-purple-300 focus:bg-white"
            placeholder="tu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">
            Fecha de nacimiento
          </label>
          <input
            type="date"
            className="w-full rounded-xl border border-purple-200 bg-white/70 px-4 py-2 outline-none focus:border-purple-300 focus:bg-white"
            value={birthdate}
            onChange={(e) => setBirthdate(e.target.value)}
            max={todayISO}
            required
          />
          <p className="text-xs text-slate-500">Debes ser mayor de 18 años.</p>
        </div>

        {/* 3ª fila */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">
            Género (opcional)
          </label>
          <select
            className="w-full rounded-xl border border-purple-200 bg-white/70 px-4 py-2 outline-none focus:border-purple-300 focus:bg-white"
            value={gender}
            onChange={(e) => setGender(e.target.value)}
          >
            <option value="">Prefiero no decir</option>
            <option value="female">Femenino</option>
            <option value="male">Masculino</option>
            <option value="nonbinary">No binario</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">
            Contraseña
          </label>
          <input
            type="password"
            autoComplete="new-password"
            className="w-full rounded-xl border border-purple-200 bg-white/70 px-4 py-2 outline-none focus:border-purple-300 focus:bg-white"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
            <div
              className={`h-full ${
                pwdScore <= 2
                  ? "bg-red-400"
                  : pwdScore === 3
                  ? "bg-yellow-400"
                  : "bg-green-500"
              }`}
              style={{ width: `${(pwdScore / 5) * 100}%` }}
            />
          </div>
          <p className="text-xs text-slate-500">
            Usa 8+ caracteres con mayúsculas, números y símbolos.
          </p>
        </div>

        {/* 4ª fila */}
        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium text-slate-700">
            Confirmar contraseña
          </label>
          <input
            type="password"
            autoComplete="new-password"
            className="w-full rounded-xl border border-purple-200 bg-white/70 px-4 py-2 outline-none focus:border-purple-300 focus:bg-white"
            placeholder="••••••••"
            value={password2}
            onChange={(e) => setPassword2(e.target.value)}
            required
          />
        </div>

        {/* 5ª fila: Foto de perfil al final (opcional) */}
        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Foto de perfil (opcional)
          </label>
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 overflow-hidden rounded-full border border-purple-200 bg-slate-100">
              {photoPreview ? (
                <img
                  src={photoPreview}
                  alt="preview"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="grid h-full w-full place-items-center text-xs text-slate-400">
                  Sin foto
                </div>
              )}
            </div>
            <div>
              <input
                id="photo"
                type="file"
                accept="image/*"
                onChange={(e) => onPickPhoto(e.target.files?.[0])}
                className="block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-purple-100 file:px-3 file:py-2 file:text-purple-700 hover:file:bg-purple-200"
              />
              <p className="mt-1 text-xs text-slate-500">
                Máx. 3 MB. JPG o PNG.
              </p>
            </div>
          </div>
        </div>

        {/* Botón */}
        <div className="md:col-span-2">
          <button
            disabled={loading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-500 to-fuchsia-500 px-4 py-2.5 font-medium text-white shadow-lg shadow-purple-300/40 disabled:opacity-70"
          >
            {loading ? "Creando…" : "Crear cuenta"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

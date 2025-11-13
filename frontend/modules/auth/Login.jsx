// frontend/modules/auth/Login.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import useCMSStore from "../../store/useCMSStore.js";
import RegisterModal from "./RegisterModal.jsx";

export default function Login() {
  const navigate = useNavigate();

  const hydrate = useCMSStore((s) => s.hydrate);
  const login = useCMSStore((s) => s.login);
  const isAuth = useCMSStore((s) => s.isAuth);

  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [openRegister, setOpenRegister] = useState(false);
  const CELL_SIZE = 64; // celdas más grandes
  const [gridDims, setGridDims] = useState({ cols: 0, rows: 0 });
  const [trail, setTrail] = useState([]); // rastro de celdas iluminadas
  const [lastEmit, setLastEmit] = useState(0);
  const containerRef = React.useRef(null);
  const ALIGN_OFFSET_X = -1; // leve ajuste horizontal
  const ALIGN_OFFSET_Y = -2; // leve ajuste vertical (más arriba)

  useEffect(() => {
    hydrate();
  }, [hydrate]);
  useEffect(() => {
    if (isAuth) navigate("/");
  }, [isAuth, navigate]);

  // Calcula cantidad de celdas según viewport
  useEffect(() => {
    const update = () => {
      const cols = Math.ceil(window.innerWidth / CELL_SIZE);
      const rows = Math.ceil(window.innerHeight / CELL_SIZE);
      setGridDims({ cols, rows });
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const totalCells = useMemo(
    () => gridDims.cols * gridDims.rows,
    [gridDims.cols, gridDims.rows]
  );

  const handleMouseMove = (e) => {
    const now = Date.now();
    if (now - lastEmit < 30) return; // limitar frecuencia
    setLastEmit(now);
    const rect = containerRef.current?.getBoundingClientRect();
    const x = e.clientX - (rect?.left || 0);
    const y = e.clientY - (rect?.top || 0);
    const col = Math.floor(x / CELL_SIZE);
    const row = Math.floor(y / CELL_SIZE);
    const left = col * CELL_SIZE;
    const top = row * CELL_SIZE;
    const id = `${left},${top}-${now}`;
    setTrail((prev) => {
      const next = [...prev, { left, top, id, t: now }];
      // limita longitud del rastro
      return next.slice(-24);
    });
    // elimina cada punto tras animación
    setTimeout(() => {
      setTrail((prev) => prev.filter((p) => p.id !== id));
    }, 900);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      await login(email, pwd);
    } catch (e) {
      setErr(e?.message || "No se pudo iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="login-grid-bg"
      style={{ ["--grid"]: `${CELL_SIZE}px` }}
    >
      {/* Capa de celdas interactivas (hover morado) */}
      <div
        className="grid-hover-layer"
        style={{
          gridTemplateColumns: `repeat(${gridDims.cols}, var(--cell))`,
          gridTemplateRows: `repeat(${gridDims.rows}, var(--cell))`,
          ["--cell"]: `${CELL_SIZE}px`,
        }}
        aria-hidden
      >
        {Array.from({ length: totalCells }).map((_, i) => (
          <span key={i} className="grid-cell" />
        ))}
      </div>
      {/* Rastro morado que se desvanece */}
      <div className="trail-layer" aria-hidden>
        {trail.map((p) => (
          <span
            key={p.id}
            className="trail-dot"
            style={{ left: p.left + ALIGN_OFFSET_X, top: p.top + ALIGN_OFFSET_Y, width: CELL_SIZE, height: CELL_SIZE }}
          />
        ))}
      </div>

      <div className="login-card w-full max-w-md rounded-2xl p-6 anim-in">
        <h1 className="mb-1 text-center text-xl font-semibold text-slate-800">
          Iniciar sesión
        </h1>
        <p className="mb-6 text-center text-sm text-slate-600">
          Bienvenido al CMS Galeriq 💜
        </p>

        <form onSubmit={onSubmit} className="space-y-4">
          {err && (
            <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
              {err}
            </p>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Email</label>
            <input
              type="email"
              className="login-input w-full rounded-xl border px-4 py-2 outline-none"
              placeholder="Escriba su correo porfavor"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              Contraseña
            </label>
            <input
              type="password"
              className="login-input w-full rounded-xl border px-4 py-2 outline-none"
              placeholder="Escriba su contraseña porfavor"
              autoComplete="current-password"
              value={pwd}
              onChange={(e) => setPwd(e.target.value)}
              required
            />
          </div>

          <button
            disabled={loading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-4 py-2.5 font-medium text-white shadow-lg shadow-purple-300/40 hover:shadow-purple-400/50 transition-base disabled:opacity-70"
          >
            {loading ? "Entrando…" : "Entrar"}
          </button>

          <div className="pt-2 text-center text-sm text-slate-600">
            ¿No tienes cuenta?{" "}
            <button
              type="button"
              onClick={() => setOpenRegister(true)}
              className="font-medium text-purple-600 underline-offset-2 hover:underline"
            >
              Regístrate
            </button>
          </div>
        </form>
      </div>

      {/* Modal de Registro */}
      <RegisterModal
        open={openRegister}
        onClose={() => setOpenRegister(false)}
        onRegistered={({ email, password }) => {
          setEmail(email);
          setPwd(password);
        }}
      />
    </div>
  );
}

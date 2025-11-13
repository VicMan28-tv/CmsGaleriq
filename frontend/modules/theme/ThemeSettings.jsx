import React, { useEffect, useMemo, useState } from "react";
import Toast from "../../components/ui/Toast.jsx";

const API_BASE =
  import.meta.env.VITE_CMS_API_BASE ||
  window.__CMS_API_BASE__ ||
  "http://localhost:8000";

export default function ThemeSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ open: false, type: "success", message: "" });
  const [form, setForm] = useState({
    name: "Default",
    primary_color: "#8b5cf6",
    secondary_color: "#f5f3ff",
    accent_color: "#a78bfa",
    background_color: "#faf5ff",
    text_color: "#1f2937",
    mode: "light",
  });

  async function fetchTheme() {
    try {
      const res = await fetch(`${API_BASE}/api/theme`, {
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error("No pude cargar el tema");
      const data = await res.json();
      setForm({
        name: data.name ?? "Default",
        primary_color: data.primary_color ?? "#8b5cf6",
        secondary_color: data.secondary_color ?? "#f5f3ff",
        accent_color: data.accent_color ?? "#a78bfa",
        background_color: data.background_color ?? "#faf5ff",
        text_color: data.text_color ?? "#1f2937",
        mode: data.mode ?? "light",
      });
    } catch (e) {
      console.error(e);
      setToast({ open: true, type: "error", message: "No se pudo cargar el tema." });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    (async () => {
      // Hidrata inmediatamente desde caché local (si existe) para evitar espera
      try {
        const cached = localStorage.getItem("cms.cache.theme");
        if (cached) {
          const d = JSON.parse(cached);
          setForm({
            name: d.name ?? "Default",
            primary_color: d.primary_color ?? "#8b5cf6",
            secondary_color: d.secondary_color ?? "#f5f3ff",
            accent_color: d.accent_color ?? "#a78bfa",
            background_color: d.background_color ?? "#faf5ff",
            text_color: d.text_color ?? "#1f2937",
            mode: d.mode ?? "light",
          });
          setLoading(false);
        }
      } catch (_) {}
      try {
        const res = await fetch(`${API_BASE}/api/theme`, {
          headers: { "Content-Type": "application/json" },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setForm({
          name: data.name ?? "Default",
          primary_color: data.primary_color ?? "#8b5cf6",
          secondary_color: data.secondary_color ?? "#f5f3ff",
          accent_color: data.accent_color ?? "#a78bfa",
          background_color: data.background_color ?? "#faf5ff",
          text_color: data.text_color ?? "#1f2937",
          mode: data.mode ?? "light",
        });
        // Persistir caché para cargas instantáneas futuras
        try { localStorage.setItem("cms.cache.theme", JSON.stringify(data)); } catch (_) {}
      } catch (e) {
        console.warn("No se pudo cargar el tema, usando defaults:", e);
        setForm({
          name: "Demo Theme",
          primary_color: "#8b5cf6",
          secondary_color: "#ede9fe",
          accent_color: "#c084fc",
          background_color: "#faf5ff",
          text_color: "#1f2937",
          mode: "light",
        });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Aplica el tema al documento para que el cambio sea visible al instante
  useEffect(() => {
    try {
      const root = document.documentElement;
      root.style.setProperty("--galeriq-primary", form.primary_color);
      root.style.setProperty("--galeriq-secondary", form.secondary_color);
      root.style.setProperty("--galeriq-accent", form.accent_color);
      root.style.setProperty("--galeriq-bg", form.background_color);
      root.style.setProperty("--galeriq-text", form.text_color);
      // Fallback directo al body para asegurar el fondo y texto
      document.body.style.background = form.background_color;
      document.body.style.color = form.text_color;
      // Sugiere esquema de color al navegador
      const isDark = (form.mode || "light").toLowerCase() === "dark";
      root.style.setProperty("color-scheme", isDark ? "dark" : "light");
    } catch (_) {}
  }, [form]);

  // ===== Generador de paleta tipo Tailwind =====
  const labels = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
  const [activeTarget, setActiveTarget] = useState("primary_color");
  const [generatorHex, setGeneratorHex] = useState(form.primary_color || "#8b5cf6");
  const [selectedShadeHex, setSelectedShadeHex] = useState(null);
  const [contrastShift, setContrastShift] = useState(0); // -20..+20

  // Sincroniza el generador con el color del objetivo activo
  useEffect(() => {
    setGeneratorHex(form[activeTarget]);
    setSelectedShadeHex(null);
  }, [activeTarget]);

  const clamp = (v, min, max) => Math.min(Math.max(v, min), max);
  const hexToRgb = (hex) => {
    const h = hex.replace("#", "");
    const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
    const bigint = parseInt(full, 16);
    return { r: (bigint >> 16) & 255, g: (bigint >> 8) & 255, b: bigint & 255 };
  };
  const rgbToHex = (r, g, b) => {
    const toHex = (n) => clamp(Math.round(n), 0, 255).toString(16).padStart(2, "0");
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  };
  const rgbToHsl = (r, g, b) => {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    if (max === min) { h = s = 0; }
    else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        default: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
    return { h, s, l };
  };
  const hslToRgb = (h, s, l) => {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    let r, g, b;
    if (s === 0) { r = g = b = l; }
    else {
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }
    return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
  };
  const readableText = (hex) => {
    const { r, g, b } = hexToRgb(hex);
    const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
    return luminance > 0.6 ? "#111111" : "#ffffff";
  };
  const generatePalette = (baseHex, shift = 0) => {
    const { r, g, b } = hexToRgb(baseHex);
    const { h, s } = rgbToHsl(r, g, b);
    // Curva de luz aproximada a Tailwind (0..1)
    const baseCurve = [0.95, 0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2, 0.12, 0.08];
    const lShift = shift / 100; // -0.2..0.2
    const shades = {};
    baseCurve.forEach((lv, idx) => {
      const lFinal = clamp(lv + lShift, 0.04, 0.97);
      const sAdj = clamp(s * (1 - Math.abs(idx - 5) * 0.05), 0, 1);
      const rgb = hslToRgb(h, sAdj, lFinal);
      shades[labels[idx]] = rgbToHex(rgb.r, rgb.g, rgb.b);
    });
    return shades;
  };
  const palette = useMemo(() => generatePalette(generatorHex, contrastShift), [generatorHex, contrastShift]);
  const applySelectedColor = () => {
    const color = selectedShadeHex || generatorHex;
    setForm((f) => {
      const next = { ...f, [activeTarget]: color };
      if (activeTarget === "background_color") {
        next.text_color = readableText(color);
      }
      if (activeTarget === "primary_color") {
        next.accent_color = palette[400] || color;
      }
      return next;
    });
  };

  // Al seleccionar un tono de la paleta: actualizar selector, vista y el objetivo activo al instante
  const selectShade = (hex) => {
    setSelectedShadeHex(hex);
    setGeneratorHex(hex);
    setForm((f) => {
      const next = { ...f, [activeTarget]: hex };
      if (activeTarget === "background_color") {
        next.text_color = readableText(hex);
      }
      if (activeTarget === "primary_color") {
        next.accent_color = palette[400] || hex;
      }
      return next;
    });
  };

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (["primary_color", "secondary_color", "background_color"].includes(name)) {
      setActiveTarget(name);
      setGeneratorHex(value);
      setSelectedShadeHex(null);
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/theme`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Error al guardar el tema");
      const data = await res.json();
      try { localStorage.setItem("cms.cache.theme", JSON.stringify(data)); } catch (_) {}
      setToast({ open: true, type: "success", message: "Tema guardado ✅" });
    } catch (e) {
      console.error(e);
      setToast({ open: true, type: "error", message: "Ocurrió un error al guardar." });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-6">Cargando tema...</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-800">Tema</h1>
        <button
          onClick={save}
          disabled={saving}
          className="btn-primary"
        >
          {saving ? "Guardando..." : "Guardar"}
        </button>
      </div>

      {/* Controles principales */}
      <div className="rounded-2xl p-6 border shadow-sm bg-white/50" style={{ borderColor: "#e5e7eb" }}>
        {/* Preset único */}
        <div className="mb-4">
          <div className="text-sm font-semibold text-slate-700 mb-2">Presets</div>
          <div className="flex flex-wrap gap-2">
            {[
              { name: "Defecto", primary_color: "#7c3aed", secondary_color: "#ede9fe", background_color: "#faf5ff" },
            ].map((p) => (
              <button
                key={p.name}
                onClick={() => setForm((f) => ({
                  ...f,
                  primary_color: p.primary_color,
                  secondary_color: p.secondary_color,
                  background_color: p.background_color,
                  accent_color: p.primary_color,
                  text_color: readableText(p.background_color),
                }))}
                className="rounded-lg border px-3 py-1.5 text-sm hover:bg-purple-50 hover:border-purple-400"
                title={`Aplicar preset ${p.name}`}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            ["primary_color", "Primario"],
            ["secondary_color", "Secundario"],
            ["background_color", "Fondo"],
          ].map(([key, label]) => (
            <label key={key} className="flex items-center gap-4">
              <button
                type="button"
                className={`w-40 text-left rounded px-2 py-1 ${activeTarget === key ? "border-2 border-violet-500" : ""}`}
                onClick={() => setActiveTarget(key)}
              >
                {label}
              </button>
              <input
                type="color"
                className="h-10 w-16 border rounded shadow"
                name={key}
                value={form[key]}
                onChange={onChange}
                onFocus={() => setActiveTarget(key)}
              />
              <input
                className="border rounded px-3 py-2 flex-1"
                name={key}
                value={form[key]}
                onChange={onChange}
                onFocus={() => setActiveTarget(key)}
              />
            </label>
          ))}
        </div>
      </div>

      {/* Generador de paleta tipo Tailwind */}
      <div className="rounded-xl p-6 border bg-white/50" style={{ borderColor: "#e5e7eb" }}>
        <div className="flex items-center justify-between mb-4">
          <div className="text-lg font-semibold" style={{ color: form.accent_color }}>Generador de paleta (Tailwind CSS)</div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          <div className="flex items-center gap-3">
            <input type="color" value={generatorHex} onChange={(e) => setGeneratorHex(e.target.value)} className="w-10 h-10 rounded-md" />
            <input type="text" value={generatorHex} onChange={(e) => setGeneratorHex(e.target.value)} className="border rounded-md px-2 py-1 w-32" />
          </div>
          <div className="md:col-span-2 flex items-center gap-3">
            <label className="text-sm">Contraste</label>
            <input type="range" min={-20} max={20} step={1} value={contrastShift} onChange={(e) => setContrastShift(parseInt(e.target.value))} className="flex-1" />
            <span className="text-sm w-10 text-center">{contrastShift}</span>
            <div
              className="w-8 h-8 rounded-lg border shadow"
              style={{ background: selectedShadeHex || generatorHex, borderColor: "#e5e7eb" }}
              title={selectedShadeHex || generatorHex}
            />
          </div>
        </div>
        <div className="grid grid-cols-3 md:grid-cols-6 lg:grid-cols-11 gap-3 mt-6">
          {labels.map((lbl) => (
            <div
              key={lbl}
              className="rounded-xl p-3 shadow cursor-pointer border"
              style={{ background: palette[lbl], color: readableText(palette[lbl]), borderColor: "#e5e7eb" }}
              onClick={() => selectShade(palette[lbl])}
              title={`Seleccionar tono ${lbl}`}
            >
              <div className="text-xs font-semibold">{lbl}</div>
              <div className="text-xs">{palette[lbl]}</div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <button className="btn-primary" onClick={applySelectedColor}>Guardar color</button>
          <span className="text-sm opacity-80">Objetivo: {activeTarget.replace("_color", "")}. Selecciona un tono; se aplica al instante.</span>
        </div>
      </div>

      <Toast
        open={toast.open}
        type={toast.type}
        message={toast.message}
        onClose={() => setToast((t) => ({ ...t, open: false }))}
      />

      </div>
  );
}

import React, { useMemo, useState } from "react";
import Modal from "../../components/Modal.jsx";
import useCMSStore from "../../store/useCMSStore.js";
import { FIELD_TEMPLATES } from "../../lib/fieldTemplates.jsx";

// Genera un Field ID estilo Contentful: camelCase, empezando en minúscula
// Incluye corrección de typos comunes (subtitule->subtitle, tittle->title, lable->label)
const toApiId = (s) => {
  try {
    const words = String(s)
      .trim()
      .replace(/[^A-Za-z0-9]+/g, " ")
      .match(/[A-Za-z0-9]+/g) || [];
    if (words.length === 0) return "";
    const fix = (w) => {
      const dict = {
        subtitule: "subtitle",
        subtitulo: "subtitle",
        tittle: "title",
        lable: "label",
      };
      const lower = w.toLowerCase();
      return dict[lower] || lower;
    };
    const first = fix(words[0]).toLowerCase();
    const rest = words
      .slice(1)
      .map((w) => {
        const fw = fix(w);
        return fw.charAt(0).toUpperCase() + fw.slice(1).toLowerCase();
      })
      .join("");
    let out = `${first}${rest}`;
    // Aseguramos que empiece por letra
    if (!/^[a-z]/.test(out)) out = `f${out}`;
    return out;
  } catch {
    return "";
  }
};

export default function AddFieldModal({ open, onClose, typeId, existingIds }) {
  const [step, setStep] = useState("choose");
  const [tpl, setTpl] = useState(null);
  const [name, setName] = useState("");
  const [apiId, setApiId] = useState("");
  const [autoId, setAutoId] = useState(true); // mientras sea true, el ID se sugiere desde Name
  const [touchedId, setTouchedId] = useState(false); // controla cuándo mostrar estado de error visual
  const [config, setConfig] = useState({});
  const addField = useCMSStore((s) => s.addField);
  const addFieldRemote = useCMSStore((s) => s.addFieldToContentTypeRemote);
  const contentTypes = useCMSStore((s) => s.contentTypes);
  const [err, setErr] = useState(null);

  const invalidId = useMemo(() => {
    if (!apiId) return true;
    // Permite camelCase: debe iniciar con minúscula y continuar con letras/dígitos
    if (!/^[a-z][a-zA-Z0-9]*$/.test(apiId)) return true;
    if (existingIds.includes(apiId)) return true;
    return false;
  }, [apiId, existingIds]);

  const pick = (t) => {
    setTpl(t);
    setConfig(t.config || {});
    setStep("config");
  };
  const reset = () => {
    setStep("choose");
    setTpl(null);
    setName("");
    setApiId("");
    setAutoId(true);
    setTouchedId(false);
    setConfig({});
  };

  const submit = async (e) => {
    e.preventDefault();
    setErr(null);
    if (!name.trim() || invalidId) return;
    const labelFor = () => {
      if (tpl.key === "shortText") {
        if (config.mode === "long") return "Long text";
        if (config.mode === "list") return "Text list";
        return "Short text";
      }
      return tpl.label;
    };
    const field = {
      id: crypto.randomUUID(),
      name: name.trim(),
      apiId,
      icon: tpl.icon,
      typeKey: tpl.key,
      typeLabel: labelFor(),
      desc: tpl.desc,
      config,
    };
    try {
      const t = contentTypes.find((x) => x.id === typeId);
      const isRemote = Array.isArray(t?.schema);
      if (isRemote) {
        await addFieldRemote(typeId, field);
      } else {
        addField(typeId, field);
      }
      reset();
      onClose();
    } catch (e) {
      setErr(e?.message || "No se pudo agregar el campo");
    }
  };

  return (
    <Modal
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
      title={step === "choose" ? "Add new field" : `Add field · ${tpl?.label}`}
      wide={step !== "choose"}
    >
      {step === "choose" && (
        <div className="grid gap-3 sm:grid-cols-2">
          {FIELD_TEMPLATES.map((t) => (
            <button
              key={t.key}
              onClick={() => pick(t)}
              className="flex items-start gap-3 rounded-xl border border-purple-200 bg-white p-4 text-left hover:bg-purple-50"
            >
              <div className="mt-0.5 text-purple-700">
                <t.icon />
              </div>
              <div>
                <div className="font-medium text-slate-800">{t.label}</div>
                <div className="text-sm text-slate-500">{t.desc}</div>
              </div>
            </button>
          ))}
        </div>
      )}

      {step === "config" && tpl && (
        <form onSubmit={submit} className="space-y-5">
          {err && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
              {err}
            </div>
          )}
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">
                Name (required)
              </label>
              <input
                className="w-full rounded-lg border border-purple-200 bg-purple-50/60 px-3 py-2 outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-200"
                placeholder="Entry title"
                value={name}
                onChange={(e) => {
                  const val = e.target.value;
                  setName(val);
                  if (autoId) setApiId(toApiId(val));
                  // autogenerado desde Name no marca error visual
                  setTouchedId(false);
                }}
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Field ID</label>
              <input
                className={`w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 ${
                  invalidId && touchedId
                    ? "border-rose-300 bg-rose-50/60 focus:ring-rose-200"
                    : "border-purple-200 bg-purple-50/60 focus:border-purple-400 focus:ring-purple-200"
                }`}
                placeholder="ID Field"
                value={apiId}
                onChange={(e) => {
                  setAutoId(false);
                  setApiId(toApiId(e.target.value));
                  setTouchedId(true);
                }}
                onBlur={() => setTouchedId(true)}
              />
              <p className="mt-1 text-xs text-slate-500">
                Debe iniciar en minúscula, sin espacios, único.
              </p>
            </div>
          </div>

          {tpl.key === "shortText" && (
            <div className="rounded-xl border border-purple-200 bg-purple-50/40 p-4">
              <div className="mb-3 flex items-center gap-2 text-purple-700">
                <tpl.icon />
                <div className="font-medium">Text · configuration</div>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="st"
                    checked={config.mode === "short"}
                    onChange={() => setConfig({ mode: "short" })}
                  />{" "}
                  Short text
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="st"
                    checked={config.mode === "long"}
                    onChange={() => setConfig({ mode: "long" })}
                  />{" "}
                  Long text
                </label>
                <label className="flex items-center gap-2 text-sm sm:col-span-3">
                  <input
                    type="radio"
                    name="st"
                    checked={config.mode === "list"}
                    onChange={() => setConfig({ mode: "list" })}
                  />{" "}
                  List (multiple)
                </label>
              </div>
            </div>
          )}

          {tpl.key === "number" && (
            <div className="rounded-xl border border-purple-200 bg-purple-50/40 p-4">
              <div className="mb-3 flex items-center gap-2 text-purple-700">
                <tpl.icon />
                <div className="font-medium">Number · configuration</div>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <div className="text-sm font-medium">Type</div>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="num"
                      checked={config.variant === "integer"}
                      onChange={() =>
                        setConfig({ ...config, variant: "integer" })
                      }
                    />{" "}
                    Integer
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="num"
                      checked={config.variant === "decimal"}
                      onChange={() =>
                        setConfig({ ...config, variant: "decimal" })
                      }
                    />{" "}
                    Decimal
                  </label>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Min</label>
                  <input
                    type="number"
                    className="w-full rounded-lg border border-purple-200 bg-white px-3 py-2"
                    value={config?.validations?.min ?? ""}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        validations: {
                          ...config.validations,
                          min:
                            e.target.value === ""
                              ? null
                              : Number(e.target.value),
                        },
                      })
                    }
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Max</label>
                  <input
                    type="number"
                    className="w-full rounded-lg border border-purple-200 bg-white px-3 py-2"
                    value={config?.validations?.max ?? ""}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        validations: {
                          ...config.validations,
                          max:
                            e.target.value === ""
                              ? null
                              : Number(e.target.value),
                        },
                      })
                    }
                  />
                </div>
              </div>
            </div>
          )}

          {tpl.key === "media" && (
            <div className="rounded-xl border border-purple-200 bg-purple-50/40 p-4">
              <div className="mb-3 flex items-center gap-2 text-purple-700">
                <tpl.icon />
                <div className="font-medium">Media · configuration</div>
              </div>
              <label className="mr-6 inline-flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="m"
                  checked={!config.many}
                  onChange={() => setConfig({ many: false })}
                />{" "}
                One file
              </label>
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="m"
                  checked={!!config.many}
                  onChange={() => setConfig({ many: true })}
                />{" "}
                Many files
              </label>
            </div>
          )}

          {tpl.key === "reference" && (
            <div className="rounded-xl border border-purple-200 bg-purple-50/40 p-4">
              <div className="mb-3 flex items-center gap-2 text-purple-700">
                <tpl.icon />
                <div className="font-medium">Reference · configuration</div>
              </div>
              <label className="mr-6 inline-flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="r"
                  checked={!config.multiple}
                  onChange={() => setConfig({ ...config, multiple: false })}
                />{" "}
                One reference
              </label>
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="r"
                  checked={!!config.multiple}
                  onChange={() => setConfig({ ...config, multiple: true })}
                />{" "}
                Many references
              </label>
              <div className="pt-2 text-xs text-slate-500">
                (Opcional) Allowed content types se agrega luego.
              </div>
            </div>
          )}

          {tpl.key === "datetime" && (
            <div className="rounded-xl border border-purple-200 bg-purple-50/40 p-4">
              <div className="mb-3 flex items-center gap-2 text-purple-700">
                <tpl.icon />
                <div className="font-medium">Date & time · configuration</div>
              </div>
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={!!config.withTime}
                  onChange={(e) => setConfig({ withTime: !!e.target.checked })}
                />{" "}
                Include time
              </label>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setStep("choose")}
              className="rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-purple-50"
            >
              Back
            </button>
            <button
              disabled={invalidId}
              type="submit"
              className="rounded-lg bg-purple-600 px-3 py-2 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-50"
            >
              Add and configure
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}

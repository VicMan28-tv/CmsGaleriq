// frontend/store/useCMSStore.js
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

const API_URL = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000";
const uuid = () =>
  globalThis.crypto && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);

const useCMSStore = create(
  persist(
    (set, get) => ({
      // ---------- AUTH ----------
      token: null, // JWT
      user: null, // { user_id, email, role, full_name }
      role: null, // "admin" | "employee"
      isAuth: false,

      hydrate: () => {
        // Rehidrata manualmente desde almacenamiento si fuera necesario
        try {
          let raw = localStorage.getItem("cms_dise_state");
          if (!raw) raw = sessionStorage.getItem("cms_dise_state");
          if (!raw) return;
          const data = JSON.parse(raw)?.state;
          if (data?.token && data?.user) {
            set({
              token: data.token,
              user: data.user,
              role: data.user.role,
              isAuth: true,
            });
          }
        } catch (_) {}
      },

      // Login real: POST /auth/login
      login: async (email, password) => {
        const res = await fetch(`${API_URL}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email?.trim(), password: (password ?? "").trim() }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.detail || "Credenciales inválidas");
        }
        const data = await res.json(); // { access_token, token_type, user }
        set({
          token: data.access_token,
          user: data.user,
          role: data.user?.role ?? null,
          isAuth: true,
        });
        // Mantener sesión coherente en ambos almacenes para loaders que lean sessionStorage
        try {
          const state = { state: { token: data.access_token, user: data.user, role: data.user?.role ?? null } };
          sessionStorage.setItem("cms_dise_state", JSON.stringify(state));
        } catch (_) {}
        // Prefetch y cache hydration para evitar espera inicial tras login
        try {
          const ctCache = localStorage.getItem("cms.cache.contentTypes");
          if (ctCache) {
            const parsed = JSON.parse(ctCache);
            if (Array.isArray(parsed)) set({ contentTypes: parsed });
          }
          const entriesCache = localStorage.getItem("cms.cache.entries.all");
          if (entriesCache) {
            const parsed = JSON.parse(entriesCache);
            const normalized = Array.isArray(parsed)
              ? parsed.map((d) => ({ ...d, values: d.fields }))
              : [];
            set({ entries: normalized });
          }
        } catch (_) {}
        // Lanzar cargas en segundo plano (no bloquea navegación)
        Promise.allSettled([
          get().loadContentTypes(),
          get().loadEntries(),
        ]).catch(() => {});
        return data.user;
      },

      logout: () => {
        set({ token: null, user: null, role: null, isAuth: false });
        try {
          localStorage.removeItem("cms_dise_state");
          sessionStorage.removeItem("cms_dise_state");
        } catch (_) {}
      },

      // Helper para llamadas autenticadas
      authFetch: async (path, options = {}) => {
        // Obtiene token/rol del store y, si falta (p. ej. durante rehidratación), lee de localStorage
        let token = get().token;
        let rawRole = get().role;
        if (!token || !rawRole) {
          try {
            let raw = localStorage.getItem("cms_dise_state");
            if (!raw) raw = sessionStorage.getItem("cms_dise_state");
            if (raw) {
              const persisted = JSON.parse(raw)?.state || {};
              token = token || persisted.token;
              rawRole = rawRole || persisted.role || persisted.user?.role;
            }
          } catch (_) {}
        }
        // Normaliza rol para cabecera X-Role (backend espera 'admin' | 'employee')
        const normRole = rawRole === "empleado" ? "employee" : rawRole;
        const headers = new Headers(options.headers || {});
        if (token) headers.set("Authorization", `Bearer ${token}`);
        if (normRole) headers.set("X-Role", normRole);
        const res = await fetch(`${API_URL}${path}`, { ...options, headers });
        // Manejo automático de 401 para evitar estados inconsistentes
        if (res.status === 401) {
          let detail = "Sesión expirada o token ausente";
          try {
            const body = await res.clone().json();
            if (body?.detail) detail = body.detail;
          } catch (_) {}
          // Limpia sesión y redirige al login para regenerar token
          set({ token: null, user: null, role: null, isAuth: false });
          try {
            localStorage.removeItem("cms_dise_state");
            sessionStorage.removeItem("cms_dise_state");
          } catch (_) {}
          try {
            if (typeof window !== "undefined" && window.location) {
              // Redirección suave sin perder navegación
              window.location.href = "/login";
            }
          } catch (_) {}
          const err = new Error(`401 Unauthorized: ${detail}`);
          err.status = 401;
          throw err;
        }
        return res;
      },

      // -------- PERFIL --------
      loadMyProfile: async () => {
        const res = await get().authFetch(`/users/me`);
        if (!res.ok) {
          let msg = "No se pudo cargar el perfil";
          try { const err = await res.json(); msg = err?.detail || msg; } catch (_) {}
          throw new Error(msg);
        }
        const data = await res.json();
        set({ user: { ...(get().user ?? {}), ...data }, role: data?.role ?? get().role });
        return data;
      },
      updateMyProfile: async (patch) => {
        const res = await get().authFetch(`/users/me`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patch),
        });
        if (!res.ok) {
          let msg = "No se pudo actualizar el perfil";
          try { const err = await res.json(); msg = err?.detail || msg; } catch (_) {}
          throw new Error(msg);
        }
        const data = await res.json();
        set({ user: { ...(get().user ?? {}), ...data }, role: data?.role ?? get().role });
        return data;
      },
      uploadMyAvatar: async (file) => {
        const fd = new FormData();
        fd.append("file", file);
        const res = await get().authFetch(`/users/me/avatar`, {
          method: "PUT",
          body: fd,
        });
        if (!res.ok) {
          let msg = "No se pudo actualizar la foto";
          try { const err = await res.json(); msg = err?.detail || msg; } catch (_) {}
          throw new Error(msg);
        }
        const data = await res.json();
        set({ user: { ...(get().user ?? {}), ...data } });
        return data;
      },

      changeMyPassword: async (currentPassword, newPassword) => {
        const res = await get().authFetch(`/users/me/password`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
        });
        if (!res.ok) {
          let msg = "No se pudo cambiar la contraseña";
          try { const err = await res.json(); msg = err?.detail || msg; } catch (_) {}
          throw new Error(msg);
        }
        const data = await res.json();
        return data; // { message: "Contraseña actualizada" }
      },

      // -------- USUARIOS / ROLES --------
      listRoles: async () => {
        const res = await get().authFetch(`/roles`);
        if (!res.ok) {
          let msg = "No se pudieron cargar los roles";
          try { const err = await res.json(); msg = err?.detail || msg; } catch (_) {}
          throw new Error(msg);
        }
        return res.json(); // [{id,name}]
      },

      listUsers: async ({ roleFilter = null, page = 1, limit = 10 } = {}) => {
        const params = new URLSearchParams();
        if (roleFilter) params.set("role_filter", roleFilter);
        if (page) params.set("page", page);
        if (limit) params.set("limit", limit);
        const res = await get().authFetch(`/users?${params.toString()}`);
        if (!res.ok) {
          let msg = "No se pudieron cargar los usuarios";
          try { const err = await res.json(); msg = err?.detail || msg; } catch (_) {}
          throw new Error(msg);
        }
        return res.json(); // { items, page, limit, total }
      },

      assignUserRole: async (email, roleName) => {
        // roleName: "admin" | "empleado" | "employee"
        const roleId = roleName === "admin" ? 1 : 2;
        const res = await get().authFetch(`/roles/assign`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: email, role_id: roleId }),
        });
        if (!res.ok) {
          let msg = "No se pudo asignar el rol";
          try { const err = await res.json(); msg = err?.detail || msg; } catch (_) {}
          throw new Error(msg);
        }
        return res.json(); // { message }
      },

      // ---------- ESTADO CMS (lo que ya tenías) ----------
      contentTypes: [],
      // Tipos de contenido de otros usuarios cacheados por id
      foreignTypes: {},
      entries: [],
      apiKeys: [],

      // ------ CONTENT MODEL ------
      createType: ({ name, apiId }) =>
        set((state) => ({
          contentTypes: [
            {
              id: uuid(),
              name,
              apiId,
              fields: [],
              updatedAt: new Date().toISOString(),
            },
            ...state.contentTypes,
          ],
        })),

      addField: (typeId, field) =>
        set((state) => ({
          contentTypes: state.contentTypes.map((t) =>
            t.id === typeId
              ? {
                  ...t,
                  fields: [...t.fields, field],
                  updatedAt: new Date().toISOString(),
                }
              : t
          ),
        })),

      deleteField: (typeId, fieldId) =>
        set((state) => ({
          contentTypes: state.contentTypes.map((t) =>
            t.id === typeId
              ? {
                  ...t,
                  fields: t.fields.filter((f) => f.id !== fieldId),
                  updatedAt: new Date().toISOString(),
                }
              : t
          ),
        })),

      // BORRAR CONTENT TYPE (y entries asociados)
      deleteType: (typeId) =>
        set((state) => ({
          contentTypes: state.contentTypes.filter((t) => t.id !== typeId),
          entries: (state.entries ?? []).filter((e) => e.typeId !== typeId),
        })),

      // ----------- CONTENT -----------
      createEntry: (typeId) => {
        const ct = get().contentTypes.find((t) => t.id === typeId);
        if (!ct) throw new Error("Content Type no existe");
        // Soporta tipos con esquema remoto (backend: schema[]) y locales (fields[])
        const fieldIds = Array.isArray(ct.fields)
          ? ct.fields.map((f) => f.apiId)
          : Array.isArray(ct.schema)
          ? ct.schema.map((fd) => fd.id)
          : [];
        const values = {};
        fieldIds.forEach((id) => {
          values[id] = null;
        });
        const entry = {
          id: uuid(),
          typeId,
          values,
          status: "draft", // draft | published
          updatedAt: new Date().toISOString(),
          title: "",
        };
        set((state) => ({ entries: [entry, ...(state.entries ?? [])] }));
        return entry.id;
      },

      updateEntryField: (entryId, fieldId, value) =>
        set((state) => ({
          entries: (state.entries ?? []).map((e) =>
            e.id === entryId
              ? {
                  ...e,
                  // Normaliza tanto values como fields para entradas remotas
                  values: { ...(e.values ?? e.fields ?? {}), [fieldId]: value },
                  fields: { ...(e.fields ?? e.values ?? {}), [fieldId]: value },
                  updatedAt: new Date().toISOString(),
                }
              : e
          ),
        })),

      updateEntryTitle: (entryId, title) =>
        set((state) => ({
          entries: (state.entries ?? []).map((e) =>
            e.id === entryId
              ? { ...e, title, updatedAt: new Date().toISOString() }
              : e
          ),
        })),

      setEntryStatus: (entryId, status) =>
        set((state) => ({
          entries: (state.entries ?? []).map((e) =>
            e.id === entryId
              ? { ...e, status, updatedAt: new Date().toISOString() }
              : e
          ),
        })),

      deleteEntry: (entryId) =>
        set((state) => ({
          entries: (state.entries ?? []).filter((e) => e.id !== entryId),
        })),

      // --------------- API KEYS (remoto) ---------------
      // Cargar API keys desde el backend y guardarlas en el store
      loadApiKeys: async () => {
        const res = await get().authFetch(`/api-keys`);
        if (!res.ok) {
          let msg = "No se pudieron cargar las API keys";
          try { const err = await res.json(); msg = err?.detail || msg; } catch (_) {}
          throw new Error(msg);
        }
        const data = await res.json();
        set({ apiKeys: Array.isArray(data) ? data : [] });
        return data;
      },

      // Crear API key en el backend (persistente)
      createApiKeyRemote: async ({ name, description }) => {
        const payload = { name, description };
        const res = await get().authFetch(`/api-keys`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          let msg = "No se pudo crear la API key";
          try { const err = await res.json(); msg = err?.detail || msg; } catch (_) {}
          throw new Error(msg);
        }
        const data = await res.json();
        // data: { id, name, description, token, created_at }
        set((state) => ({ apiKeys: [data, ...(state.apiKeys ?? [])] }));
        return data.id;
      },

      updateApiKey: (id, patch) =>
        set((state) => ({
          apiKeys: (state.apiKeys ?? []).map((k) =>
            k.id === id
              ? { ...k, ...patch, updatedAt: new Date().toISOString() }
              : k
          ),
        })),

      deleteApiKey: (id) =>
        set((state) => ({
          apiKeys: (state.apiKeys ?? []).filter((k) => k.id !== id),
        })),

      // Eliminar API key en el backend
      deleteApiKeyRemote: async (id) => {
        const res = await get().authFetch(`/api-keys/${id}`, { method: "DELETE" });
        if (!res.ok) {
          let msg = "No se pudo eliminar la API key";
          try { const err = await res.json(); msg = err?.detail || msg; } catch (_) {}
          throw new Error(msg);
        }
        // Actualizar estado local
        set((s) => ({ apiKeys: (s.apiKeys ?? []).filter((k) => String(k.id) !== String(id)) }));
        return true;
      },
      // ---------- API-backed methods ----------
      loadContentTypes: async () => {
        // Hidrata inmediatamente desde caché si existe
        try {
          const cached = localStorage.getItem("cms.cache.contentTypes");
          if (cached) {
            const parsed = JSON.parse(cached);
            if (Array.isArray(parsed)) set({ contentTypes: parsed });
          }
        } catch (_) {}
        const res = await get().authFetch("/content_types");
        if (!res.ok) {
          let msg = "No se pudo cargar tipos de contenido";
          try {
            const err = await res.json();
            msg = err?.detail || msg;
          } catch (_) {}
          throw new Error(msg);
        }
        const data = await res.json();
        set({ contentTypes: data });
        // Persistir caché
        try { localStorage.setItem("cms.cache.contentTypes", JSON.stringify(data)); } catch (_) {}
        return data;
      },
      // Obtiene un Content Type por id (puede pertenecer a otro usuario) y lo cachea
      getContentTypeRemote: async (id) => {
        if (!id) return null;
        const already = get().foreignTypes?.[id];
        if (already) return already;
        const res = await get().authFetch(`/content_types/${id}`);
        if (!res.ok) return null;
        const data = await res.json();
        set((s) => ({ foreignTypes: { ...(s.foreignTypes ?? {}), [id]: data } }));
        return data;
      },
      createContentType: async (payload) => {
        const res = await get().authFetch("/content_types", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          let msg = "No se pudo crear el tipo";
          try {
            const err = await res.json();
            msg = err?.detail || msg;
          } catch (_) {}
          throw new Error(msg);
        }
        const data = await res.json();
        set((s) => ({ contentTypes: [...(s.contentTypes ?? []), data] }));
        return data;
      },
      updateContentType: async (id, patch) => {
        const res = await get().authFetch(`/content_types/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patch),
        });
        if (!res.ok) {
          let msg = "No se pudo actualizar el tipo";
          try {
            const err = await res.json();
            msg = err?.detail || msg;
          } catch (_) {}
          throw new Error(msg);
        }
        const data = await res.json();
        set((s) => ({ contentTypes: (s.contentTypes ?? []).map((t) => (t.id === id ? data : t)) }));
        return data;
      },
      deleteContentType: async (id) => {
        const res = await get().authFetch(`/content_types/${id}`, { method: "DELETE" });
        if (!res.ok) {
          let msg = "No se pudo borrar el tipo";
          try {
            const err = await res.json();
            msg = err?.detail || msg;
          } catch (_) {}
          throw new Error(msg);
        }
        set((s) => ({ contentTypes: (s.contentTypes ?? []).filter((t) => t.id !== id) }));
        return true;
      },
      loadEntries: async (contentTypeId) => {
        const qs = contentTypeId ? `?content_type_id=${encodeURIComponent(contentTypeId)}` : "";
        const cacheKey = contentTypeId ? `cms.cache.entries.${contentTypeId}` : "cms.cache.entries.all";
        // Hidrata desde caché si disponible
        try {
          const cached = localStorage.getItem(cacheKey);
          if (cached) {
            const raw = JSON.parse(cached);
            const normalized = Array.isArray(raw)
              ? raw.map((d) => ({ ...d, values: d.fields }))
              : [];
            set({ entries: normalized });
          }
        } catch (_) {}
        const res = await get().authFetch(`/entries${qs}`);
        if (!res.ok) {
          let msg = "No se pudo cargar entradas";
          try {
            const err = await res.json();
            msg = err?.detail || msg;
          } catch (_) {}
          throw new Error(msg);
        }
        const data = await res.json();
        const normalized = Array.isArray(data)
          ? data.map((d) => ({
              ...d,
              values: d.fields,
              updatedAt: d.updated_at ?? d.updatedAt ?? null,
              createdAt: d.created_at ?? d.createdAt ?? null,
              updatedBy: d.updated_by ?? d.updatedBy ?? null,
              createdBy: d.created_by ?? d.createdBy ?? null,
            }))
          : [];
        set({ entries: normalized });
        try { localStorage.setItem(cacheKey, JSON.stringify(data)); } catch (_) {}
        // Cargar nombres de tipos faltantes (de otros usuarios)
        try {
          const ids = Array.from(
            new Set(
              normalized
                .map((d) => d.content_type_id ?? d.typeId)
                .filter(Boolean)
            )
          );
          const ownIds = new Set((get().contentTypes ?? []).map((t) => t.id));
          const cached = get().foreignTypes ?? {};
          const fetchIds = ids.filter((id) => !ownIds.has(id) && !cached[id]);
          await Promise.all(
            fetchIds.map(async (id) => {
              const res2 = await get().authFetch(`/content_types/${id}`);
              if (res2.ok) {
                const ct = await res2.json();
                set((s) => ({ foreignTypes: { ...(s.foreignTypes ?? {}), [id]: ct } }));
              }
            })
          );
        } catch (_) {}
        return data;
      },
      createEntryRemote: async (payload) => {
        const res = await get().authFetch("/entries", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          let msg = "No se pudo crear la entrada";
          try {
            const err = await res.json();
            msg = err?.detail || msg;
          } catch (_) {}
          throw new Error(msg);
        }
        const data = await res.json();
        const normalized = {
          ...data,
          values: data.fields,
          updatedAt: data.updated_at ?? data.updatedAt ?? null,
          createdAt: data.created_at ?? data.createdAt ?? null,
          updatedBy: data.updated_by ?? data.updatedBy ?? null,
          createdBy: data.created_by ?? data.createdBy ?? null,
        };
        set((s) => ({ entries: [normalized, ...(s.entries ?? [])] }));
        return data;
      },
      updateEntryRemote: async (id, patch) => {
        const res = await get().authFetch(`/entries/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patch),
        });
        if (!res.ok) {
          let msg = "No se pudo actualizar la entrada";
          try {
            const err = await res.json();
            msg = err?.detail || msg;
          } catch (_) {}
          throw new Error(msg);
        }
        const data = await res.json();
        const normalized = {
          ...data,
          values: data.fields,
          updatedAt: data.updated_at ?? data.updatedAt ?? null,
          createdAt: data.created_at ?? data.createdAt ?? null,
          updatedBy: data.updated_by ?? data.updatedBy ?? null,
          createdBy: data.created_by ?? data.createdBy ?? null,
        };
        set((s) => ({ entries: (s.entries ?? []).map((e) => (e.id === id ? normalized : e)) }));
        return data;
      },
      publishEntryRemote: async (id) => {
        const res = await get().authFetch(`/entries/${id}/publish`, { method: "POST" });
        if (!res.ok) {
          let msg = "No se pudo publicar la entrada";
          try {
            const err = await res.json();
            msg = err?.detail || msg;
          } catch (_) {}
          throw new Error(msg);
        }
        const data = await res.json();
        const normalized = {
          ...data,
          values: data.fields,
          updatedAt: data.updated_at ?? data.updatedAt ?? null,
          createdAt: data.created_at ?? data.createdAt ?? null,
          updatedBy: data.updated_by ?? data.updatedBy ?? null,
          createdBy: data.created_by ?? data.createdBy ?? null,
        };
        set((s) => ({ entries: (s.entries ?? []).map((e) => (e.id === id ? normalized : e)) }));
        return data;
      },
      deleteEntryRemote: async (id) => {
        const res = await get().authFetch(`/entries/${id}`, { method: "DELETE" });
        if (!res.ok) {
          let msg = "No se pudo eliminar la entrada";
          try {
            const err = await res.json();
            msg = err?.detail || msg;
          } catch (_) {}
          throw new Error(msg);
        }
        set((s) => ({ entries: (s.entries ?? []).filter((e) => e.id !== id) }));
        return true;
      },

      // Añadir campo a un Content Type remoto (actualiza schema en backend)
      addFieldToContentTypeRemote: async (typeId, field) => {
        const t = get().contentTypes.find((x) => x.id === typeId);
        const baseSchema = Array.isArray(t?.schema) ? t.schema : [];
        const newDef = {
          id: field.apiId,
          name: field.name,
          type: field.typeKey,
          required: false,
          localized: false,
          config: field?.config ?? {},
        };
        const patch = { schema: [...baseSchema, newDef] };
        // Reutilizamos updateContentType para persistir y refrescar el estado
        return await get().updateContentType(typeId, patch);
      },
    }),
    {
      name: "cms_dise_state",
      // Persistimos sesión en localStorage para que sobreviva cambios de pestaña/recargas
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        // normaliza arrays
        set((s) => ({
          contentTypes: Array.isArray(s.contentTypes) ? s.contentTypes : [],
          entries: Array.isArray(s.entries) ? s.entries : [],
          apiKeys: Array.isArray(s.apiKeys) ? s.apiKeys : [],
          foreignTypes: s.foreignTypes && typeof s.foreignTypes === "object" ? s.foreignTypes : {},
        }));
      },
    }
  )
);

export default useCMSStore;

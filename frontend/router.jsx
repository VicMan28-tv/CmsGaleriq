import React from "react";
import { createBrowserRouter, redirect } from "react-router-dom";
import App from "./App.jsx";

// Auth
import Login from "./modules/auth/Login.jsx";

// Content Model
import ContentTypesList from "./modules/content-model/ContentTypesList.jsx";
import TypeEditor from "./modules/content-model/TypeEditor.jsx";

// Content
import ContentList from "./modules/content/ContentList.jsx";
import EntryEditor from "./modules/content/EntryEditor.jsx";

// API
import ApiList from "./modules/api/ApiList.jsx";
import ApiKeyDetail from "./modules/api/ApiKeyDetail.jsx";

// THEME
import ThemeSettings from "./modules/theme/ThemeSettings.jsx";
import Profile from "./modules/profile/Profile.jsx";
import UsersList from "./modules/users/UsersList.jsx";
import RolesPermissions from "./modules/roles/RolesPermissions.jsx";

import useCMSStore from "./store/useCMSStore.js";

function protectedLoader() {
  // Primero intentamos con el estado de Zustand
  const { user } = useCMSStore.getState();
  if (user) return null;

  // Fallback síncrono: leer desde sessionStorage y rehidratar rápidamente
  try {
    const raw = sessionStorage.getItem("cms_dise_state");
    if (raw) {
      const persisted = JSON.parse(raw)?.state;
      if (persisted?.user && persisted?.token) {
        useCMSStore.setState({
          token: persisted.token,
          user: persisted.user,
          role: persisted.user?.role ?? null,
          isAuth: true,
        });
        return null;
      }
    }
  } catch (_) {}

  // Si no hay sesión, redirige a login
  throw redirect("/login");
}

const router = createBrowserRouter([
  { path: "/login", element: <Login /> },

  {
    path: "/",
    element: <App />,
    // loader removido para evitar redirecciones prematuras durante HMR/rehidratación
    children: [
      // Content model
      { index: true, element: <ContentTypesList /> },
      { path: "types/:id", element: <TypeEditor /> },

      // Content
      { path: "content", element: <ContentList /> },
      { path: "entries/:entryId", element: <EntryEditor /> },

      // API Keys
      { path: "api", element: <ApiList /> },
      { path: "api/:apiId", element: <ApiKeyDetail /> },

      // THEME
      { path: "theme", element: <ThemeSettings /> },

      // Perfil
      { path: "perfil", element: <Profile /> },

      // Usuarios y Roles
      { path: "usuarios", element: <UsersList /> },
      { path: "roles", element: <RolesPermissions /> },
    ],
  },
]);

export default router;

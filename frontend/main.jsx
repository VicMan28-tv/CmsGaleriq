import React, { Suspense } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import router from "./router.jsx";
import "./index.css"; // si no existe, quítalo o crea el archivo

const rootEl = document.getElementById("root");

// Mantener la sesión entre recargas; no limpiar almacenamiento al iniciar.

createRoot(rootEl).render(
  <React.StrictMode>
    <Suspense fallback={<div style={{ padding: 24 }}>Cargando…</div>}>
      <RouterProvider router={router} />
    </Suspense>
  </React.StrictMode>
);

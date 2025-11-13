import React, { useEffect, useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import useCMSStore from "../store/useCMSStore.js";

export default function Shell() {
  const navigate = useNavigate();
  const { user, logout, hydrate } = useCMSStore();

  // Asegura rehidratación del estado de auth al montar Shell
  useEffect(() => {
    try { hydrate(); } catch (_) {}
  }, [hydrate]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const tabClass = ({ isActive }) =>
    [
      // base
      "px-3 py-1 rounded-md text-sm font-medium",
      // animación (clases definidas en animations.css)
      "hover-raise anim-in shadow-glow",
      // estado
      isActive
        ? "bg-purple-200 text-purple-800"
        : "bg-purple-100/70 text-purple-800 hover:bg-purple-200",
    ].join(" ");

  return (
    <div className="min-h-screen flex flex-col bg-[#faf5ff] text-gray-800">
      {/* NAVBAR */}
      <header className="relative border-b border-gray-200 bg-white">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          {/* Logo + menú lateral izquierdo */}
          <BrandWithMenu />

          {/* Navegación centrada */}
          <nav className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
            <NavLink to="/" className={tabClass} end>
              Content Model
            </NavLink>

            <NavLink to="/content" className={tabClass}>
              Content
            </NavLink>

            <NavLink to="/api" className={tabClass}>
              API Keys
            </NavLink>

            <NavLink to="/theme" className={tabClass}>
              Theme
            </NavLink>
          </nav>

          {/* Usuario (derecha) */}
          <div className="flex items-center gap-3">
            {user && (
              <span className="text-sm text-gray-600">{user.email}</span>
            )}
            <button
              onClick={handleLogout}
              className="px-3 py-1 text-sm text-white bg-purple-600 rounded hover:bg-purple-700 hover-raise anim-in shadow-glow"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* CONTENIDO */}
      <main className="flex-1">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <Outlet />
        </div>
      </main>

      {/* FOOTER */}
      <footer className="text-center py-3 text-sm text-gray-500 border-t border-gray-200">
        © 2025 cms_galeriq
      </footer>
    </div>
  );
}

function BrandWithMenu() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const openMenu = () => setOpen(true);
  const toggleMenu = () => setOpen((o) => !o);
  const closeMenu = () => setOpen(false);

  return (
    <div className="relative">
      <button
        className="flex items-center gap-2 text-lg font-semibold text-purple-600 hover-raise anim-in"
        onClick={toggleMenu}
        onMouseEnter={openMenu}
      >
        💜 CMS GALERIQ
      </button>

      {open && (
        <>
          {/* Overlay para cerrar al hacer clic fuera */}
          <div
            className="fixed inset-0 z-40 anim-overlay"
            onClick={closeMenu}
            aria-hidden
          />

          {/* Panel lateral izquierdo (alto completo) */}
          <div
            className="fixed left-0 top-0 z-50 h-full w-[30rem] sm:w-[26rem] md:w-[28rem] lg:w-[30rem] sidebar-gradient text-white slide-in-left-soft shadow-glow"
            onMouseLeave={closeMenu}
          >
            <div className="px-6 py-5 text-2xl font-bold">MENÚ</div>
            <nav className="mt-2">
              <button
                className="block w-full text-left px-6 py-4 text-lg font-medium hover:bg-white/10 transition-base"
                onClick={() => {
                  navigate("/perfil");
                  closeMenu();
                }}
              >
                Perfil
              </button>
              <button
                className="block w-full text-left px-6 py-4 text-lg font-medium hover:bg-white/10 transition-base"
                onClick={() => {
                  navigate("/usuarios");
                  closeMenu();
                }}
              >
                Usuarios
              </button>
              <button
                className="block w-full text-left px-6 py-4 text-lg font-medium hover:bg-white/10 transition-base"
                onClick={() => {
                  navigate("/roles");
                  closeMenu();
                }}
              >
                Roles y permisos
              </button>
            </nav>
          </div>
        </>
      )}
    </div>
  );
}

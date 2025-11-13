import React from "react";
import { Outlet } from "react-router-dom";
import Shell from "./layouts/Shell.jsx";

export default function App() {
  return (
    <Shell>
      <Outlet />
    </Shell>
  );
}

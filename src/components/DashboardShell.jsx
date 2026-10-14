import { signOut } from "firebase/auth";
import { LogOut } from "lucide-react";

import { auth } from "../firebase";
import { useAuth } from "../auth/useAuth.jsx";
import { DashboardLayout } from "../components/Sidebar";
import { menuPorRol } from "../config/menuPorRol";

const footerItems = [
  { label: "Cerrar sesión", icon: LogOut, onClick: () => signOut(auth) },
];

// Se monta dentro de RutaProtegida, así que `rol` ya viene validado.
export default function DashboardShell() {
  const { rol } = useAuth();

  return (
    <DashboardLayout
      items={menuPorRol[rol] ?? []}
      footerItems={footerItems}
      brand={{ name: "Menú" }}
    />
  );
}
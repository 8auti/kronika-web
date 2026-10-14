import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./useAuth.jsx";

export default function RutaProtegida({ rolesPermitidos }) {
  const { usuario, rol, cargando } = useAuth();

  // Esperar a que Firebase determine el estado de autenticación
  if (cargando) {
    return (
      <div className="p-6">
        Cargando...
      </div>
    );
  }

  // Si no hay usuario autenticado, enviarlo al login
  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  // Si el rol no está autorizado, impedir el acceso
  if (
    rolesPermitidos &&
    !rolesPermitidos.includes(rol)
  ) {
    return <Navigate to="/sin-acceso" replace />;
  }

  // Renderizar las rutas hijas autorizadas
  return <Outlet />;
}
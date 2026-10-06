import { Navigate } from "react-router-dom";
import { useAuth } from "./useAuth.jsx";

export default function RutaProtegida({
  children,
  rolesPermitidos,
}) {
  const { usuario, rol, cargando } = useAuth();

  if (cargando) {
    return (
      <div className="p-6">
        Cargando...
      </div>
    );
  }

  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  if (
    rolesPermitidos &&
    !rolesPermitidos.includes(rol)
  ) {
    return <Navigate to="/sin-acceso" replace />;
  }

  return children;
}
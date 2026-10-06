import { Link } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
 
const opcionesPorRol = {
  admin: [
    { nombre: "Usuarios", ruta: "/usuarios" },
    { nombre: "Instituciones", ruta: "/instituciones" },
    { nombre: "Métricas", ruta: "/metricas" },
  ],
 
  editor: [
    { nombre: "Cursos", ruta: "/cursos" },
    { nombre: "Lecciones", ruta: "/lecciones" },
    { nombre: "Coleccionables", ruta: "/coleccionables" },
  ],
 
  profesor: [
    { nombre: "Cursos", ruta: "/cursos" },
    { nombre: "Lecciones", ruta: "/lecciones" },
    { nombre: "Reportes de desempeño", ruta: "/reportes" },
    { nombre: "Progreso de alumnos", ruta: "/progreso" },
    { nombre: "Comunicación", ruta: "/comunicacion" },
  ],
};
 
function Navbar({ rol }) {
  const opciones = opcionesPorRol[rol] || [];
 
  return (
    <nav className="border-b border-gray-200 bg-white shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
 
        {/* Logo */}
        <Link
          to="/landing"
          className="text-2xl font-bold text-indigo-600"
        >
          Kronika
        </Link>
 
        {/* Navegación */}
        <div className="flex items-center gap-6">
 
          {opciones.map((opcion) => (
            <Link
              key={opcion.ruta}
              to={opcion.ruta}
              className="font-medium text-gray-700 transition hover:text-indigo-600"
            >
              {opcion.nombre}
            </Link>
          ))}
 
          {rol ? (
            <>
              {/* Rol */}
              <span className="rounded-full bg-indigo-100 px-3 py-1 text-sm font-medium capitalize text-indigo-700">
                {rol}
              </span>
 
              {/* Cerrar sesión */}
              <button
                type="button"
                onClick={() => signOut(auth)}
                className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-700"
              >
                Cerrar sesión
              </button>
            </>
          ) : (
            /* Sin sesión */
            <Link
              to="/login"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700"
            >
              Iniciar sesión
            </Link>
          )}
 
        </div>
      </div>
    </nav>
  );
}
 
export default Navbar;
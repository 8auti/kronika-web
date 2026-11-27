import { GraduationCap, User } from "lucide-react";
import { Link } from "react-router-dom";

import { ROL_PROFESOR, ROL_USUARIO } from "../services/usuariosService";

const OPCIONES = [
  {
    rol: ROL_PROFESOR,
    titulo: "Soy profesor",
    descripcion: "Creá aulas, armá cursos y seguí el progreso de tus alumnos.",
    icono: GraduationCap,
  },
  {
    rol: ROL_USUARIO,
    titulo: "Soy alumno u otro",
    descripcion: "Accedé a los cursos y aprendé a tu ritmo.",
    icono: User,
  },
];

/**
 * Primer paso del registro: el usuario elige si se registra como profesor
 * o como "alumno u otro". Devuelve el rol elegido con onElegir(rol).
 */
export default function SelectorTipoCuenta({ onElegir }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100 px-4 py-8">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-md">
        <h1 className="mb-2 text-2xl font-bold text-gray-900">Crear cuenta</h1>

        <p className="mb-6 text-sm text-gray-600">
          Primero contanos cómo vas a usar Kronika.
        </p>

        <div className="flex flex-col gap-3">
          {OPCIONES.map(({ rol, titulo, descripcion, icono: Icono }) => (
            <button
              key={rol}
              type="button"
              onClick={() => onElegir(rol)}
              className="flex items-center gap-4 rounded-lg border border-gray-300 p-4 text-left transition hover:border-indigo-500 hover:bg-indigo-50 focus:border-indigo-500 focus:outline-none"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                <Icono className="h-6 w-6" aria-hidden="true" />
              </span>

              <span>
                <span className="block font-semibold text-gray-900">
                  {titulo}
                </span>

                <span className="block text-sm text-gray-600">
                  {descripcion}
                </span>
              </span>
            </button>
          ))}
        </div>

        <p className="mt-6 text-center text-sm text-gray-600">
          ¿Ya tenés cuenta?{" "}
          <Link
            to="/login"
            className="font-medium text-indigo-600 hover:text-indigo-700 hover:underline"
          >
            Iniciar sesión
          </Link>
        </p>
      </div>
    </main>
  );
}

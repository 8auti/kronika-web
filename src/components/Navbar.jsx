import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";

const opcionesPorRol = {
  admin: [
    { nombre: "Usuarios", ruta: "/usuarios" },
    { nombre: "Métricas", ruta: "/metricas" },
  ],
  editor: [
    { nombre: "Cursos", ruta: "/cursos" },
    { nombre: "Coleccionables", ruta: "/coleccionables" },
  ],
  // La institución no tiene acceso al panel de cursos
  institucion: [{ nombre: "Organización", ruta: "/organizacion" }],
  profesor: [
    { nombre: "Aulas", ruta: "/aulas" },
    { nombre: "Reportes de desempeño", ruta: "/reportes" },
    { nombre: "Progreso de alumnos", ruta: "/progreso" },
    { nombre: "Comunicación", ruta: "/comunicacion" },
  ],
};

/*
  Color de la pestaña. Se usa en el rectángulo y en las dos "colas".
  - Si quieres que parezca una abertura hacia el contenido, ponle el
    mismo color que el fondo de tu página.
  - Si es igual al fondo del navbar (blanco), la forma no se va a ver.
*/
const COLOR_TAB = "#f3f4f6"; // gray-100

function Navbar({ rol }) {
  const opciones = opcionesPorRol[rol] || [];
  const { pathname } = useLocation();

  const contenedorRef = useRef(null);
  const itemsRef = useRef({});
  const [indicador, setIndicador] = useState({ left: 0, width: 0, visible: false });

  // Ruta activa (si hay una que coincida con la URL actual)
  const rutaActiva = opciones.find((o) => pathname.startsWith(o.ruta))?.ruta;

  const moverA = (ruta) => {
    const el = itemsRef.current[ruta];
    if (!el) {
      setIndicador((prev) => ({ ...prev, visible: false }));
      return;
    }
    setIndicador({ left: el.offsetLeft, width: el.offsetWidth, visible: true });
  };

  // Al cambiar de ruta o rol, el indicador descansa sobre la opción activa
  useEffect(() => {
    moverA(rutaActiva);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rutaActiva, rol]);

  return (
    <nav className="border-b border-gray-200 bg-white shadow-sm">
      <div className="mx-auto flex max-w-7xl items-stretch justify-between px-6">
        {/* Logo */}
        <Link to="/landing" className="flex items-center py-4 text-2xl font-bold">
          <h2 className="text-naranja">Kronika</h2>
        </Link>

        <div className="flex items-stretch gap-6">
          {/* Opciones con indicador deslizante */}
          <div
            ref={contenedorRef}
            className="relative flex items-stretch gap-4"
            onMouseLeave={() => moverA(rutaActiva)}
          >
            {/* Indicador: rectángulo con esquinas superiores redondeadas
                y una onda (ear) cóncava a la izquierda */}
            <span
              aria-hidden="true"
              style={{
                left: indicador.left,
                width: indicador.width,
                "--tab": COLOR_TAB,
              }}
              className={`
                pointer-events-none absolute -bottom-px top-2 z-0
                rounded-t-2xl bg-[var(--tab)]
                transition-[left,width,opacity] duration-300 ease-out
                motion-reduce:transition-none

                before:absolute before:-left-5 before:bottom-0 before:h-5 before:w-5
                before:content-['']
                before:bg-[radial-gradient(circle_at_top_left,transparent_1.25rem,var(--tab)_1.25rem)]

                after:absolute after:-right-5 after:bottom-0 after:h-5 after:w-5
                after:content-['']
                after:bg-[radial-gradient(circle_at_top_right,transparent_1.25rem,var(--tab)_1.25rem)]

                ${indicador.visible ? "opacity-100" : "opacity-0"}
              `}
            />

            {opciones.map((opcion) => (
              <Link
                key={opcion.ruta}
                to={opcion.ruta}
                ref={(el) => (itemsRef.current[opcion.ruta] = el)}
                onMouseEnter={() => moverA(opcion.ruta)}
                onFocus={() => moverA(opcion.ruta)}
                onBlur={() => moverA(rutaActiva)}
                className="relative z-10 flex items-center px-4 font-medium text-gray-700 transition-colors hover:text-indigo-600"
              >
                {opcion.nombre}
              </Link>
            ))}
          </div>

          {/* Zona derecha */}
          <div className="flex items-center gap-4 py-4">
            {rol ? (
              <>
                <span className="rounded-full bg-indigo-100 px-3 py-1 text-sm font-medium capitalize text-indigo-700">
                  {rol}
                </span>
                <button
                  type="button"
                  onClick={() => signOut(auth)}
                  className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-700"
                >
                  Cerrar sesión
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700"
              >
                Iniciar sesión
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
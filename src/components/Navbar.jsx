import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";

import { menuPorRol } from "../config/menuPorRol";

// El menú completo vive en el sidebar; el navbar solo da acceso al dashboard
const opcionesPorRol = Object.fromEntries(
  Object.entries(menuPorRol).map(([rol, items]) => [
    rol,
    [{ nombre: "Dashboard", ruta: items[0].to, prefijos: items.map((i) => i.to) }],
  ]),
);

/*
  Color de la pestaña. Se usa en el rectángulo y en las dos "colas".
  Solo se muestra en desktop (md en adelante).
*/
const COLOR_TAB = "#f3f4f6"; // gray-100

function Navbar({ rol }) {
  const opciones = opcionesPorRol[rol] || [];
  const { pathname } = useLocation();

  const itemsRef = useRef({});
  const [indicador, setIndicador] = useState({ left: 0, width: 0, visible: false });
  const [menuAbierto, setMenuAbierto] = useState(false);

  // Ruta activa (si hay una que coincida con la URL actual)
  const rutaActiva = opciones.find((o) => pathname.startsWith(o.ruta))?.ruta;

  const moverA = (ruta) => {
    const el = itemsRef.current[ruta];
    // En mobile el contenedor está oculto y offsetWidth es 0
    if (!el || el.offsetWidth === 0) {
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

  // Recalcular el indicador si cambia el tamaño de pantalla (ej. rotar el celular)
  useEffect(() => {
    const onResize = () => {
      moverA(rutaActiva);
      if (window.innerWidth >= 768) setMenuAbierto(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rutaActiva]);

  // Cerrar el menú móvil al navegar
  useEffect(() => {
    setMenuAbierto(false);
  }, [pathname]);

  // Cerrar con la tecla Escape
  useEffect(() => {
    if (!menuAbierto) return;
    const onKey = (e) => e.key === "Escape" && setMenuAbierto(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuAbierto]);

  const cerrarSesion = () => {
    setMenuAbierto(false);
    signOut(auth);
  };

  return (
    <nav className="relative border-b border-gray-200 bg-white shadow-sm">
      <div className="mx-auto flex max-w-7xl items-stretch justify-between px-4 sm:px-6">
        {/* Logo */}
        <Link to="/landing" className="flex items-center py-4 text-2xl font-bold">
          <h2 className="text-naranja">Kronika</h2>
        </Link>

        {/* ───────── Desktop (md+) ───────── */}
        <div className="hidden items-stretch gap-6 md:flex">
          {/* Opciones con indicador deslizante */}
          <div
            className="relative flex items-stretch gap-4"
            onMouseLeave={() => moverA(rutaActiva)}
          >
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
                className="relative z-10 flex items-center px-4 font-medium text-gray-700 transition-colors hover:text-blue-600"
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
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
              >
                Iniciar sesión
              </Link>
            )}
          </div>
        </div>

        {/* ───────── Botón hamburguesa (solo mobile) ───────── */}
        <div className="flex items-center md:hidden">
          <button
            type="button"
            onClick={() => setMenuAbierto((v) => !v)}
            aria-expanded={menuAbierto}
            aria-controls="menu-movil"
            aria-label={menuAbierto ? "Cerrar menú" : "Abrir menú"}
            className="-mr-2 flex h-10 w-10 items-center justify-center rounded-lg text-gray-700 transition hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-600"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              {menuAbierto ? (
                <path d="M6 6l12 12M18 6L6 18" />
              ) : (
                <path d="M4 7h16M4 12h16M4 17h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* ───────── Panel móvil ───────── */}
      <div
        id="menu-movil"
        className={`
          absolute inset-x-0 top-full z-40 grid border-gray-200 bg-white shadow-lg md:hidden
          transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none
          ${menuAbierto ? "grid-rows-[1fr] border-b" : "grid-rows-[0fr]"}
        `}
      >
        <div className={`overflow-hidden ${menuAbierto ? "visible" : "invisible"}`}>
          <div className="flex flex-col gap-1 px-4 py-3 sm:px-6">
            {opciones.map((opcion) => {
              const activa = opcion.ruta === rutaActiva;
              return (
                <Link
                  key={opcion.ruta}
                  to={opcion.ruta}
                  aria-current={activa ? "page" : undefined}
                  className={`rounded-lg px-3 py-3 font-medium transition-colors ${
                    activa
                      ? "bg-gray-100 text-indigo-700"
                      : "text-gray-700 hover:bg-gray-50 hover:text-indigo-600"
                  }`}
                >
                  {opcion.nombre}
                </Link>
              );
            })}

            <div
              className={`flex items-center justify-between gap-3 pt-3 ${
                opciones.length ? "mt-2 border-t border-gray-200" : ""
              }`}
            >
              {rol ? (
                <>
                  <span className="rounded-full bg-indigo-100 px-3 py-1 text-sm font-medium capitalize text-indigo-700">
                    {rol}
                  </span>
                  <button
                    type="button"
                    onClick={cerrarSesion}
                    className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-700"
                  >
                    Cerrar sesión
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-center text-sm font-medium text-white transition hover:bg-indigo-700"
                >
                  Iniciar sesión
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
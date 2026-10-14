import { useLayoutEffect, useRef, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { ChevronLeft, ChevronRight, Layers } from "lucide-react";

const cx = (...clases) => clases.filter(Boolean).join(" ");

// Ancho del sidebar colapsado (px)
const ANCHO_CERRADO = 72;

const ITEM =
  "flex h-10 w-full items-center rounded-xl pl-2 text-sm font-semibold outline-none " +
  "transition-colors motion-reduce:transition-none " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600";

const ACTIVO = "bg-blue-600 text-white";
const INACTIVO = "text-slate-600 hover:bg-blue-50 hover:text-blue-600";

/**
 * items:       [{ to, label, icon, end?, onClick? }]  menú principal
 * footerItems: igual que items, debajo de un divisor (ej. "Cerrar sesión")
 *   - con `to`      -> navega (NavLink, se marca activo solo)
 *   - con `onClick` -> botón
 * brand: { name: string, logo?: ReactNode }
 *
 * Abierto, el ancho se ajusta solo al texto más largo del menú.
 */
export default function Sidebar({
  items = [],
  footerItems = [],
  brand = { name: "Brand" },
  defaultOpen = false,
  className,
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [anchoAbierto, setAnchoAbierto] = useState(200);
  const medidor = useRef(null);

  // Mide un duplicado invisible del menú para saber cuánto ocupa el texto más largo
  const todos = [...items, ...footerItems];
  const clave = brand.name + "|" + todos.map((i) => i.label).join("|");
  useLayoutEffect(() => {
    const medir = () => {
      if (medidor.current) {
        // + 16 del padding del aside + 2 de margen contra redondeos
        setAnchoAbierto(Math.ceil(medidor.current.getBoundingClientRect().width) + 18);
      }
    };
    medir();
    document.fonts?.ready.then(medir); // recalcula cuando carga la tipografía
  }, [clave]);

  // En pantallas chicas el menú abierto tapa el contenido: se cierra al navegar
  const cerrarEnMovil = () => {
    if (window.matchMedia("(max-width: 767px)").matches) setOpen(false);
  };

  const fundido = cx(
    "transition-opacity duration-200 motion-reduce:transition-none",
    open ? "opacity-100 delay-100" : "opacity-0",
  );

  const renderItem = ({ to, label, icon: Icon, end, onClick }) => {
    const contenido = (
      <>
        <span className="grid w-10 shrink-0 place-items-center">
          {Icon && <Icon className="size-5" aria-hidden="true" />}
        </span>
        <span className={cx("whitespace-nowrap pr-3", fundido)}>{label}</span>
      </>
    );

    return (
      <li key={to ?? label}>
        {to ? (
          <NavLink
            to={to}
            end={end}
            title={open ? undefined : label}
            onClick={cerrarEnMovil}
            className={({ isActive }) => cx(ITEM, isActive ? ACTIVO : INACTIVO)}
          >
            {contenido}
          </NavLink>
        ) : (
          <button
            type="button"
            title={open ? undefined : label}
            onClick={() => {
              cerrarEnMovil();
              onClick?.();
            }}
            className={cx(ITEM, INACTIVO)}
          >
            {contenido}
          </button>
        )}
      </li>
    );
  };

  return (
    <div
      style={{ "--ancho-abierto": `${anchoAbierto + 16}px` }}
      className={cx(
        "relative shrink-0 p-2 transition-[width] duration-300 motion-reduce:transition-none",
        open ? "w-[5.5rem] md:w-[var(--ancho-abierto)]" : "w-[5.5rem]",
        className,
      )}
    >
      {/* Duplicado invisible, solo para medir el ancho */}
      <div
        ref={medidor}
        aria-hidden="true"
        className="pointer-events-none invisible absolute left-0 top-0 flex h-0 w-max flex-col overflow-hidden"
      >
        <div className="flex">
          <span className="w-7" />
          <span className="whitespace-nowrap px-2 text-base font-bold">{brand.name}</span>
          <span className="w-7" />
        </div>
        {todos.map((item) => (
          <div key={item.to ?? item.label} className="flex pl-2">
            <span className="w-10" />
            <span className="whitespace-nowrap pr-3 text-sm font-semibold">{item.label}</span>
          </div>
        ))}
      </div>

      <aside
        style={{ width: open ? anchoAbierto : ANCHO_CERRADO }}
        className={cx(
          "sticky top-2 z-40 flex h-[calc(100svh-var(--navbar-h,4.5rem)-1rem)] flex-col overflow-hidden rounded-2xl p-2",
          "bg-white text-slate-700 shadow-lg shadow-slate-900/10 ring-1 ring-black/5",
          "transition-[width] duration-300 motion-reduce:transition-none",
        )}
      >
        {/* Cabecera: ícono + nombre + flecha para abrir/cerrar */}
        <div className="flex h-12 shrink-0 items-center">
          <span className="grid size-7 shrink-0 place-items-center text-blue-600">
            {brand.logo ?? <Layers className="size-6" aria-hidden="true" />}
          </span>

          <span className="min-w-0 flex-1 overflow-hidden">
            <span
              className={cx(
                "block whitespace-nowrap px-2 text-base font-bold text-slate-700",
                fundido,
              )}
            >
              {brand.name}
            </span>
          </span>

          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-label={open ? "Cerrar menú" : "Abrir menú"}
            className="grid size-7 shrink-0 place-items-center rounded-lg text-slate-500 outline-none transition-colors hover:bg-blue-50 hover:text-blue-600 focus-visible:outline-2 focus-visible:outline-blue-600 motion-reduce:transition-none"
          >
            {open ? <ChevronLeft className="size-5" /> : <ChevronRight className="size-5" />}
          </button>
        </div>

        {/* Navegación principal */}
        <nav
          aria-label="Principal"
          className="flex-1 overflow-y-auto overflow-x-hidden py-2 [scrollbar-width:none]"
        >
          <ul className="flex flex-col gap-1">{items.map(renderItem)}</ul>
        </nav>

        {/* Pie: separado por un divisor (ej. cerrar sesión) */}
        {footerItems.length > 0 && (
          <div className="shrink-0 border-t border-slate-200 pt-2">
            <ul className="flex flex-col gap-1">{footerItems.map(renderItem)}</ul>
          </div>
        )}
      </aside>
    </div>
  );
}

/**
 * Layout listo para usar como ruta padre: sidebar + contenido (<Outlet />).
 * Le pasás los ítems según el rol.
 */
export function DashboardLayout({ items, footerItems, brand }) {
  return (
    <div className="flex min-h-[calc(100svh-var(--navbar-h,4.5rem))] bg-gray-100">
      <Sidebar items={items} footerItems={footerItems} brand={brand} />
      <main className="min-w-0 flex-1 py-3 pl-1 pr-3 md:py-5 md:pr-5">
        <Outlet />
      </main>
    </div>
  );
}
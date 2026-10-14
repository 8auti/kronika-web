
import { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  Menu,
  X,
  LogOut,
  ChevronLeft,
} from "lucide-react";

export default function Sidebar({
  title = "Panel de Control",
  logo = null,
  items = [],
  footerItems = [],
  onLogout,
  defaultCollapsed = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  const linkClass = ({ isActive }) =>
    [
      "group flex items-center gap-3 rounded-xl px-3 py-2.5",
      "text-sm font-medium transition-colors duration-200",
      "focus-visible:outline-none focus-visible:ring-2",
      "focus-visible:ring-gray-400",
      isActive
        ? "bg-gray-100 text-gray-950"
        : "text-gray-600 hover:bg-gray-100 hover:text-gray-950",
      isCollapsed ? "justify-center" : "",
    ].join(" ");

  const renderItems = (menuItems) =>
    menuItems.map((item) => {
      const Icon = item.icon;

      return (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          title={isCollapsed ? item.label : undefined}
          onClick={() => setIsOpen(false)}
          className={linkClass}
        >
          {Icon && (
            <Icon
              size={20}
              strokeWidth={1.8}
              className="shrink-0"
            />
          )}

          {!isCollapsed && (
            <span className="truncate">{item.label}</span>
          )}

          {item.badge != null && !isCollapsed && (
            <span className="ml-auto rounded-full bg-gray-200 px-2 py-0.5 text-xs text-gray-700">
              {item.badge}
            </span>
          )}
        </NavLink>
      );
    });

  return (
    <>
      {/* Botón móvil */}
      <button
        type="button"
        aria-label={isOpen ? "Cerrar menú" : "Abrir menú"}
        aria-expanded={isOpen}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed left-4 top-4 z-50 rounded-lg border border-gray-200 bg-white p-2 text-gray-700 shadow-sm hover:bg-gray-100 md:hidden"
      >
        {isOpen ? <X size={22} /> : <Menu size={22} />}
      </button>

      {/* Fondo oscuro en móvil */}
      {isOpen && (
        <button
          type="button"
          aria-label="Cerrar menú"
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-40 bg-black/30 md:hidden"
        />
      )}

      <aside
        className={[
          "fixed inset-y-0 left-0 z-40 flex h-dvh flex-col",
          "border-r border-gray-200 bg-white",
          "transition-[width,transform] duration-200 ease-in-out",
          isCollapsed ? "w-[76px]" : "w-64",
          isOpen
            ? "translate-x-0"
            : "-translate-x-full md:translate-x-0",
        ].join(" ")}
      >
        {/* Encabezado */}
        <div className="flex h-20 shrink-0 items-center gap-3 border-b border-gray-100 px-4">
          {logo && (
            <img
              src={logo}
              alt=""
              className="h-9 w-9 shrink-0 rounded-lg object-contain"
            />
          )}

          {!isCollapsed && (
            <span className="truncate text-base font-semibold tracking-tight text-gray-900">
              {title}
            </span>
          )}

          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            aria-label={
              isCollapsed
                ? "Expandir sidebar"
                : "Contraer sidebar"
            }
            className="ml-auto hidden rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 md:block"
          >
            <ChevronLeft
              size={18}
              className={
                isCollapsed ? "rotate-180 transition-transform" : ""
              }
            />
          </button>
        </div>

        {/* Navegación principal */}
        <nav
          aria-label="Navegación principal"
          className="flex-1 space-y-1 overflow-y-auto p-3"
        >
          {renderItems(items)}
        </nav>

        {/* Navegación inferior */}
        <div className="shrink-0 space-y-1 border-t border-gray-100 p-3">
          {renderItems(footerItems)}

          {onLogout && (
            <button
              type="button"
              title={isCollapsed ? "Cerrar sesión" : undefined}
              onClick={onLogout}
              className={[
                "flex w-full items-center gap-3 rounded-xl px-3 py-2.5",
                "text-sm font-medium text-gray-600",
                "transition-colors hover:bg-gray-100 hover:text-gray-950",
                isCollapsed ? "justify-center" : "",
              ].join(" ")}
            >
              <LogOut size={20} className="shrink-0" />
              {!isCollapsed && <span>Cerrar sesión</span>}
            </button>
          )}
        </div>
      </aside>
    </>
  );
}

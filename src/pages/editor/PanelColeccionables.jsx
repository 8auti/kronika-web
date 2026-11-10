import { useEffect, useState } from "react";

import {
  RAREZAS,
  actualizarColeccionable,
  crearColeccionable,
  eliminarColeccionable,
  etiquetaRareza,
  getColeccionables,
  getJefesDisponibles,
  validarColeccionable,
} from "../../services/coleccionablesService";
import SelectorImagen from "../../components/SelectorImagen";
import { CARPETAS } from "../../services/imagenesService";

const inputClase =
  "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500";
const btnPrimario =
  "rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-50";
const btnSecundario =
  "rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50";
const btnPeligro =
  "rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50";
const btnEditar =
  "rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50";

const FORMULARIO_VACIO = {
  nombre: "",
  descripcion: "",
  imagen_url: "",
  rareza: "comun",
  activa: true,
  nodo_id: "",
};

export default function PanelColeccionables() {
  const [items, setItems] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [subiendoImagen, setSubiendoImagen] = useState(false);
  const [error, setError] = useState("");
  const [jefes, setJefes] = useState([]);

  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [formulario, setFormulario] = useState(FORMULARIO_VACIO);

  const cargar = async () => {
    try {
      setCargando(true);
      setItems(await getColeccionables());
    } catch (e) {
      console.error(e);
      setError("No se pudieron cargar los coleccionables.");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
    getJefesDisponibles().then(setJefes).catch(console.error);
  }, []);

  const cambiar = (campo) => (e) =>
    setFormulario((f) => ({ ...f, [campo]: e.target.value }));

  const abrirNuevo = () => {
    setEditandoId(null);
    setFormulario(FORMULARIO_VACIO);
    setMostrarFormulario(true);
  };

  const abrirEdicion = (item) => {
    setEditandoId(item.id);
    setFormulario({
      nombre: item.nombre ?? "",
      descripcion: item.descripcion ?? "",
      imagen_url: item.imagen_url ?? "",
      rareza: item.rareza ?? "comun",
      activa: item.activa ?? true,
      nodo_id: item.condicion?.nodo_id ?? "",
    });
    setMostrarFormulario(true);
  };

  const cerrarFormulario = () => {
    setMostrarFormulario(false);
    setEditandoId(null);
    setFormulario(FORMULARIO_VACIO);
  };

  const guardar = async (e) => {
    e.preventDefault();
    setError("");

    const problema = validarColeccionable(formulario);
    if (problema) {
      setError(problema);
      return;
    }

    try {
      setGuardando(true);
      if (editandoId) await actualizarColeccionable(editandoId, formulario);
      else await crearColeccionable(formulario);
      cerrarFormulario();
      await cargar();
    } catch (e) {
      console.error(e);
      setError("No se pudo guardar el coleccionable.");
    } finally {
      setGuardando(false);
    }
  };

  const eliminar = async (item) => {
    if (!window.confirm(`¿Eliminar "${item.nombre}"?`)) return;
    try {
      setError("");
      await eliminarColeccionable(item.id);
      await cargar();
    } catch (e) {
      console.error(e);
      setError("No se pudo eliminar el coleccionable.");
    }
  };

  return (
    <main className="mx-auto max-w-7xl p-6">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-3xl font-bold truncate">Coleccionables</h1>
        {!mostrarFormulario && (
          <button type="button" onClick={abrirNuevo} className={`${btnPrimario} shrink-0`}>
            + Nuevo coleccionable
          </button>
        )}
      </div>

      {error && <p className="mb-4 text-red-600">{error}</p>}

      {mostrarFormulario && (
        <form
          onSubmit={guardar}
          className="mb-6 space-y-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
        >
          <h2 className="text-lg font-semibold">
            {editandoId ? "Editar coleccionable" : "Nuevo coleccionable"}
          </h2>

          <label className="block text-sm font-medium text-gray-700">
            Nombre
            <input
              value={formulario.nombre}
              onChange={cambiar("nombre")}
              className={`${inputClase} mt-1`}
            />
          </label>

          <label className="block text-sm font-medium text-gray-700">
            Descripción
            <textarea
              rows={3}
              value={formulario.descripcion}
              onChange={cambiar("descripcion")}
              className={`${inputClase} mt-1`}
            />
          </label>

          <label className="block text-sm font-medium text-gray-700">
            Rareza
            <select
              value={formulario.rareza}
              onChange={cambiar("rareza")}
              className={`${inputClase} mt-1`}
            >
              {RAREZAS.map((r) => (
                <option key={r.valor} value={r.valor}>
                  {r.etiqueta}
                </option>
              ))}
            </select>
          </label>

          <div className="text-sm font-medium text-gray-700">
            <span className="mb-1 block">Imagen</span>
            <SelectorImagen
              value={formulario.imagen_url}
              carpeta={CARPETAS.COLECCIONABLE}
              onChange={(url) =>
                setFormulario((f) => ({ ...f, imagen_url: url }))
              }
              onSubiendo={setSubiendoImagen}
            />
          </div>

          <label className="block text-sm font-medium text-gray-700">
            Se obtiene al vencer al jefe
            <select
              value={formulario.nodo_id}
              onChange={cambiar("nodo_id")}
              className={`${inputClase} mt-1`}
            >
              <option value="">Sin condición</option>
              {formulario.nodo_id &&
                !jefes.some((j) => j.id === formulario.nodo_id) && (
                  <option value={formulario.nodo_id}>
                    Jefe actual ({formulario.nodo_id})
                  </option>
                )}
              {jefes.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.etiqueta}
                </option>
              ))}
            </select>
          </label>

          <div className="flex items-center gap-3 text-sm font-medium text-gray-700">
            <button
              type="button"
              role="switch"
              aria-checked={formulario.activa}
              aria-label="Activa"
              onClick={() =>
                setFormulario((f) => ({ ...f, activa: !f.activa }))
              }
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                formulario.activa ? "bg-indigo-600" : "bg-gray-300"
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                  formulario.activa ? "translate-x-5" : "translate-x-0.5"
                }`}
              />
            </button>
            <span>Activa</span>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={guardando || subiendoImagen}
              className={btnPrimario}
            >
              {guardando ? "Guardando..." : "Guardar"}
            </button>
            <button
              type="button"
              onClick={cerrarFormulario}
              className={btnSecundario}
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {cargando && <p>Cargando coleccionables...</p>}

      {!cargando && items.length === 0 && (
        <p className="text-gray-500">Todavía no hay coleccionables.</p>
      )}

      {!cargando && (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex flex-col rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
            >
              {item.imagen_url && (
                <img
                  src={item.imagen_url}
                  alt={item.nombre}
                  className="mb-3 h-40 w-full rounded-lg object-contain"
                />
              )}
              <h3 className="font-semibold">{item.nombre}</h3>
              <p className="mb-1 text-xs text-gray-500">
                {etiquetaRareza(item.rareza)}
                {item.activa === false && " · Inactiva"}
              </p>
              {item.descripcion && (
                <p className="mb-3 text-sm text-gray-600">{item.descripcion}</p>
              )}
              <div className="mt-auto flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => abrirEdicion(item)}
                  className={btnEditar}
                >
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => eliminar(item)}
                  className={btnPeligro}
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
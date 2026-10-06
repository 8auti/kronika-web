import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import {
  actualizarLeccion,
  crearLeccion,
  eliminarLeccion,
  getCurso,
  getLecciones,
} from "../../services/cursosService";
import Navbar from "../../components/Navbar";
import { useAuth } from "../../auth/useAuth";

// Clases de Tailwind de este panel
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


export default function PanelLecciones() {
  const { cursoId } = useParams();
  const { rol, usuario } = useAuth();
  const navigate = useNavigate();

  const puedeEditar = rol === "editor";

  const [curso, setCurso] = useState(null);
  const [lecciones, setLecciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [formulario, setFormulario] = useState({ nombre: "", orden: 1 });

  const cargar = async () => {
    try {
      setCargando(true);
      const [cursoData, leccionesData] = await Promise.all([
        getCurso(cursoId),
        getLecciones(cursoId),
      ]);
      setCurso(cursoData);
      setLecciones(leccionesData);
    } catch (e) {
      console.error(e);
      setError("No se pudieron cargar las lecciones.");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cursoId]);

  const siguienteOrden = () =>
    lecciones.reduce((max, l) => Math.max(max, l.orden ?? 0), 0) + 1;

  const abrirNuevo = () => {
    setEditandoId(null);
    setFormulario({ nombre: "", orden: siguienteOrden() });
    setMostrarFormulario(true);
  };

  const abrirEdicion = (leccion) => {
    setEditandoId(leccion.id);
    setFormulario({ nombre: leccion.nombre ?? "", orden: leccion.orden ?? 1 });
    setMostrarFormulario(true);
  };

  const cerrarFormulario = () => {
    setMostrarFormulario(false);
    setEditandoId(null);
  };

  const guardar = async (e) => {
    e.preventDefault();
    setError("");

    const datos = {
      nombre: formulario.nombre.trim(),
      orden: Number(formulario.orden),
    };

    if (!datos.nombre) {
      setError("El nombre es obligatorio.");
      return;
    }
    if (!Number.isInteger(datos.orden) || datos.orden < 1) {
      setError("El orden debe ser un número entero mayor a 0.");
      return;
    }

    try {
      setGuardando(true);
      if (editandoId) {
        await actualizarLeccion(editandoId, datos);
      } else {
        await crearLeccion(datos, cursoId, usuario.uid);
      }
      cerrarFormulario();
      await cargar();
    } catch (e) {
      console.error(e);
      setError("No se pudo guardar la lección.");
    } finally {
      setGuardando(false);
    }
  };

  const eliminar = async (leccion) => {
    const confirmar = window.confirm(
      `¿Eliminar la lección "${leccion.nombre}"? Se borrarán también sus preguntas.`
    );
    if (!confirmar) return;

    try {
      setError("");
      await eliminarLeccion(leccion.id);
      await cargar();
    } catch (e) {
      console.error(e);
      setError("No se pudo eliminar la lección.");
    }
  };

  return (
    <>
      <Navbar rol={rol} />

      <main className="mx-auto max-w-4xl p-6">
        <nav className="mb-2 text-sm text-gray-500">
          <Link to="/cursos" className="hover:text-indigo-600">
            Cursos
          </Link>{" "}
          / <span className="text-gray-800">{curso?.nombre ?? "..."}</span>
        </nav>

        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold">Lecciones</h1>
          {puedeEditar && !mostrarFormulario && (
            <button type="button" onClick={abrirNuevo} className={btnPrimario}>
              + Nueva lección
            </button>
          )}
        </div>

        {error && <p className="mb-4 text-red-600">{error}</p>}

        {puedeEditar && mostrarFormulario && (
          <form
            onSubmit={guardar}
            className="mb-6 space-y-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
          >
            <h2 className="text-lg font-semibold">
              {editandoId ? "Editar lección" : "Nueva lección"}
            </h2>

            <div className="grid gap-4 sm:grid-cols-[1fr_120px]">
              <label className="block text-sm font-medium text-gray-700">
                Nombre
                <input
                  value={formulario.nombre}
                  onChange={(e) =>
                    setFormulario((f) => ({ ...f, nombre: e.target.value }))
                  }
                  className={`${inputClase} mt-1`}
                />
              </label>

              <label className="block text-sm font-medium text-gray-700">
                Orden
                <input
                  type="number"
                  min={1}
                  value={formulario.orden}
                  onChange={(e) =>
                    setFormulario((f) => ({ ...f, orden: e.target.value }))
                  }
                  className={`${inputClase} mt-1`}
                />
              </label>
            </div>

            <div className="flex gap-2">
              <button type="submit" disabled={guardando} className={btnPrimario}>
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

        {cargando && <p>Cargando lecciones...</p>}

        {!cargando && lecciones.length === 0 && (
          <p className="text-gray-500">Este curso todavía no tiene lecciones.</p>
        )}

        <ul className="space-y-3">
          {lecciones.map((leccion) => (
            <li
              key={leccion.id}
              onClick={() =>
                navigate(`/cursos/${cursoId}/lecciones/${leccion.id}/preguntas`)
              }
              className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-center gap-4">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-50 text-sm font-semibold text-indigo-700">
                  {leccion.orden}
                </span>
                <h3 className="font-semibold text-gray-900">{leccion.nombre}</h3>
              </div>

              {puedeEditar && (
                <div
                  className="flex gap-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={() => abrirEdicion(leccion)}
                    className={btnEditar}
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => eliminar(leccion)}
                    className={btnPeligro}
                  >
                    Eliminar
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}

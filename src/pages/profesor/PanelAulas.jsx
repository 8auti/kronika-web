import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  actualizarAula,
  crearAula,
  eliminarAula,
  getAulas,
} from "../../services/aulasService";
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

const formatearFecha = (ts) =>
  ts?.toDate?.().toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }) ?? "—";

export default function PanelAulas() {
  const { rol, usuario } = useAuth();
  const navigate = useNavigate();

  const [aulas, setAulas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [nombre, setNombre] = useState("");

  const cargar = async () => {
    try {
      setCargando(true);
      setAulas(await getAulas(usuario.uid));
    } catch (e) {
      console.error(e);
      setError("No se pudieron cargar las aulas.");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const abrirNuevo = () => {
    setEditandoId(null);
    setNombre("");
    setMostrarFormulario(true);
  };

  const abrirEdicion = (aula) => {
    setEditandoId(aula.id);
    setNombre(aula.nombre ?? "");
    setMostrarFormulario(true);
  };

  const cerrarFormulario = () => {
    setMostrarFormulario(false);
    setEditandoId(null);
    setNombre("");
  };

  const guardar = async (e) => {
    e.preventDefault();
    setError("");

    const datos = { nombre: nombre.trim() };
    if (!datos.nombre) {
      setError("El nombre es obligatorio.");
      return;
    }

    try {
      setGuardando(true);
      if (editandoId) {
        await actualizarAula(editandoId, datos);
      } else {
        await crearAula(datos, {
          profesorId: usuario.uid,
          institucionId: usuario.institucionId,
        });
      }
      cerrarFormulario();
      await cargar();
    } catch (e) {
      console.error(e);
      setError("No se pudo guardar el aula.");
    } finally {
      setGuardando(false);
    }
  };

  const eliminar = async (aula) => {
    const confirmar = window.confirm(
      `¿Eliminar el aula "${aula.nombre}"? Se borrarán también sus cursos, lecciones y preguntas.`
    );
    if (!confirmar) return;

    try {
      setError("");
      await eliminarAula(aula.id);
      await cargar();
    } catch (e) {
      console.error(e);
      setError("No se pudo eliminar el aula.");
    }
  };

  return (
    <>
      <Navbar rol={rol} />

      <main className="mx-auto max-w-7xl p-6">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold">Aulas</h1>
          {!mostrarFormulario && (
            <button type="button" onClick={abrirNuevo} className={btnPrimario}>
              + Nueva aula
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
              {editandoId ? "Editar aula" : "Nueva aula"}
            </h2>

            <label className="block text-sm font-medium text-gray-700">
              Nombre
              <input
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className={`${inputClase} mt-1`}
              />
            </label>

            {!editandoId && (
              <p className="text-xs text-gray-500">
                El código del aula, la fecha de creación, tu usuario y tu
                institución se asignan automáticamente.
              </p>
            )}

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

        {cargando && <p>Cargando aulas...</p>}

        {!cargando && aulas.length === 0 && (
          <p className="text-gray-500">Todavía no creaste ningún aula.</p>
        )}

        {!cargando && (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4">
            {aulas.map((aula) => (
              <article
                key={aula.id}
                onClick={() => navigate(`/aulas/${aula.id}/cursos`)}
                className="cursor-pointer overflow-hidden rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {aula.nombre}
                  </h3>
                  <span className="rounded-full bg-indigo-50 px-2 py-0.5 font-mono text-xs text-indigo-700">
                    {aula.codigo_aula}
                  </span>
                </div>

                <p className="mt-2 text-sm text-gray-500">
                  Creada el {formatearFecha(aula.fecha_creacion)}
                </p>

                <div
                  className="mt-3 flex gap-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={() => abrirEdicion(aula)}
                    className={btnEditar}
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => eliminar(aula)}
                    className={btnPeligro}
                  >
                    Eliminar
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </>
  );
}

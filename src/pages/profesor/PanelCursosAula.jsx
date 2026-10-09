import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import {
  agregarCursoKronika,
  crearCursoEnAula,
  getAula,
  getCursosDeAula,
} from "../../services/aulasService";
import {
  actualizarCurso,
  eliminarCurso,
  getCursos,
} from "../../services/cursosService";
import CursoCard from "../../components/CursoCard";
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

const FORMULARIO_VACIO = { nombre: "", descripcion: "", imagen_url: "" };

// Cursos de un aula: solo se ven los del aula (los del editor no aparecen
// hasta que el profesor los agrega con "Agregar curso de Kronika").
export default function PanelCursosAula() {
  const { aulaId } = useParams();
  const { rol, usuario } = useAuth();
  const navigate = useNavigate();

  const [aula, setAula] = useState(null);
  const [cursos, setCursos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [formulario, setFormulario] = useState(FORMULARIO_VACIO);

  // Catálogo de cursos de Kronika (creados por el editor)
  const [mostrarKronika, setMostrarKronika] = useState(false);
  const [cursosKronika, setCursosKronika] = useState([]);
  const [cargandoKronika, setCargandoKronika] = useState(false);
  const [agregandoId, setAgregandoId] = useState(null);

  const cargar = async () => {
    try {
      setCargando(true);
      const [aulaData, cursosData] = await Promise.all([
        getAula(aulaId),
        getCursosDeAula(aulaId),
      ]);
      setAula(aulaData);
      setCursos(cursosData);
    } catch (e) {
      console.error(e);
      setError("No se pudieron cargar los cursos del aula.");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aulaId]);

  // Un profesor solo puede entrar a sus propias aulas
  const sinAcceso = !cargando && (!aula || aula.profesor_id !== usuario.uid);

  const cambiar = (campo) => (e) =>
    setFormulario((f) => ({ ...f, [campo]: e.target.value }));

  const abrirNuevo = () => {
    setEditandoId(null);
    setFormulario(FORMULARIO_VACIO);
    setMostrarKronika(false);
    setMostrarFormulario(true);
  };

  const abrirEdicion = (curso) => {
    setEditandoId(curso.id);
    setFormulario({
      nombre: curso.nombre ?? "",
      descripcion: curso.descripcion ?? "",
      imagen_url: curso.imagen_url ?? "",
    });
    setMostrarKronika(false);
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

    const datos = {
      nombre: formulario.nombre.trim(),
      descripcion: formulario.descripcion.trim(),
      imagen_url: formulario.imagen_url.trim(),
    };

    if (!datos.nombre) {
      setError("El nombre es obligatorio.");
      return;
    }

    try {
      setGuardando(true);
      if (editandoId) {
        await actualizarCurso(editandoId, datos);
      } else {
        await crearCursoEnAula(datos, aulaId);
      }
      cerrarFormulario();
      await cargar();
    } catch (e) {
      console.error(e);
      setError("No se pudo guardar el curso.");
    } finally {
      setGuardando(false);
    }
  };

  const eliminar = async (curso) => {
    const confirmar = window.confirm(
      `¿Eliminar el curso "${curso.nombre}"? Se borrarán también sus lecciones y preguntas.`
    );
    if (!confirmar) return;

    try {
      setError("");
      await eliminarCurso(curso.id);
      await cargar();
    } catch (e) {
      console.error(e);
      setError("No se pudo eliminar el curso.");
    }
  };

  /* ---------------------- Agregar curso de Kronika ---------------------- */

  const abrirKronika = async () => {
    cerrarFormulario();
    setMostrarKronika(true);
    try {
      setCargandoKronika(true);
      setCursosKronika(await getCursos());
    } catch (e) {
      console.error(e);
      setError("No se pudieron cargar los cursos de Kronika.");
    } finally {
      setCargandoKronika(false);
    }
  };

  const agregarKronika = async (curso) => {
    try {
      setError("");
      setAgregandoId(curso.id);
      await agregarCursoKronika(curso, aulaId, usuario.uid);
      await cargar();
    } catch (e) {
      console.error(e);
      setError("No se pudo agregar el curso al aula.");
    } finally {
      setAgregandoId(null);
    }
  };

  // Cursos de Kronika que ya fueron copiados a esta aula
  const yaAgregados = new Set(cursos.map((c) => c.curso_origen_id));

  return (
    <>
      <Navbar rol={rol} />

      <main className="mx-auto max-w-7xl p-6">
        <nav className="mb-2 text-sm text-gray-500">
          <Link to="/aulas" className="hover:text-indigo-600">
            Aulas
          </Link>{" "}
          / <span className="text-gray-800">{aula?.nombre ?? "..."}</span>
        </nav>

        {sinAcceso ? (
          <p className="text-red-600">No tenés acceso a esta aula.</p>
        ) : (
          <>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="text-3xl font-bold">Cursos</h1>
                {aula && (
                  <p className="mt-1 text-sm text-gray-500">
                    Código del aula:{" "}
                    <span className="rounded bg-indigo-50 px-2 py-0.5 font-mono text-indigo-700">
                      {aula.codigo_aula}
                    </span>
                  </p>
                )}
              </div>

              {!mostrarFormulario && !mostrarKronika && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={abrirKronika}
                    className={btnSecundario}
                  >
                    Agregar curso de Kronika
                  </button>
                  <button
                    type="button"
                    onClick={abrirNuevo}
                    className={btnPrimario}
                  >
                    + Nuevo curso
                  </button>
                </div>
              )}
            </div>

            {error && <p className="mb-4 text-red-600">{error}</p>}

            {mostrarFormulario && (
              <form
                onSubmit={guardar}
                className="mb-6 space-y-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
              >
                <h2 className="text-lg font-semibold">
                  {editandoId ? "Editar curso" : "Nuevo curso"}
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
                  URL de la imagen
                  <input
                    type="url"
                    placeholder="https://..."
                    value={formulario.imagen_url}
                    onChange={cambiar("imagen_url")}
                    className={`${inputClase} mt-1`}
                  />
                </label>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={guardando}
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

            {mostrarKronika && (
              <section className="mb-8 rounded-xl border border-indigo-100 bg-indigo-50/40 p-5">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold">Cursos de Kronika</h2>
                    <p className="text-sm text-gray-600">
                      Al agregar un curso se copia a tu aula con sus lecciones
                      y preguntas, y podés modificarlo sin afectar el original.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMostrarKronika(false)}
                    className={btnSecundario}
                  >
                    Cerrar
                  </button>
                </div>

                {cargandoKronika && <p>Cargando cursos de Kronika...</p>}

                {!cargandoKronika && cursosKronika.length === 0 && (
                  <p className="text-gray-500">
                    Todavía no hay cursos de Kronika disponibles.
                  </p>
                )}

                {!cargandoKronika && (
                  <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4">
                    {cursosKronika.map((curso) => {
                      const agregado = yaAgregados.has(curso.id);
                      return (
                        <CursoCard
                          key={curso.id}
                          curso={curso}
                          acciones={
                            <button
                              type="button"
                              disabled={agregado || agregandoId === curso.id}
                              onClick={() => agregarKronika(curso)}
                              className={btnPrimario}
                            >
                              {agregado
                                ? "Ya agregado"
                                : agregandoId === curso.id
                                  ? "Agregando..."
                                  : "Agregar al aula"}
                            </button>
                          }
                        />
                      );
                    })}
                  </div>
                )}
              </section>
            )}

            {cargando && <p>Cargando cursos...</p>}

            {!cargando && cursos.length === 0 && (
              <p className="text-gray-500">
                Esta aula todavía no tiene cursos. Creá uno nuevo o agregá uno
                de Kronika.
              </p>
            )}

            {!cargando && (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4">
                {cursos.map((curso) => (
                  <CursoCard
                    key={curso.id}
                    curso={curso}
                    onClick={() =>
                      navigate(`/aulas/${aulaId}/cursos/${curso.id}/lecciones`)
                    }
                    acciones={
                      <>
                        <button
                          type="button"
                          onClick={() => abrirEdicion(curso)}
                          className={btnEditar}
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => eliminar(curso)}
                          className={btnPeligro}
                        >
                          Eliminar
                        </button>
                      </>
                    }
                  />
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </>
  );
}

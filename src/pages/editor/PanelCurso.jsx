import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { getAula } from "../../services/aulasService";
import {
  TIPOS_NODO,
  crearNodo,
  eliminarNodo,
  eliminarUnidad,
  etiquetaTipoNodo,
  getCurso,
  getNodos,
  guardarUnidad,
  setPublicado,
  tituloCurso,
  unidadesOrdenadas,
} from "../../services/cursosService";
import { useAuth } from "../../auth/useAuth";
import {
  btnEditar,
  btnPeligro,
  btnPrimario,
  btnSecundario,
  inputClase,
} from "../../components/nodos/estilos";

// Mapa del curso: unidades (array del doc del curso) con sus nodos
// (subcolección). Se arma con 2 lecturas: el curso y sus nodos.
export default function PanelCurso() {
  const { aulaId, cursoId } = useParams();
  const { rol, usuario } = useAuth();
  const navigate = useNavigate();

  // Dentro de un aula edita el profesor; en /cursos edita el editor
  const puedeEditar = aulaId ? rol === "profesor" : rol === "editor";
  const rutaCursos = aulaId ? `/aulas/${aulaId}/cursos` : "/cursos";

  const [aula, setAula] = useState(null);
  const [curso, setCurso] = useState(null);
  const [nodos, setNodos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  // Formulario de unidad (id = editando; null = nueva)
  const [formUnidad, setFormUnidad] = useState(null);
  // Formulario de nodo nuevo
  const [formNodo, setFormNodo] = useState(null);

  const cargar = async () => {
    try {
      setCargando(true);
      const [cursoData, nodosData, aulaData] = await Promise.all([
        getCurso(cursoId),
        getNodos(cursoId),
        aulaId ? getAula(aulaId) : null,
      ]);
      setCurso(cursoData);
      setNodos(nodosData);
      setAula(aulaData);
    } catch (e) {
      console.error(e);
      setError("No se pudo cargar el curso.");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cursoId]);

  // El curso debe pertenecer al aula de la URL y el aula a este profesor
  const sinAcceso =
    !cargando &&
    (aulaId
      ? aula?.profesor_id !== usuario.uid || curso?.aula_id !== aulaId
      : Boolean(curso?.aula_id));

  const noExiste = !cargando && !sinAcceso && !curso;

  const unidades = unidadesOrdenadas(curso);
  const nodosDe = (unidadId) => nodos.filter((n) => n.unidadId === unidadId);
  const idsUnidades = new Set(unidades.map((u) => u.id));
  const huerfanos = nodos.filter((n) => !idsUnidades.has(n.unidadId));

  const siguienteOrdenNodo = () =>
    nodos.reduce((max, n) => Math.max(max, n.orden ?? 0), 0) + 1;
  const siguienteOrdenUnidad = () =>
    unidades.reduce((max, u) => Math.max(max, u.orden ?? 0), 0) + 1;

  // Ejecuta una acción de escritura con manejo común de errores
  const ejecutar = async (accion, mensajeError) => {
    try {
      setError("");
      setGuardando(true);
      await accion();
      await cargar();
    } catch (e) {
      console.error(e);
      setError(mensajeError);
    } finally {
      setGuardando(false);
    }
  };

  /* ------------------------------ Publicar ------------------------------ */

  const alternarPublicado = () =>
    ejecutar(
      () => setPublicado(cursoId, !curso.publicado),
      "No se pudo cambiar el estado del curso."
    );

  /* ------------------------------ Unidades ------------------------------ */

  const abrirUnidadNueva = () => {
    setFormNodo(null);
    setFormUnidad({ id: null, titulo: "", orden: siguienteOrdenUnidad() });
  };

  const abrirUnidadEdicion = (u) => {
    setFormNodo(null);
    setFormUnidad({ id: u.id, titulo: u.titulo ?? "", orden: u.orden ?? 1 });
  };

  const guardarFormUnidad = async (e) => {
    e.preventDefault();
    const titulo = formUnidad.titulo.trim();
    const orden = Number(formUnidad.orden);

    if (!titulo) return setError("El título de la unidad es obligatorio.");
    if (!Number.isInteger(orden) || orden < 1)
      return setError("El orden debe ser un número entero mayor a 0.");

    await ejecutar(
      () =>
        guardarUnidad(cursoId, curso.unidades ?? [], {
          id: formUnidad.id,
          titulo,
          orden,
        }),
      "No se pudo guardar la unidad."
    );
    setFormUnidad(null);
  };

  const borrarUnidad = async (u) => {
    const cantidad = nodosDe(u.id).length;
    const aviso = cantidad
      ? ` Se borrarán también sus ${cantidad} nodo${cantidad === 1 ? "" : "s"}.`
      : "";
    if (!window.confirm(`¿Eliminar la unidad "${u.titulo}"?${aviso}`)) return;

    await ejecutar(
      () => eliminarUnidad(cursoId, curso.unidades ?? [], u.id),
      "No se pudo eliminar la unidad."
    );
  };

  /* ------------------------------- Nodos -------------------------------- */

  const abrirNodoNuevo = (unidadId) => {
    setFormUnidad(null);
    setFormNodo({
      unidadId,
      titulo: "",
      tipo: TIPOS_NODO[0].valor,
      orden: siguienteOrdenNodo(),
    });
  };

  const guardarFormNodo = async (e) => {
    e.preventDefault();
    const titulo = formNodo.titulo.trim();
    const orden = Number(formNodo.orden);

    if (!titulo) return setError("El título del nodo es obligatorio.");
    if (!Number.isInteger(orden) || orden < 1)
      return setError("El orden debe ser un número entero mayor a 0.");

    try {
      setError("");
      setGuardando(true);
      const ref = await crearNodo(cursoId, { ...formNodo, titulo, orden });
      // Se crea vacío y se abre el editor para cargar su contenido
      navigate(`${rutaCursos}/${cursoId}/nodos/${ref.id}`);
    } catch (err) {
      console.error(err);
      setError("No se pudo crear el nodo.");
      setGuardando(false);
    }
  };

  const borrarNodo = async (n) => {
    if (!window.confirm(`¿Eliminar el nodo "${n.titulo}"?`)) return;
    await ejecutar(
      () => eliminarNodo(cursoId, n.id),
      "No se pudo eliminar el nodo."
    );
  };

  /* ------------------------------ Render -------------------------------- */

  const renderNodo = (n) => (
    <li
      key={n.id}
      onClick={() => navigate(`${rutaCursos}/${cursoId}/nodos/${n.id}`)}
      className="flex cursor-pointer items-center justify-between gap-4 rounded-lg border border-gray-200 bg-white p-3 transition hover:shadow-md"
    >
      <div className="flex items-center gap-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-50 text-sm font-semibold text-indigo-700">
          {n.orden}
        </span>
        <div>
          <h4 className="font-medium text-gray-900">{n.titulo}</h4>
          <span className="text-xs text-gray-500">
            {etiquetaTipoNodo(n.tipo)}
          </span>
        </div>
      </div>

      {puedeEditar && (
        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => navigate(`${rutaCursos}/${cursoId}/nodos/${n.id}`)}
            className={btnEditar}
          >
            Editar
          </button>
          <button
            type="button"
            onClick={() => borrarNodo(n)}
            className={btnPeligro}
          >
            Eliminar
          </button>
        </div>
      )}
    </li>
  );

  return (
    <main className="mx-auto max-w-4xl p-6">
      <nav className="mb-2 text-sm text-gray-500">
        {aulaId ? (
          <>
            <Link to="/aulas" className="hover:text-indigo-600">
              Aulas
            </Link>{" "}
            /{" "}
            <Link to={rutaCursos} className="hover:text-indigo-600">
              {aula?.nombre ?? "..."}
            </Link>{" "}
            /{" "}
          </>
        ) : (
          <>
            <Link to="/cursos" className="hover:text-indigo-600">
              Cursos
            </Link>{" "}
            /{" "}
          </>
        )}
        <span className="text-gray-800">{tituloCurso(curso) || "..."}</span>
      </nav>

      {sinAcceso && (
        <p className="mb-4 text-red-600">No tenés acceso a este curso.</p>
      )}
      {noExiste && <p className="mb-4 text-red-600">El curso no existe.</p>}
      {cargando && <p>Cargando curso...</p>}

      {curso && !sinAcceso && (
        <>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-3xl font-bold">{tituloCurso(curso)}</h1>
              <p className="mt-1 flex items-center gap-2 text-sm text-gray-500">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${
                    curso.publicado
                      ? "bg-green-50 text-green-700"
                      : "bg-amber-50 text-amber-700"
                  }`}
                >
                  {curso.publicado ? "Publicado" : "Borrador"}
                </span>
                <span>versión {curso.version ?? 1}</span>
              </p>
            </div>

            {puedeEditar && (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={alternarPublicado}
                  disabled={guardando}
                  className={btnSecundario}
                >
                  {curso.publicado ? "Despublicar" : "Publicar"}
                </button>
                {!formUnidad && (
                  <button
                    type="button"
                    onClick={abrirUnidadNueva}
                    className={btnPrimario}
                  >
                    + Nueva unidad
                  </button>
                )}
              </div>
            )}
          </div>

          {error && <p className="mb-4 text-red-600">{error}</p>}

          {puedeEditar && formUnidad && (
            <form
              onSubmit={guardarFormUnidad}
              className="mb-6 space-y-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
            >
              <h2 className="text-lg font-semibold">
                {formUnidad.id ? "Editar unidad" : "Nueva unidad"}
              </h2>

              <div className="grid gap-4 sm:grid-cols-[1fr_120px]">
                <label className="block text-sm font-medium text-gray-700">
                  Título
                  <input
                    value={formUnidad.titulo}
                    onChange={(e) =>
                      setFormUnidad((f) => ({ ...f, titulo: e.target.value }))
                    }
                    className={`${inputClase} mt-1`}
                  />
                </label>
                <label className="block text-sm font-medium text-gray-700">
                  Orden
                  <input
                    type="number"
                    min={1}
                    value={formUnidad.orden}
                    onChange={(e) =>
                      setFormUnidad((f) => ({ ...f, orden: e.target.value }))
                    }
                    className={`${inputClase} mt-1`}
                  />
                </label>
              </div>

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
                  onClick={() => setFormUnidad(null)}
                  className={btnSecundario}
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}

          {puedeEditar && formNodo && (
            <form
              onSubmit={guardarFormNodo}
              className="mb-6 space-y-4 rounded-xl border border-indigo-200 bg-white p-5 shadow-sm"
            >
              <h2 className="text-lg font-semibold">Nuevo nodo</h2>

              <div className="grid gap-4 sm:grid-cols-[1fr_160px_100px]">
                <label className="block text-sm font-medium text-gray-700">
                  Título
                  <input
                    value={formNodo.titulo}
                    onChange={(e) =>
                      setFormNodo((f) => ({ ...f, titulo: e.target.value }))
                    }
                    className={`${inputClase} mt-1`}
                  />
                </label>
                <label className="block text-sm font-medium text-gray-700">
                  Tipo
                  <select
                    value={formNodo.tipo}
                    onChange={(e) =>
                      setFormNodo((f) => ({ ...f, tipo: e.target.value }))
                    }
                    className={`${inputClase} mt-1`}
                  >
                    {TIPOS_NODO.map((t) => (
                      <option key={t.valor} value={t.valor}>
                        {t.etiqueta}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm font-medium text-gray-700">
                  Orden
                  <input
                    type="number"
                    min={1}
                    value={formNodo.orden}
                    onChange={(e) =>
                      setFormNodo((f) => ({ ...f, orden: e.target.value }))
                    }
                    className={`${inputClase} mt-1`}
                  />
                </label>
              </div>

              <p className="text-xs text-gray-500">
                Unidad:{" "}
                {unidades.find((u) => u.id === formNodo.unidadId)?.titulo}.
                Después de crearlo vas a poder cargar su contenido.
              </p>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={guardando}
                  className={btnPrimario}
                >
                  {guardando ? "Creando..." : "Crear y editar contenido"}
                </button>
                <button
                  type="button"
                  onClick={() => setFormNodo(null)}
                  className={btnSecundario}
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}

          {!cargando && unidades.length === 0 && (
            <p className="text-gray-500">
              Este curso todavía no tiene unidades.
              {puedeEditar && " Creá una para empezar a agregar nodos."}
            </p>
          )}

          <div className="space-y-6">
            {unidades.map((u) => {
              const nodosU = nodosDe(u.id);
              return (
                <section
                  key={u.id}
                  className="rounded-xl border border-gray-200 bg-gray-50 p-4"
                >
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <h2 className="text-lg font-semibold text-gray-900">
                      <span className="mr-2 text-sm font-normal text-gray-500">
                        Unidad {u.orden}
                      </span>
                      {u.titulo}
                    </h2>

                    {puedeEditar && (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => abrirNodoNuevo(u.id)}
                          className={btnPrimario}
                        >
                          + Nodo
                        </button>
                        <button
                          type="button"
                          onClick={() => abrirUnidadEdicion(u)}
                          className={btnEditar}
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => borrarUnidad(u)}
                          className={btnPeligro}
                        >
                          Eliminar
                        </button>
                      </div>
                    )}
                  </div>

                  {nodosU.length === 0 ? (
                    <p className="text-sm text-gray-500">
                      Esta unidad todavía no tiene nodos.
                    </p>
                  ) : (
                    <ul className="space-y-2">{nodosU.map(renderNodo)}</ul>
                  )}
                </section>
              );
            })}

            {huerfanos.length > 0 && (
              <section className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                <h2 className="mb-3 text-lg font-semibold text-amber-800">
                  Nodos sin unidad
                </h2>
                <ul className="space-y-2">{huerfanos.map(renderNodo)}</ul>
              </section>
            )}
          </div>
        </>
      )}
    </main>
  );
}

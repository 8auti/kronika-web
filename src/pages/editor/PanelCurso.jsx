import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { getAula } from "../../services/aulasService";
import {
  TIPOS_NODO,
  actualizarNodo,
  crearNodo,
  eliminarNodo,
  eliminarUnidad,
  etiquetaTipoNodo,
  getCurso,
  getNodos,
  guardarUnidad,
  setPublicado,
  siguienteOrden,
  tituloCurso,
  unidadesOrdenadas,
  validarOrden,
} from "../../services/cursosService";
import { useAuth } from "../../auth/useAuth";
import {
  btnEditar,
  btnPeligro,
  btnPrimario,
  btnSecundario,
  inputClase,
} from "../../components/nodos/estilos";

import {
  ChevronDown,
  ChevronRight,
  GripVertical,
  Pencil,
  Trash2,
} from "lucide-react";

// Clave de la zona "Nodos sin unidad" para el arrastre
const SIN_UNIDAD = "sin-unidad";

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
  // Formulario de nodo nuevo (unidadId null = sin unidad)
  const [formNodo, setFormNodo] = useState(null);

  // Unidades desplegadas (por defecto todas cerradas)
  const [abiertas, setAbiertas] = useState(() => new Set());
  // Arrastre: id del nodo que se arrastra y zona sobre la que está
  const [arrastrando, setArrastrando] = useState(null);
  const [destino, setDestino] = useState(null);

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
  const idsUnidades = new Set(unidades.map((u) => u.id));
  const nodosDe = (unidadId) => nodos.filter((n) => n.unidadId === unidadId);
  // Sin unidad: unidadId null/ausente, o apuntando a una unidad que ya no
  // existe. No tienen orden, así que se listan alfabéticamente.
  const huerfanos = nodos
    .filter((n) => !idsUnidades.has(n.unidadId))
    .sort((a, b) => (a.titulo ?? "").localeCompare(b.titulo ?? ""));

  // El orden de los nodos es propio de cada unidad
  const siguienteOrdenNodo = (unidadId) => siguienteOrden(nodosDe(unidadId));
  const siguienteOrdenUnidad = () => siguienteOrden(unidades);

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

  const alternarUnidad = (id) =>
    setAbiertas((prev) => {
      const nuevo = new Set(prev);
      if (nuevo.has(id)) nuevo.delete(id);
      else nuevo.add(id);
      return nuevo;
    });

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

    if (!titulo) return setError("El título de la unidad es obligatorio.");
    const errorOrden = validarOrden(formUnidad.orden);
    if (errorOrden) return setError(errorOrden);

    await ejecutar(
      () =>
        guardarUnidad(cursoId, curso.unidades ?? [], {
          id: formUnidad.id,
          titulo,
          orden: Number(formUnidad.orden),
        }),
      "No se pudo guardar la unidad."
    );
    setFormUnidad(null);
  };

  const borrarUnidad = async (u) => {
    const cantidad = nodosDe(u.id).length;
    const aviso = cantidad
      ? ` Sus ${cantidad} nodo${cantidad === 1 ? "" : "s"} no se borran: pasan a "Nodos sin unidad".`
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
      // Sin unidad no hay orden
      orden: unidadId ? siguienteOrdenNodo(unidadId) : null,
    });
  };

  const guardarFormNodo = async (e) => {
    e.preventDefault();
    const titulo = formNodo.titulo.trim();

    if (!titulo) return setError("El título del nodo es obligatorio.");
    // El orden solo existe dentro de una unidad
    if (formNodo.unidadId) {
      const errorOrden = validarOrden(formNodo.orden);
      if (errorOrden) return setError(errorOrden);
    }

    try {
      setError("");
      setGuardando(true);
      const ref = await crearNodo(cursoId, {
        ...formNodo,
        titulo,
        orden: formNodo.unidadId ? Number(formNodo.orden) : null,
      });
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

  /* --------------------------- Arrastrar nodos --------------------------- */

  // Handlers de una zona de destino (unidad o "sin unidad").
  // `unidadId` es el valor que se guarda en el nodo (null = sin unidad).
  const zona = (clave, unidadId) => ({
    onDragOver: (e) => {
      if (!puedeEditar || !arrastrando) return;
      e.preventDefault(); // necesario para poder soltar
      e.dataTransfer.dropEffect = "move";
      if (destino !== clave) setDestino(clave);
    },
    onDragLeave: (e) => {
      // Ignora el "leave" al pasar por encima de un hijo de la zona
      if (!e.currentTarget.contains(e.relatedTarget)) setDestino(null);
    },
    onDrop: (e) => {
      e.preventDefault();
      soltarNodo(unidadId);
    },
  });

  const soltarNodo = async (unidadId) => {
    const id = arrastrando;
    setArrastrando(null);
    setDestino(null);

    const nodo = nodos.find((n) => n.id === id);
    if (!nodo || (nodo.unidadId ?? null) === unidadId) return;

    // Al cambiar de unidad el nodo queda al final de la unidad destino (el
    // orden no se arrastra de la anterior); sin unidad no tiene orden.
    const orden = unidadId ? siguienteOrdenNodo(unidadId) : null;

    // Actualización optimista; si falla se vuelve al estado anterior
    const anteriores = nodos;
    setNodos((prev) =>
      prev.map((n) => (n.id === id ? { ...n, unidadId, orden } : n))
    );
    if (unidadId) setAbiertas((prev) => new Set(prev).add(unidadId));

    try {
      setError("");
      await actualizarNodo(cursoId, id, { unidadId, orden });
      // La unidad de origen se renumera: se vuelven a leer los nodos
      setNodos(await getNodos(cursoId));
      setCurso((c) => ({ ...c, version: (c.version ?? 1) + 1 }));
    } catch (e) {
      console.error(e);
      setNodos(anteriores);
      setError("No se pudo mover el nodo.");
    }
  };

  const claseZona = (clave, base) =>
    `${base} ${destino === clave ? "ring-2 ring-indigo-400" : ""}`;

  /* ------------------------------ Render -------------------------------- */

  const renderNodo = (n, conOrden = true) => (
    <li
      key={n.id}
      draggable={puedeEditar}
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", n.id);
        setArrastrando(n.id);
      }}
      onDragEnd={() => {
        setArrastrando(null);
        setDestino(null);
      }}
      onClick={() => navigate(`${rutaCursos}/${cursoId}/nodos/${n.id}`)}
      className={`flex cursor-pointer items-center justify-between gap-4 rounded-lg border border-gray-200 bg-white p-3 transition hover:shadow-md ${
        arrastrando === n.id ? "opacity-40" : ""
      }`}
    >
      <div className="flex items-center gap-3">
        {puedeEditar && (
          <GripVertical
            size={18}
            className="shrink-0 cursor-grab text-gray-400"
            aria-label="Arrastrar para mover a otra unidad"
          />
        )}
        {conOrden && (
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-50 text-sm font-semibold text-indigo-700">
            {n.orden}
          </span>
        )}
        <div>
          <h4 className="font-medium text-gray-900">{n.titulo}</h4>
          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
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
            aria-label={`Editar nodo ${n.titulo}`}
            title="Editar"
          >
            <Pencil size={16} />
          </button>
          <button
            type="button"
            onClick={() => borrarNodo(n)}
            className={btnPeligro}
            aria-label={`Eliminar nodo ${n.titulo}`}
            title="Eliminar"
          >
            <Trash2 size={16} />
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

              <div
                className={`grid gap-4 ${
                  formNodo.unidadId
                    ? "sm:grid-cols-[1fr_160px_100px]"
                    : "sm:grid-cols-[1fr_160px]"
                }`}
              >
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
                {formNodo.unidadId && (
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
                )}
              </div>

              <p className="text-xs text-gray-500">
                Unidad:{" "}
                {unidades.find((u) => u.id === formNodo.unidadId)?.titulo ??
                  "Sin unidad"}
                . Después de crearlo vas a poder cargar su contenido.
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
            <p className="mb-4 text-gray-500">
              Este curso todavía no tiene unidades.
              {puedeEditar && " Creá una para empezar a agregar nodos."}
            </p>
          )}

          {puedeEditar && unidades.length > 0 && nodos.length > 0 && (
            <p className="mb-3 text-xs text-gray-500">
              Tip: arrastrá un nodo (⋮⋮) hasta una unidad, o hasta "Nodos sin
              unidad", para moverlo.
            </p>
          )}

          <div className="space-y-4">
            {unidades.map((u) => {
              const nodosU = nodosDe(u.id);
              const abierta = abiertas.has(u.id);
              const clave = `u:${u.id}`;

              return (
                <section
                  key={u.id}
                  {...zona(clave, u.id)}
                  className={claseZona(
                    clave,
                    "rounded-xl border border-gray-200 bg-gray-50 p-4"
                  )}
                >
                  <h2>
                    <button
                      type="button"
                      onClick={() => alternarUnidad(u.id)}
                      aria-expanded={abierta}
                      className="flex w-full items-center justify-between gap-3 text-left"
                    >
                      <span className="flex items-center gap-2">
                        {abierta ? (
                          <ChevronDown size={20} className="text-gray-500" />
                        ) : (
                          <ChevronRight size={20} className="text-gray-500" />
                        )}
                        <span className="text-sm font-normal text-gray-500">
                          Unidad {u.orden}
                        </span>
                        <span className="text-lg font-semibold text-gray-900">
                          {u.titulo}
                        </span>
                      </span>
                      <span className="text-xs text-gray-500">
                        {nodosU.length} nodo{nodosU.length === 1 ? "" : "s"}
                      </span>
                    </button>
                  </h2>

                  {abierta && (
                    <div className="mt-3">
                      {puedeEditar && (
                        <div className="mb-3 flex gap-2">
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
                            Editar unidad
                          </button>
                          <button
                            type="button"
                            onClick={() => borrarUnidad(u)}
                            className={btnPeligro}
                          >
                            Eliminar unidad
                          </button>
                        </div>
                      )}

                      {nodosU.length === 0 ? (
                        <p className="text-sm text-gray-500">
                          Esta unidad todavía no tiene nodos.
                        </p>
                      ) : (
                        <ul className="space-y-2">
                          {nodosU.map((n) => renderNodo(n, true))}
                        </ul>
                      )}
                    </div>
                  )}
                </section>
              );
            })}

            {/* Siempre visible para el editor: sirve de destino al arrastrar */}
            {(puedeEditar || huerfanos.length > 0) && (
              <section
                {...zona(SIN_UNIDAD, null)}
                className={claseZona(
                  SIN_UNIDAD,
                  "rounded-xl border border-dashed border-red-300 bg-red-50 p-4"
                )}
              >
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-lg font-semibold text-red-800">
                    Nodos sin unidad
                    <span className="ml-2 text-xs font-normal text-red-700">
                      {huerfanos.length} nodo{huerfanos.length === 1 ? "" : "s"}
                    </span>
                  </h2>

                </div>

                {huerfanos.length === 0 ? (
                  <p className="text-xs text-red-700">
                    Arrastrá un nodo hasta acá para dejarlo sin unidad.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {huerfanos.map((n) => renderNodo(n, false))}
                  </ul>
                )}
              </section>
            )}
          </div>
        </>
      )}
    </main>
  );
}

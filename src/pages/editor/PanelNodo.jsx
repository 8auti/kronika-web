import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { getAula } from "../../services/aulasService";
import {
  actualizarNodo,
  contenidoVacio,
  etiquetaTipoNodo,
  getCurso,
  getNodo,
  limpiarContenido,
  normalizarRetos,
  tituloCurso,
  unidadesOrdenadas,
  validarContenido,
} from "../../services/cursosService";
import { useAuth } from "../../auth/useAuth";
import EditorJefe from "../../components/nodos/EditorJefe";
import EditorLectura from "../../components/nodos/EditorLectura";
import EditorRetos from "../../components/nodos/EditorRetos";
import {
  btnPrimario,
  btnSecundario,
  inputClase,
} from "../../components/nodos/estilos";

// Solo el contenido propio del tipo (lo demás es metadata del nodo).
// Se normaliza por si el nodo guardado tiene campos incompletos.
function extraerContenido(nodo) {
  const base = contenidoVacio(nodo.tipo);

  if (nodo.tipo === "lectura") {
    const bloques = Array.isArray(nodo.bloques) ? nodo.bloques : [];
    return { bloques: bloques.length ? bloques : base.bloques };
  }

  const retos = normalizarRetos(nodo.retos, nodo.tipo);
  const retosFinal = retos.length ? retos : base.retos;

  if (nodo.tipo === "jefe") {
    return {
      jefe: { ...base.jefe, ...nodo.jefe },
      vidasJugador: nodo.vidasJugador ?? base.vidasJugador,
      retos: retosFinal,
    };
  }
  return { retos: retosFinal };
}

export default function PanelNodo() {
  const { aulaId, cursoId, nodoId } = useParams();
  const { usuario } = useAuth();
  const navigate = useNavigate();

  const rutaCursos = aulaId ? `/aulas/${aulaId}/cursos` : "/cursos";
  const rutaCurso = `${rutaCursos}/${cursoId}`;

  const [aula, setAula] = useState(null);
  const [curso, setCurso] = useState(null);
  const [nodo, setNodo] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [guardado, setGuardado] = useState(false);

  // Formulario: metadata + contenido del tipo
  const [titulo, setTitulo] = useState("");
  const [unidadId, setUnidadId] = useState("");
  const [orden, setOrden] = useState(1);
  const [contenido, setContenido] = useState(null);

  useEffect(() => {
    const cargar = async () => {
      try {
        setCargando(true);
        const [cursoData, nodoData, aulaData] = await Promise.all([
          getCurso(cursoId),
          getNodo(cursoId, nodoId),
          aulaId ? getAula(aulaId) : null,
        ]);
        setAula(aulaData);
        setCurso(cursoData);
        setNodo(nodoData);
        if (nodoData) {
          setTitulo(nodoData.titulo ?? "");
          setUnidadId(nodoData.unidadId ?? "");
          setOrden(nodoData.orden ?? 1);
          setContenido(extraerContenido(nodoData));
        }
      } catch (e) {
        console.error(e);
        setError("No se pudo cargar el nodo.");
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, [cursoId, nodoId, aulaId]);

  // El curso debe pertenecer al aula de la URL y el aula a este profesor
  const sinAcceso =
    !cargando &&
    (aulaId
      ? aula?.profesor_id !== usuario.uid || curso?.aula_id !== aulaId
      : Boolean(curso?.aula_id));

  const noExiste = !cargando && !sinAcceso && !nodo;
  const unidades = unidadesOrdenadas(curso);

  const guardar = async (e) => {
    e.preventDefault();
    setError("");
    setGuardado(false);

    const tituloLimpio = titulo.trim();
    const ordenNum = Number(orden);

    if (!tituloLimpio) return setError("El título es obligatorio.");
    if (!Number.isInteger(ordenNum) || ordenNum < 1)
      return setError("El orden debe ser un número entero mayor a 0.");
    if (!unidadId) return setError("Elegí una unidad.");

    const errorContenido = validarContenido(nodo.tipo, contenido);
    if (errorContenido) return setError(errorContenido);

    try {
      setGuardando(true);
      await actualizarNodo(cursoId, nodoId, {
        titulo: tituloLimpio,
        unidadId,
        orden: ordenNum,
        ...limpiarContenido(nodo.tipo, contenido),
      });
      setGuardado(true);
    } catch (err) {
      console.error(err);
      setError("No se pudo guardar el nodo.");
    } finally {
      setGuardando(false);
    }
  };

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
        <Link to={rutaCurso} className="hover:text-indigo-600">
          {tituloCurso(curso) || "..."}
        </Link>{" "}
        / <span className="text-gray-800">{nodo?.titulo ?? "..."}</span>
      </nav>

      {sinAcceso && (
        <p className="mb-4 text-red-600">No tenés acceso a este curso.</p>
      )}
      {noExiste && <p className="mb-4 text-red-600">El nodo no existe.</p>}
      {cargando && <p>Cargando nodo...</p>}

      {nodo && !sinAcceso && contenido && (
        <>
          <div className="mb-6 flex items-center gap-3">
            <h1 className="text-3xl font-bold">Nodo</h1>
            <span className="rounded-full bg-indigo-50 px-3 py-1 text-sm text-indigo-700">
              {etiquetaTipoNodo(nodo.tipo)}
            </span>
          </div>

          <form
            onSubmit={guardar}
            className="space-y-5 rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
          >
            <div className="grid gap-4 sm:grid-cols-[1fr_200px_100px]">
              <label className="block text-sm font-medium text-gray-700">
                Título
                <input
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  className={`${inputClase} mt-1`}
                />
              </label>

              <label className="block text-sm font-medium text-gray-700">
                Unidad
                <select
                  value={unidadId}
                  onChange={(e) => setUnidadId(e.target.value)}
                  className={`${inputClase} mt-1`}
                >
                  {unidades.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.titulo}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-sm font-medium text-gray-700">
                Orden
                <input
                  type="number"
                  min={1}
                  value={orden}
                  onChange={(e) => setOrden(e.target.value)}
                  className={`${inputClase} mt-1`}
                />
              </label>
            </div>

            <hr className="border-gray-200" />

            {nodo.tipo === "lectura" && (
              <EditorLectura
                bloques={contenido.bloques}
                onChange={(bloques) => setContenido({ bloques })}
              />
            )}

            {nodo.tipo === "jefe" && (
              <EditorJefe contenido={contenido} onChange={setContenido} />
            )}

            {["trivia", "emparejar", "ordenar"].includes(nodo.tipo) && (
              <EditorRetos
                retos={contenido.retos}
                onChange={(retos) => setContenido({ retos })}
                tipos={[nodo.tipo]}
              />
            )}

            {error && <p className="text-red-600">{error}</p>}
            {guardado && (
              <p className="text-green-700">Nodo guardado correctamente.</p>
            )}

            <div className="flex gap-2">
              <button type="submit" disabled={guardando} className={btnPrimario}>
                {guardando ? "Guardando..." : "Guardar"}
              </button>
              <button
                type="button"
                onClick={() => navigate(rutaCurso)}
                className={btnSecundario}
              >
                Volver al curso
              </button>
            </div>
          </form>
        </>
      )}
    </main>
  );
}

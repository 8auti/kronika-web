import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import {
  TIPOS_PREGUNTA,
  actualizarPregunta,
  crearPregunta,
  eliminarPregunta,
  getCurso,
  getLeccion,
  getPreguntas,
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


const MIN_RESPUESTAS = 2;
const MAX_RESPUESTAS = 6;

const FORMULARIO_VACIO = {
  pregunta: "",
  tipo_pregunta: "multiple_choice",
  respuestas: ["", ""],
  respuesta_correcta_index: 0,
};

const etiquetaTipo = (valor) =>
  TIPOS_PREGUNTA.find((t) => t.valor === valor)?.etiqueta ?? valor;

export default function PanelPreguntas() {
  const { cursoId, leccionId } = useParams();
  const { rol } = useAuth();

  const puedeEditar = rol === "editor";

  const [curso, setCurso] = useState(null);
  const [leccion, setLeccion] = useState(null);
  const [preguntas, setPreguntas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [formulario, setFormulario] = useState(FORMULARIO_VACIO);

  const cargar = async () => {
    try {
      setCargando(true);
      const [cursoData, leccionData, preguntasData] = await Promise.all([
        getCurso(cursoId),
        getLeccion(leccionId),
        getPreguntas(leccionId),
      ]);
      setCurso(cursoData);
      setLeccion(leccionData);
      setPreguntas(preguntasData);
    } catch (e) {
      console.error(e);
      setError("No se pudieron cargar las preguntas.");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leccionId]);

  const abrirNuevo = () => {
    setEditandoId(null);
    setFormulario(FORMULARIO_VACIO);
    setMostrarFormulario(true);
  };

  const abrirEdicion = (p) => {
    setEditandoId(p.id);
    setFormulario({
      pregunta: p.pregunta ?? "",
      tipo_pregunta: p.tipo_pregunta ?? "multiple_choice",
      respuestas: p.respuestas?.length ? [...p.respuestas] : ["", ""],
      respuesta_correcta_index: p.respuesta_correcta_index ?? 0,
    });
    setMostrarFormulario(true);
  };

  const cerrarFormulario = () => {
    setMostrarFormulario(false);
    setEditandoId(null);
    setFormulario(FORMULARIO_VACIO);
  };

  const cambiarRespuesta = (i, valor) =>
    setFormulario((f) => ({
      ...f,
      respuestas: f.respuestas.map((r, idx) => (idx === i ? valor : r)),
    }));

  const agregarRespuesta = () =>
    setFormulario((f) =>
      f.respuestas.length >= MAX_RESPUESTAS
        ? f
        : { ...f, respuestas: [...f.respuestas, ""] }
    );

  const quitarRespuesta = (i) =>
    setFormulario((f) => {
      if (f.respuestas.length <= MIN_RESPUESTAS) return f;

      let correcta = f.respuesta_correcta_index;
      if (i === correcta) correcta = 0;
      else if (i < correcta) correcta -= 1;

      return {
        ...f,
        respuestas: f.respuestas.filter((_, idx) => idx !== i),
        respuesta_correcta_index: correcta,
      };
    });

  const guardar = async (e) => {
    e.preventDefault();
    setError("");

    const datos = {
      pregunta: formulario.pregunta.trim(),
      tipo_pregunta: formulario.tipo_pregunta,
      respuestas: formulario.respuestas.map((r) => r.trim()),
      respuesta_correcta_index: formulario.respuesta_correcta_index,
    };

    if (!datos.pregunta) {
      setError("La pregunta es obligatoria.");
      return;
    }
    if (datos.respuestas.some((r) => !r)) {
      setError("Completá todas las respuestas o quitá las que sobren.");
      return;
    }

    try {
      setGuardando(true);
      if (editandoId) {
        await actualizarPregunta(leccionId, editandoId, datos);
      } else {
        await crearPregunta(leccionId, datos);
      }
      cerrarFormulario();
      await cargar();
    } catch (e) {
      console.error(e);
      setError("No se pudo guardar la pregunta.");
    } finally {
      setGuardando(false);
    }
  };

  const eliminar = async (p) => {
    if (!window.confirm("¿Eliminar esta pregunta?")) return;

    try {
      setError("");
      await eliminarPregunta(leccionId, p.id);
      await cargar();
    } catch (e) {
      console.error(e);
      setError("No se pudo eliminar la pregunta.");
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
          /{" "}
          <Link
            to={`/cursos/${cursoId}/lecciones`}
            className="hover:text-indigo-600"
          >
            {curso?.nombre ?? "..."}
          </Link>{" "}
          / <span className="text-gray-800">{leccion?.nombre ?? "..."}</span>
        </nav>

        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold">Preguntas</h1>
          {puedeEditar && !mostrarFormulario && (
            <button type="button" onClick={abrirNuevo} className={btnPrimario}>
              + Nueva pregunta
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
              {editandoId ? "Editar pregunta" : "Nueva pregunta"}
            </h2>

            <label className="block text-sm font-medium text-gray-700">
              Tipo de pregunta
              <select
                value={formulario.tipo_pregunta}
                onChange={(e) =>
                  setFormulario((f) => ({ ...f, tipo_pregunta: e.target.value }))
                }
                className={`${inputClase} mt-1`}
              >
                {TIPOS_PREGUNTA.map((t) => (
                  <option key={t.valor} value={t.valor}>
                    {t.etiqueta}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm font-medium text-gray-700">
              Pregunta
              <textarea
                rows={2}
                value={formulario.pregunta}
                onChange={(e) =>
                  setFormulario((f) => ({ ...f, pregunta: e.target.value }))
                }
                className={`${inputClase} mt-1`}
              />
            </label>

            <fieldset>
              <legend className="text-sm font-medium text-gray-700">
                Respuestas{" "}
                <span className="font-normal text-gray-500">
                  (marcá la correcta)
                </span>
              </legend>

              <div className="mt-2 space-y-2">
                {formulario.respuestas.map((respuesta, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="correcta"
                      checked={formulario.respuesta_correcta_index === i}
                      onChange={() =>
                        setFormulario((f) => ({
                          ...f,
                          respuesta_correcta_index: i,
                        }))
                      }
                      className="h-4 w-4 accent-indigo-600"
                      aria-label={`Respuesta ${i + 1} correcta`}
                    />
                    <input
                      value={respuesta}
                      onChange={(e) => cambiarRespuesta(i, e.target.value)}
                      placeholder={`Respuesta ${i + 1}`}
                      className={inputClase}
                    />
                    <button
                      type="button"
                      onClick={() => quitarRespuesta(i)}
                      disabled={formulario.respuestas.length <= MIN_RESPUESTAS}
                      className={btnPeligro}
                      aria-label="Quitar respuesta"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              {formulario.respuestas.length < MAX_RESPUESTAS && (
                <button
                  type="button"
                  onClick={agregarRespuesta}
                  className="mt-2 text-sm font-medium text-indigo-600 hover:underline"
                >
                  + Agregar respuesta
                </button>
              )}
            </fieldset>

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

        {cargando && <p>Cargando preguntas...</p>}

        {!cargando && preguntas.length === 0 && (
          <p className="text-gray-500">Esta lección todavía no tiene preguntas.</p>
        )}

        <ul className="space-y-3">
          {preguntas.map((p, n) => (
            <li
              key={p.id}
              className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs text-indigo-700">
                    {etiquetaTipo(p.tipo_pregunta)}
                  </span>
                  <h3 className="mt-2 font-semibold text-gray-900">
                    {n + 1}. {p.pregunta}
                  </h3>
                </div>

                {puedeEditar && (
                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      onClick={() => abrirEdicion(p)}
                      className={btnEditar}
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => eliminar(p)}
                      className={btnPeligro}
                    >
                      Eliminar
                    </button>
                  </div>
                )}
              </div>

              <ul className="mt-3 space-y-1 text-sm">
                {p.respuestas?.map((r, i) => (
                  <li
                    key={i}
                    className={
                      i === p.respuesta_correcta_index
                        ? "font-medium text-green-700"
                        : "text-gray-600"
                    }
                  >
                    {i === p.respuesta_correcta_index ? "✓" : "•"} {r}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}

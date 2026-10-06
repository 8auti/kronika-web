import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  actualizarCurso,
  crearCurso,
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

export default function PanelCursos() {
  const { rol } = useAuth();
  const navigate = useNavigate();

  // Solo el editor gestiona cursos; el profesor los ve en modo lectura
  const puedeEditar = rol === "editor";

  const [cursos, setCursos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [formulario, setFormulario] = useState(FORMULARIO_VACIO);

  const cargarCursos = async () => {
    try {
      setCargando(true);
      setCursos(await getCursos());
    } catch (e) {
      console.error(e);
      setError("No se pudieron cargar los cursos.");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarCursos();
  }, []);

  const cambiar = (campo) => (e) =>
    setFormulario((f) => ({ ...f, [campo]: e.target.value }));

  const abrirNuevo = () => {
    setEditandoId(null);
    setFormulario(FORMULARIO_VACIO);
    setMostrarFormulario(true);
  };

  const abrirEdicion = (curso) => {
    setEditandoId(curso.id);
    setFormulario({
      nombre: curso.nombre ?? "",
      descripcion: curso.descripcion ?? "",
      imagen_url: curso.imagen_url ?? "",
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
        // tipo_creador sale automáticamente del rol del usuario
        await crearCurso(datos, rol);
      }
      cerrarFormulario();
      await cargarCursos();
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
      await cargarCursos();
    } catch (e) {
      console.error(e);
      setError("No se pudo eliminar el curso.");
    }
  };

  return (
    <>
      <Navbar rol={rol} />

      <main className="mx-auto max-w-7xl p-6">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold">Cursos</h1>
          {puedeEditar && !mostrarFormulario && (
            <button type="button" onClick={abrirNuevo} className={btnPrimario}>
              + Nuevo curso
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

            <p className="text-xs text-gray-500">
              Creador: <span className="capitalize">{rol}</span> (se asigna
              automáticamente)
            </p>

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

        {cargando && <p>Cargando cursos...</p>}

        {!cargando && cursos.length === 0 && (
          <p className="text-gray-500">Todavía no hay cursos.</p>
        )}

        {!cargando && (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4">
            {cursos.map((curso) => (
              <CursoCard
                key={curso.id}
                curso={curso}
                onClick={() => navigate(`/cursos/${curso.id}/lecciones`)}
                acciones={
                  puedeEditar && (
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
                  )
                }
              />
            ))}
          </div>
        )}
      </main>
    </>
  );
}

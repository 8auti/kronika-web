import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { CheckCircle2, Circle } from "lucide-react";

import { getAula, getAulas } from "../../services/aulasService";
import { tituloCurso, unidadesOrdenadas } from "../../services/cursosService";
import {
  getAlumno,
  getAlumnosDeAula,
  getCursosConNodos,
  getProgresoAlumno,
  nombreAlumno,
  resumenCurso,
  resumenTotal,
  ultimaActividad,
} from "../../services/progresoService";
import { useAuth } from "../../auth/useAuth";

const formatearFecha = (ts) =>
  ts?.toDate?.().toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }) ?? null;

const tarjeta =
  "rounded-xl border border-gray-200 bg-white p-4 shadow-sm";
const tarjetaLink = `${tarjeta} block transition hover:border-indigo-300 hover:shadow`;

function Barra({ porcentaje }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
      <div
        className="h-full rounded-full bg-indigo-600"
        style={{ width: `${porcentaje}%` }}
      />
    </div>
  );
}

/* ---------------------------- 1. Aulas ---------------------------- */
function VistaAulas() {
  const { usuario } = useAuth();
  const [aulas, setAulas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getAulas(usuario.uid)
      .then(setAulas)
      .catch((e) => {
        console.error(e);
        setError("No se pudieron cargar las aulas.");
      })
      .finally(() => setCargando(false));
  }, [usuario.uid]);

  return (
    <>
      <h1 className="mb-6 text-3xl font-bold">Progreso de alumnos</h1>
      {error && <p className="text-red-600">{error}</p>}
      {cargando && <p>Cargando aulas...</p>}
      {!cargando && !error && aulas.length === 0 && (
        <p className="text-gray-500">Todavía no creaste ningún aula.</p>
      )}
      <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-4">
        {aulas.map((aula) => (
          <Link key={aula.id} to={`/progreso/${aula.id}`} className={tarjetaLink}>
            <h3 className="font-semibold">{aula.nombre}</h3>
            <p className="mt-2 text-sm text-gray-500">
              Código <span className="font-mono">{aula.codigo_aula}</span>
            </p>
          </Link>
        ))}
      </div>
    </>
  );
}

/* ------------------------- 2. Alumnos del aula ------------------------- */
function VistaAlumnos({ aulaId }) {
  const [aula, setAula] = useState(null);
  const [alumnos, setAlumnos] = useState([]);
  const [cursos, setCursos] = useState([]);
  const [progresos, setProgresos] = useState({}); // alumnoId -> progreso por curso
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const [aulaDatos, lista, cursosAula] = await Promise.all([
          getAula(aulaId),
          getAlumnosDeAula(aulaId),
          getCursosConNodos(aulaId),
        ]);
        const pares = await Promise.all(
          lista.map(async (a) => [a.id, await getProgresoAlumno(a.id, cursosAula)])
        );
        setAula(aulaDatos);
        setAlumnos(lista);
        setCursos(cursosAula);
        setProgresos(Object.fromEntries(pares));
      } catch (e) {
        console.error(e);
        setError("No se pudo cargar el progreso del aula.");
      } finally {
        setCargando(false);
      }
    })();
  }, [aulaId]);

  return (
    <>
      <h1 className="mb-1 text-3xl font-bold">{aula?.nombre ?? "Aula"}</h1>
      <p className="mb-6 text-sm text-gray-500">
        {alumnos.length} {alumnos.length === 1 ? "alumno" : "alumnos"} ·{" "}
        {cursos.length} {cursos.length === 1 ? "curso" : "cursos"}
      </p>

      {error && <p className="text-red-600">{error}</p>}
      {cargando && <p>Cargando alumnos...</p>}
      {!cargando && !error && alumnos.length === 0 && (
        <p className="text-gray-500">
          Todavía no ingresó ningún alumno. Compartí el código{" "}
          <span className="font-mono">{aula?.codigo_aula}</span> para que se
          unan.
        </p>
      )}

      <div className="space-y-3">
        {alumnos.map((alumno) => {
          const total = resumenTotal(cursos, progresos[alumno.id]);
          const ultima = formatearFecha(ultimaActividad(progresos[alumno.id]));
          return (
            <Link
              key={alumno.id}
              to={`/progreso/${aulaId}/${alumno.id}`}
              className={`${tarjetaLink} flex flex-wrap items-center gap-x-6 gap-y-2`}
            >
              <div className="min-w-[200px] flex-1">
                <p className="font-semibold">{nombreAlumno(alumno)}</p>
                {alumno.nombre && alumno.email && (
                  <p className="text-sm text-gray-500">{alumno.email}</p>
                )}
              </div>
              <div className="w-full sm:w-64">
                <div className="mb-1 flex justify-between text-xs text-gray-600">
                  <span>
                    {total.completados} de {total.total} nodos
                  </span>
                  <span>{total.porcentaje}%</span>
                </div>
                <Barra porcentaje={total.porcentaje} />
              </div>
              <p className="w-full text-xs text-gray-500 sm:w-40">
                {ultima ? `Última actividad: ${ultima}` : "Sin actividad"}
              </p>
            </Link>
          );
        })}
      </div>
    </>
  );
}

/* ----------------------- 3. Detalle de un alumno ----------------------- */
function FilaNodo({ nodo, hecho }) {
  const completado = Boolean(hecho?.completado);
  const fecha = formatearFecha(hecho?.fecha);
  return (
    <li className="flex items-center gap-3 py-2">
      {completado ? (
        <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" aria-label="Completado" />
      ) : (
        <Circle className="h-5 w-5 shrink-0 text-gray-300" aria-label="Sin completar" />
      )}
      <span className={completado ? "flex-1" : "flex-1 text-gray-500"}>
        {nodo.titulo || "Nodo sin título"}
        <span className="ml-2 text-xs text-gray-400">{nodo.tipo}</span>
      </span>
      {completado && hecho.estrellas > 0 && (
        <span className="text-sm text-amber-500" title={`${hecho.estrellas} estrellas`}>
          {"★".repeat(hecho.estrellas)}
        </span>
      )}
      <span className="w-24 text-right text-xs text-gray-500">
        {completado ? fecha ?? "Completado" : "Pendiente"}
      </span>
    </li>
  );
}

function BloqueCurso({ curso, progreso }) {
  const r = resumenCurso(curso, progreso);
  const hechos = progreso?.nodos ?? {};

  const unidades = unidadesOrdenadas(curso);
  const idsUnidad = new Set(unidades.map((u) => u.id));
  const grupos = unidades.map((u) => ({
    clave: u.id,
    titulo: u.titulo,
    nodos: curso.nodos.filter((n) => n.unidadId === u.id),
  }));
  const sueltos = curso.nodos.filter((n) => !idsUnidad.has(n.unidadId));
  if (sueltos.length > 0) {
    grupos.push({ clave: "_sin", titulo: "Sin unidad", nodos: sueltos });
  }

  return (
    <section className={tarjeta}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-semibold">{tituloCurso(curso)}</h2>
        <span className="text-sm text-gray-600">
          {r.completados} de {r.total} nodos · {r.porcentaje}%
        </span>
      </div>
      <Barra porcentaje={r.porcentaje} />

      {!progreso && (
        <p className="mt-3 text-sm text-gray-500">Todavía no empezó este curso.</p>
      )}
      {curso.nodos.length === 0 && (
        <p className="mt-3 text-sm text-gray-500">Este curso no tiene nodos.</p>
      )}

      {grupos
        .filter((g) => g.nodos.length > 0)
        .map((g) => {
          const hechosUnidad = g.nodos.filter((n) => hechos[n.id]?.completado).length;
          return (
            <div key={g.clave} className="mt-5">
              <h3 className="flex items-baseline justify-between border-b border-gray-200 pb-1 font-medium">
                <span>{g.titulo || "Unidad sin título"}</span>
                <span className="text-xs font-normal text-gray-500">
                  {hechosUnidad}/{g.nodos.length}
                </span>
              </h3>
              <ul className="divide-y divide-gray-100">
                {g.nodos.map((n) => (
                  <FilaNodo key={n.id} nodo={n} hecho={hechos[n.id]} />
                ))}
              </ul>
            </div>
          );
        })}
    </section>
  );
}

function VistaAlumno({ aulaId, alumnoId }) {
  const [alumno, setAlumno] = useState(null);
  const [cursos, setCursos] = useState([]);
  const [progreso, setProgreso] = useState({});
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const [datos, cursosAula] = await Promise.all([
          getAlumno(alumnoId),
          getCursosConNodos(aulaId),
        ]);
        setAlumno(datos);
        setCursos(cursosAula);
        setProgreso(await getProgresoAlumno(alumnoId, cursosAula));
      } catch (e) {
        console.error(e);
        setError("No se pudo cargar el progreso del alumno.");
      } finally {
        setCargando(false);
      }
    })();
  }, [aulaId, alumnoId]);

  return (
    <>
      <h1 className="mb-1 text-3xl font-bold">
        {alumno ? nombreAlumno(alumno) : "Alumno"}
      </h1>
      {alumno?.nombre && alumno?.email && (
        <p className="mb-6 text-sm text-gray-500">{alumno.email}</p>
      )}

      {error && <p className="text-red-600">{error}</p>}
      {cargando && <p>Cargando progreso...</p>}
      {!cargando && !error && cursos.length === 0 && (
        <p className="text-gray-500">Esta aula todavía no tiene cursos.</p>
      )}

      <div className="mt-4 space-y-5">
        {cursos.map((curso) => (
          <BloqueCurso key={curso.id} curso={curso} progreso={progreso[curso.id]} />
        ))}
      </div>
    </>
  );
}

/* Una sola página para las tres rutas: /progreso, /progreso/:aulaId y
   /progreso/:aulaId/:alumnoId */
export default function PanelProgreso() {
  const { aulaId, alumnoId } = useParams();
  return (
    <main className="mx-auto max-w-5xl p-6">
      {alumnoId ? (
        <VistaAlumno aulaId={aulaId} alumnoId={alumnoId} />
      ) : aulaId ? (
        <VistaAlumnos aulaId={aulaId} />
      ) : (
        <VistaAulas />
      )}
    </main>
  );
}

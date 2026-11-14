import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  writeBatch,
} from "firebase/firestore";
import { db } from "../firebase";
import { getCursosDeAula } from "./aulasService";
import { getNodos } from "./cursosService";

/*
 * Lo escribe la function `completarNodo`:
 *   users/{alumnoId}/progreso/{cursoId}
 *     nodos: { [nodoId]: { completado, fecha, estrellas } }
 *     ultimo_nodo_id, ultima_actividad, aula_id
 *   inscripcion_aula: { alumno_id, aula_id }
 */

// Los alumnos no juegan nodos jefe (completarNodo se los rechaza)
const esNodoDeAlumno = (n) => n.tipo !== "jefe";

/** Cursos del aula, cada uno con sus nodos (sin jefes). */
export async function getCursosConNodos(aulaId) {
  const cursos = await getCursosDeAula(aulaId);
  return Promise.all(
    cursos.map(async (curso) => ({
      ...curso,
      nodos: (await getNodos(curso.id)).filter(esNodoDeAlumno),
    }))
  );
}

/** Alumnos inscriptos en el aula, con los datos de su perfil. */
export async function getAlumnosDeAula(aulaId) {
  const snap = await getDocs(
    query(collection(db, "inscripcion_aula"), where("aula_id", "==", aulaId))
  );
  const ids = [
    ...new Set(snap.docs.map((d) => d.data().alumno_id).filter(Boolean)),
  ];
  const alumnos = await Promise.all(ids.map((id) => getAlumno(id)));
  return alumnos.sort((a, b) =>
    nombreAlumno(a).localeCompare(nombreAlumno(b))
  );
}

/**
 * Saca al alumno del aula borrando su inscripción. No toca el perfil del
 * alumno ni su progreso (eso es del alumno); solo deja de pertenecer al aula.
 */
export async function eliminarAlumnoDeAula(aulaId, alumnoId) {
  const snap = await getDocs(
    query(
      collection(db, "inscripcion_aula"),
      where("aula_id", "==", aulaId),
      where("alumno_id", "==", alumnoId)
    )
  );
  const batch = writeBatch(db);
  snap.docs.forEach((d) => batch.delete(d.ref));
  await batch.commit();
}

// Si el perfil no se puede leer, el alumno igual aparece (sin nombre)
export async function getAlumno(alumnoId) {
  try {
    const snap = await getDoc(doc(db, "users", alumnoId));
    return { id: alumnoId, ...(snap.exists() ? snap.data() : {}) };
  } catch (e) {
    console.warn("No se pudo leer el perfil del alumno", alumnoId, e);
    return { id: alumnoId };
  }
}

export const nombreAlumno = (a) => a?.nombre || a?.email || "Alumno sin perfil";

/** { [cursoId]: datos del progreso | null } */
export async function getProgresoAlumno(alumnoId, cursos) {
  const entradas = await Promise.all(
    cursos.map(async (curso) => {
      const snap = await getDoc(doc(db, "users", alumnoId, "progreso", curso.id));
      return [curso.id, snap.exists() ? snap.data() : null];
    })
  );
  return Object.fromEntries(entradas);
}

/** Cuenta solo los nodos que existen hoy en el curso. */
export function resumenCurso(curso, progreso) {
  const hechos = progreso?.nodos ?? {};
  const total = curso.nodos.length;
  const completados = curso.nodos.filter((n) => hechos[n.id]?.completado).length;
  return {
    completados,
    total,
    porcentaje: total ? Math.round((completados / total) * 100) : 0,
  };
}

export function resumenTotal(cursos, progresoPorCurso) {
  let completados = 0;
  let total = 0;
  for (const curso of cursos) {
    const r = resumenCurso(curso, progresoPorCurso?.[curso.id]);
    completados += r.completados;
    total += r.total;
  }
  return {
    completados,
    total,
    porcentaje: total ? Math.round((completados / total) * 100) : 0,
  };
}

/** Timestamp más reciente entre los cursos, o null si nunca jugó. */
export function ultimaActividad(progresoPorCurso) {
  const fechas = Object.values(progresoPorCurso ?? {})
    .map((p) => p?.ultima_actividad)
    .filter(Boolean);
  if (fechas.length === 0) return null;
  return fechas.reduce((a, b) =>
    (b.toMillis?.() ?? 0) > (a.toMillis?.() ?? 0) ? b : a
  );
}

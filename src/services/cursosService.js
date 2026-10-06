import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { db } from "../firebase";

/* ============================== CURSOS ============================== */

export async function getCursos() {
  const q = query(collection(db, "cursos"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getCurso(cursoId) {
  const snap = await getDoc(doc(db, "cursos", cursoId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

// tipo_creador se toma del rol del usuario logueado (no lo escribe el editor)
export async function crearCurso({ nombre, descripcion, imagen_url }, tipoCreador) {
  return addDoc(collection(db, "cursos"), {
    descripcion,
    imagen_url,
    nombre,
    tipo_creador: tipoCreador,
  });
}

// Al editar no se toca tipo_creador: queda el del creador original
export async function actualizarCurso(cursoId, { nombre, descripcion, imagen_url }) {
  return updateDoc(doc(db, "cursos", cursoId), {
    descripcion,
    imagen_url,
    nombre,
  });
}

// Borra en cascada: preguntas -> lecciones -> curso
export async function eliminarCurso(cursoId) {
  const lecciones = await getLecciones(cursoId);
  for (const leccion of lecciones) {
    await eliminarLeccion(leccion.id);
  }
  await deleteDoc(doc(db, "cursos", cursoId));
}

/* ============================= LECCIONES ============================= */

export async function getLeccion(leccionId) {
  const snap = await getDoc(doc(db, "lecciones", leccionId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

// Se ordena en el cliente para no requerir un índice compuesto en Firestore
export async function getLecciones(cursoId) {
  const q = query(collection(db, "lecciones"), where("curso_id", "==", cursoId));
  const snapshot = await getDocs(q);
  return snapshot.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0));
}

export async function crearLeccion({ nombre, orden }, cursoId, creadorId) {
  return addDoc(collection(db, "lecciones"), {
    creador_id: creadorId,
    curso_id: cursoId,
    nombre,
    orden,
  });
}

export async function actualizarLeccion(leccionId, { nombre, orden }) {
  return updateDoc(doc(db, "lecciones", leccionId), { nombre, orden });
}

// Firestore no borra subcolecciones solo: se eliminan las preguntas primero
export async function eliminarLeccion(leccionId) {
  const preguntas = await getDocs(
    collection(db, "lecciones", leccionId, "preguntas")
  );

  // Lotes de hasta 400 operaciones (el máximo de Firestore es 500)
  const refs = preguntas.docs.map((d) => d.ref);
  for (let i = 0; i < refs.length; i += 400) {
    const batch = writeBatch(db);
    refs.slice(i, i + 400).forEach((ref) => batch.delete(ref));
    await batch.commit();
  }

  await deleteDoc(doc(db, "lecciones", leccionId));
}

/* ============================= PREGUNTAS ============================= */

export const TIPOS_PREGUNTA = [
  { valor: "multiple_choice", etiqueta: "Multiple choice" },
  { valor: "cuestionario", etiqueta: "Cuestionario" },
];

// lecciones/{leccionId}/preguntas
const preguntasRef = (leccionId) =>
  collection(db, "lecciones", leccionId, "preguntas");

export async function getPreguntas(leccionId) {
  const snapshot = await getDocs(preguntasRef(leccionId));
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function crearPregunta(leccionId, datos) {
  return addDoc(preguntasRef(leccionId), {
    pregunta: datos.pregunta,
    respuesta_correcta_index: datos.respuesta_correcta_index,
    respuestas: datos.respuestas,
    tipo_pregunta: datos.tipo_pregunta,
  });
}

export async function actualizarPregunta(leccionId, preguntaId, datos) {
  return updateDoc(doc(db, "lecciones", leccionId, "preguntas", preguntaId), {
    pregunta: datos.pregunta,
    respuesta_correcta_index: datos.respuesta_correcta_index,
    respuestas: datos.respuestas,
    tipo_pregunta: datos.tipo_pregunta,
  });
}

export async function eliminarPregunta(leccionId, preguntaId) {
  return deleteDoc(doc(db, "lecciones", leccionId, "preguntas", preguntaId));
}

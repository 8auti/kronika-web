import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { db } from "../firebase";
import { datosCursoNuevo, eliminarCurso, getNodos } from "./cursosService";

/* ============================== AULAS ============================== */
// aulas/{aulaId}:
//   codigo_aula, fecha_creacion, institucion_id, nombre, profesor_id

// Sin 0/O/1/I para que el código sea fácil de dictar y copiar
const ALFABETO = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const LARGO_CODIGO = 6;

function generarCodigo() {
  const bytes = new Uint32Array(LARGO_CODIGO);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => ALFABETO[b % ALFABETO.length]).join("");
}

async function generarCodigoUnico() {
  for (let intento = 0; intento < 10; intento++) {
    const codigo = generarCodigo();
    const q = query(collection(db, "aulas"), where("codigo_aula", "==", codigo));
    const snap = await getDocs(q);
    if (snap.empty) return codigo;
  }
  throw new Error("No se pudo generar un código de aula único.");
}

// Se ordena en el cliente para no requerir un índice compuesto
export async function getAulas(profesorId) {
  const q = query(collection(db, "aulas"), where("profesor_id", "==", profesorId));
  const snapshot = await getDocs(q);
  return snapshot.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort(
      (a, b) =>
        (b.fecha_creacion?.toMillis?.() ?? 0) -
        (a.fecha_creacion?.toMillis?.() ?? 0)
    );
}

export async function getAula(aulaId) {
  const snap = await getDoc(doc(db, "aulas", aulaId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

// codigo_aula y fecha_creacion se generan solos; institucion_id y
// profesor_id salen del usuario logueado
export async function crearAula({ nombre }, { profesorId, institucionId }) {
  return addDoc(collection(db, "aulas"), {
    codigo_aula: await generarCodigoUnico(),
    fecha_creacion: serverTimestamp(),
    institucion_id: institucionId ?? null,
    nombre,
    profesor_id: profesorId,
  });
}

// Solo se edita el nombre: el código y la fecha no cambian
export async function actualizarAula(aulaId, { nombre }) {
  return updateDoc(doc(db, "aulas", aulaId), { nombre });
}

// Borra en cascada: cursos del aula (con sus nodos) -> aula
export async function eliminarAula(aulaId) {
  const cursos = await getCursosDeAula(aulaId);
  for (const curso of cursos) {
    await eliminarCurso(curso.id);
  }
  await deleteDoc(doc(db, "aulas", aulaId));
}

/* ========================= CURSOS DEL AULA ========================= */
// Los cursos del aula viven en la misma colección "cursos" y se distinguen
// por el campo aula_id. Así unidades y nodos funcionan igual que
// con los cursos del editor.

export async function getCursosDeAula(aulaId) {
  const q = query(collection(db, "cursos"), where("aula_id", "==", aulaId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function crearCursoEnAula(datos, aulaId) {
  return addDoc(collection(db, "cursos"), {
    ...datosCursoNuevo(datos),
    tipo_creador: "profesor",
    aula_id: aulaId,
  });
}

/**
 * Copia un curso de Kronika (curso + unidades + nodos) dentro del aula.
 * Es una copia independiente: el profesor puede modificarla sin afectar
 * el curso original del editor. curso_origen_id guarda de dónde viene.
 * Los ids de unidad se conservan, así los nodos copiados siguen apuntando
 * a su unidad.
 */
export async function agregarCursoKronika(cursoOrigen, aulaId) {
  const nodos = await getNodos(cursoOrigen.id);

  const cursoRef = await addDoc(collection(db, "cursos"), {
    titulo: cursoOrigen.titulo ?? cursoOrigen.nombre ?? "",
    descripcion: cursoOrigen.descripcion ?? "",
    imagen_url: cursoOrigen.imagen_url ?? "",
    version: 1,
    publicado: cursoOrigen.publicado ?? false,
    unidades: cursoOrigen.unidades ?? [],
    tipo_creador: "profesor",
    aula_id: aulaId,
    curso_origen_id: cursoOrigen.id,
  });

  const destino = collection(db, "cursos", cursoRef.id, "nodos");

  // Lotes de hasta 400 operaciones (el máximo de Firestore es 500)
  for (let i = 0; i < nodos.length; i += 400) {
    const batch = writeBatch(db);
    nodos.slice(i, i + 400).forEach(({ id: _id, ...datos }) => {
      batch.set(doc(destino), datos);
    });
    await batch.commit();
  }

  return cursoRef;
}

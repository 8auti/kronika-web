import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import { getCursos, getNodos, tituloCurso } from "./cursosService";

/*
 * ESTRUCTURA (la lee la function `completarNodo` al vencer a un jefe)
 *
 * coleccionables/{id}
 *   nombre, titulo, descripcion, imagen_url, rareza
 *   activa:   false -> la carta no se otorga
 *   condicion: { tipo: "jefe", nodo_id }  -> se otorga al vencer ese nodo jefe
 *   creadoEn
 */

export const RAREZAS = [
  { valor: "comun", etiqueta: "Común" },
  { valor: "raro", etiqueta: "Raro" },
  { valor: "epico", etiqueta: "Épico" },
  { valor: "legendario", etiqueta: "Legendario" },
];

export const etiquetaRareza = (valor) =>
  RAREZAS.find((r) => r.valor === valor)?.etiqueta ?? valor ?? "";

const col = () => collection(db, "coleccionables");
const refDe = (id) => doc(db, "coleccionables", id);

/** Devuelve un mensaje de error, o null si los datos son válidos. */
export function validarColeccionable({ nombre, imagen_url, rareza }) {
  if (!String(nombre ?? "").trim()) return "El nombre es obligatorio.";
  if (!String(imagen_url ?? "").trim()) return "Falta elegir la imagen.";
  if (!RAREZAS.some((r) => r.valor === rareza)) return "Elegí una rareza.";
  return null;
}

const limpiar = ({
  nombre,
  descripcion,
  imagen_url,
  rareza,
  activa,
  nodo_id,
}) => ({
  nombre: String(nombre).trim(),
  titulo: String(nombre).trim(), // la function devuelve ambos campos
  descripcion: String(descripcion ?? "").trim(),
  imagen_url: String(imagen_url).trim(),
  rareza,
  activa: Boolean(activa),
  condicion: nodo_id ? { tipo: "jefe", nodo_id } : null,
});

// Se ordena en el cliente: así aparecen también las cartas sin `creadoEn`
export async function getColeccionables() {
  const snap = await getDocs(col());
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (a.nombre ?? "").localeCompare(b.nombre ?? ""));
}

export async function crearColeccionable(datos) {
  return addDoc(col(), { ...limpiar(datos), creadoEn: serverTimestamp() });
}

export async function actualizarColeccionable(id, datos) {
  return updateDoc(refDe(id), limpiar(datos));
}

export async function eliminarColeccionable(id) {
  return deleteDoc(refDe(id));
}

/** Nodos jefe de los cursos de Kronika: [{ id, etiqueta }] para elegir la condición. */
export async function getJefesDisponibles() {
  const cursos = await getCursos();
  const porCurso = await Promise.all(
    cursos.map(async (curso) => {
      const nodos = await getNodos(curso.id);
      return nodos
        .filter((n) => n.tipo === "jefe")
        .map((n) => ({
          id: n.id,
          etiqueta: `${tituloCurso(curso)} — ${n.titulo || n.jefe?.nombre || n.id}`,
        }));
    })
  );
  return porCurso.flat();
}
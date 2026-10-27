import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";

/*
 * FORO DE CONSULTAS (uno por aula)
 *
 * aulas/{aulaId}/mensajes/{mensajeId}
 *   autor_id      uid del que escribe (profesor o alumno)
 *   autor_nombre  nombre al momento de enviar (evita leer "users" por cada mensaje)
 *   autor_rol     "profesor" | "alumno"
 *   texto         contenido del mensaje
 *   fecha         serverTimestamp()
 *
 * El aula YA existe, así que el foro no necesita colección propia:
 * el aula es el foro y los mensajes son su subcolección.
 */

export const MAX_LARGO_MENSAJE = 1000;
const MAX_MENSAJES = 200; // últimos N mensajes que se muestran

const mensajesRef = (aulaId) => collection(db, "aulas", aulaId, "mensajes");

// Escucha en tiempo real. Devuelve la función para cancelar la suscripción.
export function escucharMensajes(aulaId, onDatos, onError) {
  const q = query(
    mensajesRef(aulaId),
    orderBy("fecha", "desc"),
    limit(MAX_MENSAJES)
  );

  return onSnapshot(
    q,
    (snap) =>
      onDatos(
        snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .reverse() // se pidió desc para traer los últimos; se muestra asc
      ),
    onError
  );
}

export async function enviarMensaje(aulaId, { texto }, autor) {
  const limpio = texto.trim();
  if (!limpio) throw new Error("El mensaje está vacío.");
  if (limpio.length > MAX_LARGO_MENSAJE) {
    throw new Error(`Máximo ${MAX_LARGO_MENSAJE} caracteres.`);
  }

  return addDoc(mensajesRef(aulaId), {
    autor_id: autor.uid,
    autor_nombre: autor.nombre || autor.email || "Sin nombre",
    autor_rol: autor.rol,
    texto: limpio,
    fecha: serverTimestamp(),
  });
}

export async function eliminarMensaje(aulaId, mensajeId) {
  return deleteDoc(doc(db, "aulas", aulaId, "mensajes", mensajeId));
}

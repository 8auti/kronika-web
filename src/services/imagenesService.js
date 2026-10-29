import { doc, getDoc } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";

import { auth, db, storage } from "../firebase";

// Roles que pueden subir imágenes -> carpeta raíz y subcarpetas permitidas.
// El profesor no tiene "jefes": no crea nodos jefe (ver storage.rules).
export const SUBIDA_POR_ROL = {
  editor: { raiz: "editores", carpetas: ["iconos-cursos", "lecturas", "jefes"] },
  profesor: { raiz: "aulas", carpetas: ["iconos-cursos", "lecturas"] },
};

export const TIPOS_IMAGEN = ["image/jpeg", "image/png", "image/webp", "image/gif"];
export const MAX_MB = 5;

// Carpetas de Storage: imagenes/<editores|aulas>/<carpeta>/<uid>/<archivo>
// editores: iconos-cursos, lecturas, jefes | aulas: iconos-cursos, lecturas
// (si agregás una nueva, agregala también en storage.rules)
export const CARPETAS = {
  ICONO_CURSO: "iconos-cursos", // icono/portada de cada curso
  LECTURA: "lecturas", //          fotos dentro de los nodos de lectura
  JEFE: "jefes", //                imagen del jefe en los nodos jefe
};

const EXTENSION = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

/** Devuelve un mensaje de error, o null si el archivo es válido. */
export function validarImagen(archivo) {
  if (!TIPOS_IMAGEN.includes(archivo.type))
    return "El archivo debe ser una imagen (JPG, PNG, WEBP o GIF).";
  if (archivo.size > MAX_MB * 1024 * 1024)
    return `La imagen no puede pesar más de ${MAX_MB} MB.`;
  return null;
}

/**
 * Sube una imagen a Firebase Storage y devuelve su URL pública.
 * La carpeta raíz depende del rol: editor -> "editores", profesor -> "aulas".
 * @param {File} archivo
 * @param {string} carpeta  una de CARPETAS
 * @param {(porcentaje:number)=>void} [onProgreso]
 */
export async function subirImagen(archivo, carpeta, onProgreso) {
  const error = validarImagen(archivo);
  if (error) throw new Error(error);

  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("Tenés que iniciar sesión.");

  // El rol se lee de Firestore (mismo dato que validan las reglas de Storage)
  const snap = await getDoc(doc(db, "users", uid));
  const rol = snap.data()?.rol;
  const permiso = SUBIDA_POR_ROL[rol];
  if (!permiso?.carpetas.includes(carpeta))
    throw new Error("Tu rol no puede subir imágenes a esta sección.");
  const { raiz } = permiso;

  const nombre = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const ruta = `imagenes/${raiz}/${carpeta}/${uid}/${nombre}.${EXTENSION[archivo.type]}`;
  const tarea = uploadBytesResumable(ref(storage, ruta), archivo, {
    contentType: archivo.type,
  });

  return new Promise((resolve, reject) => {
    tarea.on(
      "state_changed",
      (snap) =>
        onProgreso?.(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
      reject,
      async () => resolve(await getDownloadURL(tarea.snapshot.ref))
    );
  });
}

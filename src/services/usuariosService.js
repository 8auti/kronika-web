import { getApps, initializeApp } from "firebase/app";
import {
  createUserWithEmailAndPassword,
  getAuth,
  signOut,
} from "firebase/auth";
import {
  collection,
  deleteField,
  doc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";

import { app, db } from "../firebase";

// Roles que el admin puede crear y editar
export const ROLES = ["admin", "editor", "institucion"];

// Roles que gestiona cada institución (el admin solo puede suspenderlos)
export const ROLES_INSTITUCION = ["profesor", "alumno"];

// Roles que pueden iniciar sesión en la web
export const ROLES_CON_ACCESO = [...ROLES, "profesor"];

export const ESTADOS = {
  ACTIVO: "activo",
  BANEADO: "suspendido",
};

/**
 * Indica si un perfil de Firestore está baneado. También reconoce el
 * campo viejo "activo: false" para perfiles anteriores a "estado".
 */
export function estaBaneado(datos) {
  if (datos?.estado !== undefined) {
    return datos.estado === ESTADOS.BANEADO;
  }

  return datos?.activo === false;
}

/**
 * Instancia secundaria de Firebase usada SOLO para crear cuentas.
 * createUserWithEmailAndPassword inicia sesión con el usuario nuevo;
 * si lo hiciéramos con la instancia principal, el admin quedaría
 * deslogueado y logueado como el usuario recién creado.
 */
function getAuthSecundario() {
  const existente = getApps().find((a) => a.name === "secundaria");
  const appSecundaria =
    existente ?? initializeApp(app.options, "secundaria");

  return getAuth(appSecundaria);
}

function traducirErrorAuth(error) {
  switch (error.code) {
    case "auth/email-already-in-use":
      return "Ya existe una cuenta con ese correo.";
    case "auth/invalid-email":
      return "El correo no es válido.";
    case "auth/weak-password":
      return "La contraseña debe tener al menos 6 caracteres.";
    default:
      return "No se pudo crear la cuenta.";
  }
}

/**
 * Lista usuarios. Sin opciones devuelve todos (admin).
 * - institucionId: solo los que pertenecen a esa institución.
 * - roles: solo los usuarios con alguno de esos roles.
 */
export async function getUsuarios({ institucionId, roles } = {}) {
  const referencia = collection(db, "users");
  const consulta = institucionId
    ? query(referencia, where("institucionId", "==", institucionId))
    : referencia;

  const snapshot = await getDocs(consulta);

  return snapshot.docs
    .filter((documento) =>
      roles ? roles.includes(documento.data().rol) : true
    )
    .map((documento) => {
      const datos = documento.data();

      return {
        uid: documento.id,
        ...datos,
        // true si el documento todavía no tiene el campo "estado" guardado
        sinEstado: datos.estado === undefined,
        estado: estaBaneado(datos) ? ESTADOS.BANEADO : ESTADOS.ACTIVO,
      };
    })
    .sort((a, b) =>
      (a.nombre || a.email || "").localeCompare(
        b.nombre || b.email || ""
      )
    );
}

/**
 * Guarda el campo "estado" en los perfiles que todavía no lo tienen
 * (y elimina el campo viejo "activo"), para que figure en Firestore.
 */
export async function completarEstados(usuarios) {
  const pendientes = usuarios.filter((u) => u.sinEstado);

  await Promise.all(
    pendientes.map((u) =>
      updateDoc(doc(db, "users", u.uid), {
        estado: u.estado,
        activo: deleteField(),
      })
    )
  );

  return pendientes.length;
}

export async function crearUsuario(
  { nombre, email, password, rol, institucionId },
  rolesPermitidos = ROLES
) {
  if (!rolesPermitidos.includes(rol)) {
    throw new Error("Rol inválido.");
  }

  const authSecundario = getAuthSecundario();

  let uid;

  // 1. Crear la cuenta en Authentication (sin tocar la sesión del admin)
  try {
    const credenciales = await createUserWithEmailAndPassword(
      authSecundario,
      email.trim(),
      password
    );

    uid = credenciales.user.uid;
  } catch (error) {
    console.error(error);
    throw new Error(traducirErrorAuth(error));
  }

  // 2. Guardar el perfil en Firestore con la sesión del admin
  try {
    await setDoc(doc(db, "users", uid), {
      nombre: nombre.trim(),
      email: email.trim(),
      rol,
      ...(institucionId ? { institucionId } : {}),
      estado: ESTADOS.ACTIVO,
      creadoEn: serverTimestamp(),
    });
  } catch (error) {
    console.error(error);
    throw new Error(
      "La cuenta se creó en Authentication pero no se pudo guardar el perfil. Revisá las reglas de Firestore."
    );
  } finally {
    await signOut(authSecundario);
  }

  return uid;
}


export async function actualizarUsuario(
  uid,
  { nombre, rol },
  rolesPermitidos = ROLES
) {
  if (!rolesPermitidos.includes(rol)) {
    throw new Error("Rol inválido.");
  }

  await updateDoc(doc(db, "users", uid), {
    nombre: nombre.trim(),
    rol,
  });
}


export async function cambiarEstadoUsuario(uid, estado) {
  if (!Object.values(ESTADOS).includes(estado)) {
    throw new Error("Estado inválido.");
  }

  await updateDoc(doc(db, "users", uid), {
    estado,
    activo: deleteField(),
  });
}

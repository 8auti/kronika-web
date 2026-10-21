import { useState } from "react";
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  deleteUser,
  getAdditionalUserInfo,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { Link, Navigate, useNavigate } from "react-router-dom";

import { auth, db } from "../firebase";
import {
  ROLES_CON_ACCESO,
  crearPerfilPropio,
  estaBaneado,
} from "../services/usuariosService";
import { useAuth } from "./useAuth.jsx";

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

const LARGO_MINIMO_PASSWORD = 6;

function mensajeErrorRegistro(error) {
  switch (error.code) {
    case "auth/email-already-in-use":
      return "Ya existe una cuenta con ese correo. Probá iniciar sesión.";
    case "auth/invalid-email":
      return "El formato del correo no es válido.";
    case "auth/weak-password":
      return `La contraseña debe tener al menos ${LARGO_MINIMO_PASSWORD} caracteres.`;
    case "auth/operation-not-allowed":
      return "El registro con correo y contraseña no está habilitado en Firebase.";
    case "auth/too-many-requests":
      return "Demasiados intentos. Esperá unos minutos e intentá de nuevo.";
    case "auth/network-request-failed":
      return "Error de red. Revisá tu conexión e intentá de nuevo.";
    default:
      return "No se pudo crear la cuenta. Intentá de nuevo.";
  }
}

function mensajeErrorGoogle(error) {
  switch (error.code) {
    case "auth/popup-blocked":
      return "El navegador bloqueó la ventana emergente. Permitila e intentá de nuevo.";
    case "auth/account-exists-with-different-credential":
      return "Ya existe una cuenta con ese correo con otro método de acceso. Ingresá con correo y contraseña.";
    case "auth/operation-not-allowed":
      return "El inicio de sesión con Google no está habilitado en Firebase.";
    case "auth/unauthorized-domain":
      return "Este dominio no está autorizado en Firebase Authentication.";
    case "auth/network-request-failed":
      return "Error de red. Revisá tu conexión e intentá de nuevo.";
    default:
      return "No se pudo registrar con Google.";
  }
}

export default function Registro() {
  const navigate = useNavigate();
  const { usuario, rol } = useAuth();

  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmacion, setConfirmacion] = useState("");

  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  /**
   * Deshace una cuenta de Authentication que quedó sin perfil. Si no se
   * puede borrar, al menos se cierra la sesión.
   */
  async function descartarSesion(usuarioFirebase, esCuentaNueva) {
    if (esCuentaNueva) {
      try {
        await deleteUser(usuarioFirebase);
        return;
      } catch (error) {
        console.error("No se pudo borrar la cuenta recién creada:", error);
      }
    }

    await signOut(auth);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");

    const nombreLimpio = nombre.trim();
    const emailLimpio = email.trim();

    if (!nombreLimpio) {
      setError("Ingresá tu nombre.");
      return;
    }

    if (password.length < LARGO_MINIMO_PASSWORD) {
      setError(
        `La contraseña debe tener al menos ${LARGO_MINIMO_PASSWORD} caracteres.`,
      );
      return;
    }

    if (password !== confirmacion) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setCargando(true);

    try {
      // 1. Crear la cuenta en Authentication (inicia sesión automáticamente)
      let credenciales;

      try {
        credenciales = await createUserWithEmailAndPassword(
          auth,
          emailLimpio,
          password,
        );
      } catch (error) {
        console.error("Error al crear la cuenta:", error);
        setError(mensajeErrorRegistro(error));
        return;
      }

      // 2. Crear el perfil en Firestore. Si falla, se borra la cuenta para
      // no dejar un usuario huérfano en Authentication.
      try {
        await crearPerfilPropio(credenciales.user.uid, {
          nombre: nombreLimpio,
          email: emailLimpio,
        });
      } catch (error) {
        console.error("Error al guardar el perfil:", error);
        await descartarSesion(credenciales.user, true);
        setError("No se pudo guardar tu perfil. Intentá de nuevo.");
        return;
      }

      navigate("/landing");
    } finally {
      setCargando(false);
    }
  }

  async function handleGoogle() {
    setError("");
    setCargando(true);

    try {
      const credenciales = await signInWithPopup(auth, googleProvider);
      const usuarioGoogle = credenciales.user;

      // true solo si Google acaba de crear la cuenta en este intento
      const esCuentaNueva =
        getAdditionalUserInfo(credenciales)?.isNewUser === true;

      let datos;

      try {
        const usuarioSnap = await getDoc(doc(db, "users", usuarioGoogle.uid));

        if (!usuarioSnap.exists()) {
          await crearPerfilPropio(usuarioGoogle.uid, {
            nombre:
              usuarioGoogle.displayName ||
              usuarioGoogle.email?.split("@")[0] ||
              "",
            email: usuarioGoogle.email ?? "",
          });

          navigate("/sin-acceso");
          return;
        }

        datos = usuarioSnap.data();
      } catch (error) {
        console.error("Error obteniendo o creando el perfil:", error);
        await descartarSesion(usuarioGoogle, esCuentaNueva);
        setError("No se pudo guardar tu perfil. Intentá de nuevo.");
        return;
      }

      // La cuenta ya estaba registrada: se comporta como un login
      if (estaBaneado(datos)) {
        await signOut(auth);
        setError("Tu cuenta fue suspendida. Contactá a un administrador si creés que fue un error.");
        return;
      }

      navigate(
        ROLES_CON_ACCESO.includes(datos.rol) ? "/landing" : "/sin-acceso",
      );
    } catch (error) {
      // Si cerró la ventana de Google no es un error que haya que mostrar
      if (
        error.code === "auth/popup-closed-by-user" ||
        error.code === "auth/cancelled-popup-request"
      ) {
        return;
      }

      console.error("Error al registrarse con Google:", error);

      setError(mensajeErrorGoogle(error));
    } finally {
      setCargando(false);
    }
  }

  // Si ya hay sesión activa, no se puede acceder al registro
  if (usuario && ROLES_CON_ACCESO.includes(rol)) {
    return <Navigate to="/landing" replace />;
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100 px-4 py-8">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-xl bg-white p-8 shadow-md"
      >
        <h1 className="mb-6 text-2xl font-bold text-gray-900">Crear cuenta</h1>

        <div className="mb-4">
          <label
            htmlFor="nombre"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Nombre
          </label>

          <input
            id="nombre"
            type="text"
            autoComplete="name"
            value={nombre}
            onChange={(event) => setNombre(event.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-indigo-500"
            placeholder="Nombre y apellido"
            required
          />
        </div>

        <div className="mb-4">
          <label
            htmlFor="email"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Correo electrónico
          </label>

          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-indigo-500"
            placeholder="correo@ejemplo.com"
            required
          />
        </div>

        <div className="mb-4">
          <label
            htmlFor="password"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Contraseña
          </label>

          <input
            id="password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-indigo-500"
            placeholder="••••••••"
            minLength={LARGO_MINIMO_PASSWORD}
            required
          />

          <p className="mt-1 text-xs text-gray-500">
            Mínimo {LARGO_MINIMO_PASSWORD} caracteres.
          </p>
        </div>

        <div className="mb-4">
          <label
            htmlFor="confirmacion"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Confirmar contraseña
          </label>

          <input
            id="confirmacion"
            type="password"
            autoComplete="new-password"
            value={confirmacion}
            onChange={(event) => setConfirmacion(event.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-indigo-500"
            placeholder="••••••••"
            required
          />
        </div>

        {error && (
          <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={cargando}
          className="w-full rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {cargando ? "Creando cuenta..." : "Crear cuenta"}
        </button>

        <div className="my-5 flex items-center gap-3 text-sm text-gray-400">
          <span className="h-px flex-1 bg-gray-200" />
          o
          <span className="h-px flex-1 bg-gray-200" />
        </div>

        <button
          type="button"
          onClick={handleGoogle}
          disabled={cargando}
          className="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-300 bg-white px-4 py-2 font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          <svg className="h-5 w-5" viewBox="0 0 48 48" aria-hidden="true">
            <path
              fill="#EA4335"
              d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z"
            />
            <path
              fill="#4285F4"
              d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17.5z"
            />
            <path
              fill="#FBBC05"
              d="M10.5 28.7A14.5 14.5 0 0 1 9.5 24c0-1.6.3-3.2.8-4.7l-7.9-6.1A24 24 0 0 0 0 24c0 3.9.9 7.5 2.6 10.8l7.9-6.1z"
            />
            <path
              fill="#34A853"
              d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.8 2.3-8.4 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z"
            />
          </svg>
          {cargando ? "Registrando..." : "Registrarme con Google"}
        </button>

        <p className="mt-6 text-center text-sm text-gray-600">
          ¿Ya tenés cuenta?{" "}
          <Link
            to="/login"
            className="font-medium text-indigo-600 hover:text-indigo-700 hover:underline"
          >
            Iniciar sesión
          </Link>
        </p>
      </form>
    </main>
  );
}
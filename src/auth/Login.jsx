import { useState } from "react";
import {
  GoogleAuthProvider,
  deleteUser,
  getAdditionalUserInfo,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { Navigate, useNavigate } from "react-router-dom";
 
import { auth, db } from "../firebase";
import {
  ROLES_CON_ACCESO,
  estaBaneado,
} from "../services/usuariosService";
import { useAuth } from "./useAuth.jsx"; 
 
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });
 
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
      return "No se pudo iniciar sesión con Google.";
  }
}
 
function mensajeErrorReset(error) {
  // Con la protección contra enumeración de correos activada, Firebase NO
  // devuelve "auth/user-not-found": solo llegan errores que no revelan si
  // el correo existe o no.
  switch (error.code) {
    case "auth/invalid-email":
      return "El formato del correo no es válido.";
    case "auth/too-many-requests":
      return "Demasiados intentos. Esperá unos minutos e intentá de nuevo.";
    case "auth/network-request-failed":
      return "Error de red. Revisá tu conexión e intentá de nuevo.";
    default:
      return "No se pudo enviar el correo. Intentá de nuevo.";
  }
}
 
export default function Login() {
  const navigate = useNavigate();
  const { usuario, rol } = useAuth();
 
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
 
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");
  const [cargando, setCargando] = useState(false);
  const [modoReset, setModoReset] = useState(false);
 
  /**
   * Cierra la sesión de un usuario rechazado. Si la cuenta se acaba de
   * crear en este mismo intento de login (Google crea la cuenta antes de
   * que podamos revisar el perfil), también se borra de Authentication
   * para que no quede una cuenta huérfana en el panel de Firebase.
   */
  async function descartarSesion(usuario, esCuentaNueva) {
    if (esCuentaNueva) {
      try {
        await deleteUser(usuario);
        return;
      } catch (error) {
        console.error("No se pudo borrar la cuenta recién creada:", error);
      }
    }
 
    await signOut(auth);
  }
 
  /**
   * Paso común a todos los métodos de acceso: busca el perfil en
   * Firestore, rechaza a los usuarios sin perfil o baneados y
   * redirige según el rol.
   */
  async function entrarConPerfil(usuario, { esCuentaNueva = false } = {}) {
    let datos;
 
    try {
      const usuarioSnap = await getDoc(doc(db, "users", usuario.uid));
 
      if (!usuarioSnap.exists()) {
        await descartarSesion(usuario, esCuentaNueva);
        setError(
          "Tu cuenta no tiene un perfil configurado. Pedile al administrador que te dé de alta.",
        );
        return;
      }
 
      datos = usuarioSnap.data();
    } catch (error) {
      console.error("Error obteniendo el perfil:", error);
      await signOut(auth);
      setError("No se pudo cargar tu perfil. Intentá de nuevo.");
      return;
    }
 
    if (estaBaneado(datos)) {
      await signOut(auth);
      setError("Tu cuenta fue suspendida. Contactá al administrador.");
      return;
    }
 
    navigate(ROLES_CON_ACCESO.includes(datos.rol) ? "/landing" : "/sin-acceso");
  }
 
  async function handleSubmit(event) {
    event.preventDefault();
 
    setError("");
    setCargando(true);
 
    try {
      const credenciales = await signInWithEmailAndPassword(
        auth,
        email,
        password,
      );
 
      await entrarConPerfil(credenciales.user);
    } catch (error) {
      console.error("Error al iniciar sesión:", error);
 
      setError("El correo o la contraseña son incorrectos.");
    } finally {
      setCargando(false);
    }
  }
 
  function cambiarModo(reset) {
    setModoReset(reset);
    setError("");
    setAviso("");
    setPassword("");
  }
 
  async function handleReset(event) {
    event.preventDefault();
 
    setError("");
    setAviso("");
    setCargando(true);
 
    try {
      await sendPasswordResetEmail(auth, email.trim());
 
      // Mensaje genérico: se muestra igual exista o no la cuenta, para no
      // revelar qué correos están registrados.
      setAviso(
        "Si el correo está registrado, te enviamos un enlace para restablecer tu contraseña. Revisá también la carpeta de spam.",
      );
    } catch (error) {
      console.error("Error al enviar el correo de restablecimiento:", error);
 
      setError(mensajeErrorReset(error));
    } finally {
      setCargando(false);
    }
  }
 
  async function handleGoogle() {
    setError("");
    setCargando(true);
 
    try {
      const credenciales = await signInWithPopup(auth, googleProvider);
 
      // true solo si Google acaba de crear la cuenta en este login
      const esCuentaNueva =
        getAdditionalUserInfo(credenciales)?.isNewUser === true;
 
      await entrarConPerfil(credenciales.user, { esCuentaNueva });
    } catch (error) {
      // Si cerró la ventana de Google no es un error que haya que mostrar
      if (
        error.code === "auth/popup-closed-by-user" ||
        error.code === "auth/cancelled-popup-request"
      ) {
        return;
      }
 
      console.error("Error al iniciar sesión con Google:", error);
 
      setError(mensajeErrorGoogle(error));
    } finally {
      setCargando(false);
    }
  }
 
  // Si ya hay sesión activa, no se puede acceder al login
  if (usuario && ROLES_CON_ACCESO.includes(rol)) {
    return <Navigate to="/landing" replace />;
  }
 
  return (
    <>
      <main className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
        <form
          onSubmit={modoReset ? handleReset : handleSubmit}
          className="w-full max-w-md rounded-xl bg-white p-8 shadow-md"
        >
          <h1 className="mb-6 text-2xl font-bold text-gray-900">
            {modoReset ? "Restablecer contraseña" : "Iniciar sesión"}
          </h1>
 
          {modoReset && (
            <p className="mb-4 text-sm text-gray-600">
              Ingresá tu correo y te enviaremos un enlace para crear una nueva
              contraseña.
            </p>
          )}
 
          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Correo electrónico
            </label>
 
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-indigo-500"
              placeholder="correo@ejemplo.com"
              required
            />
          </div>
 
          {!modoReset && (
            <div className="mb-4">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Contraseña
              </label>
 
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-indigo-500"
                placeholder="••••••••"
                required
              />
 
              <div className="mt-2 text-right">
                <button
                  type="button"
                  onClick={() => cambiarModo(true)}
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:underline"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
            </div>
          )}
 
          {error && (
            <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
              {error}
            </p>
          )}
 
          {aviso && (
            <p className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">
              {aviso}
            </p>
          )}
 
          <button
            type="submit"
            disabled={cargando}
            className="w-full rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {modoReset
              ? cargando
                ? "Enviando..."
                : "Enviar enlace"
              : cargando
                ? "Ingresando..."
                : "Iniciar sesión"}
          </button>
 
          {modoReset && (
            <button
              type="button"
              onClick={() => cambiarModo(false)}
              className="mt-4 w-full text-sm font-medium text-gray-600 hover:text-gray-900 hover:underline"
            >
              Volver a iniciar sesión
            </button>
          )}
 
          {!modoReset && (
            <>
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
              {cargando ? "Ingresando..." : "Continuar con Google"}
            </button>
            </>
          )}
        </form>
      </main>
    </>
  );
}
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

import { auth, db } from "../firebase";
import { estaBaneado } from "../services/usuariosService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [rol, setRol] = useState(null);
  const [cargando, setCargando] = useState(true);

  // Lee el perfil de Firestore del usuario de Firebase y actualiza el estado
  const cargarPerfil = useCallback(async (firebaseUser) => {
    if (!firebaseUser) {
      setUsuario(null);
      setRol(null);
      return;
    }

    try {
      const usuarioRef = doc(db, "users", firebaseUser.uid);
      const usuarioSnap = await getDoc(usuarioRef);

      if (usuarioSnap.exists()) {
        const datos = usuarioSnap.data();

        // Usuario baneado por el admin: cerrar sesión
        if (estaBaneado(datos)) {
          await signOut(auth);
          setUsuario(null);
          setRol(null);
          return;
        }

        setUsuario({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          ...datos,
        });

        setRol(datos.rol);
      } else {
        setUsuario({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
        });

        setRol(null);
      }
    } catch (error) {
      console.error("Error obteniendo el usuario:", error);
      setUsuario(null);
      setRol(null);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      await cargarPerfil(firebaseUser);
      setCargando(false);
    });

    return unsubscribe;
  }, [cargarPerfil]);

  // Vuelve a leer el perfil (útil justo después de crearlo en el registro)
  const recargarPerfil = useCallback(
    () => cargarPerfil(auth.currentUser),
    [cargarPerfil],
  );

  return (
    <AuthContext.Provider
      value={{
        usuario,
        rol,
        cargando,
        recargarPerfil,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

import Navbar from "../components/Navbar";
import { useAuth } from "../auth/useAuth.jsx";
 
export default function Landing() {
  const { usuario, rol, cargando } = useAuth();
 
  return (
    <>
      {/* Sin sesión el Navbar muestra "Iniciar sesión" en lugar del rol */}
      {!cargando && <Navbar rol={usuario ? rol : null} />}
 
      <main className="mx-auto max-w-7xl p-6">
        <h1 className="text-3xl font-bold text-gray-900">
          Bienvenido a Kronika
        </h1>
 
        <p className="mt-2 text-gray-600">
          Esta es la página principal.
        </p>
      </main>
    </>
  );
}
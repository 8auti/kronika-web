import { useEffect, useState } from "react";

import { getCursos } from "../../services/cursosService";
import CursoCard from "../../components/CursoCard";
import Navbar from "../../components/Navbar";
import { useAuth } from "../../auth/useAuth";

export default function PanelCursos() {
  const { rol } = useAuth();

  const [cursos, setCursos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function cargarCursos() {
      try {
        const resultado = await getCursos();
        setCursos(resultado);
      } catch (error) {
        console.error(error);
        setError("No se pudieron cargar los cursos.");
      } finally {
        setCargando(false);
      }
    }

    cargarCursos();
  }, []);

  return (
    <>
      <Navbar rol={rol} />

      <main className="mx-auto max-w-7xl p-6">
        <h1 className="mb-6 text-3xl font-bold">
          Cursos
        </h1>

        {cargando && (
          <p>Cargando cursos...</p>
        )}

        {error && (
          <p className="text-red-600">
            {error}
          </p>
        )}

        {!cargando && !error && (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4">
            {cursos.map((curso) => (
              <CursoCard
                key={curso.id}
                curso={curso}
              />
            ))}
          </div>
        )}
      </main>
    </>
  );
}
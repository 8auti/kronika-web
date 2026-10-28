import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MessageSquare } from "lucide-react";

import { getAulas } from "../../services/aulasService";
import { useAuth } from "../../auth/useAuth";

// Paso 1: el profesor elige el aula (foro) a la que quiere entrar.
export default function PanelComunicacion() {
  const { usuario } = useAuth();
  const navigate = useNavigate();

  const [aulas, setAulas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        setAulas(await getAulas(usuario.uid));
      } catch (e) {
        console.error(e);
        setError("No se pudieron cargar las aulas.");
      } finally {
        setCargando(false);
      }
    })();
  }, [usuario.uid]);

  return (
    <main className="mx-auto max-w-7xl p-6">
      <h1 className="text-3xl font-bold">Comunicación</h1>
      <p className="mb-6 mt-1 text-sm text-gray-500">
        Elegí el aula cuyo foro de consultas querés abrir.
      </p>

      {error && <p className="mb-4 text-red-600">{error}</p>}
      {cargando && <p>Cargando aulas...</p>}

      {!cargando && aulas.length === 0 && (
        <p className="text-gray-500">
          Todavía no creaste ningún aula. Creá una en la sección Aulas para
          tener un foro.
        </p>
      )}

      <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4">
        {aulas.map((aula) => (
          <article
            key={aula.id}
            onClick={() => navigate(`/comunicacion/${aula.id}`)}
            className="cursor-pointer rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-lg font-semibold text-gray-900">
                {aula.nombre}
              </h3>
              <MessageSquare className="h-5 w-5 text-indigo-600" />
            </div>
            <p className="mt-2 text-sm text-gray-500">
              Foro de consultas · código{" "}
              <span className="font-mono">{aula.codigo_aula}</span>
            </p>
          </article>
        ))}
      </div>
    </main>
  );
}

import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Send, Trash2 } from "lucide-react";

import { getAula } from "../../services/aulasService";
import {
  eliminarMensaje,
  enviarMensaje,
  escucharMensajes,
  MAX_LARGO_MENSAJE,
} from "../../services/foroService";
import { useAuth } from "../../auth/useAuth";

const btnPrimario =
  "inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-50";

const formatearHora = (ts) =>
  ts?.toDate?.().toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }) ?? "enviando...";

// Paso 2: foro del aula elegida. Mensajes en tiempo real.
export default function ForoAula() {
  const { aulaId } = useParams();
  const { usuario, rol } = useAuth();

  const [aula, setAula] = useState(null);
  const [mensajes, setMensajes] = useState([]);
  const [texto, setTexto] = useState("");
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const [sinPermiso, setSinPermiso] = useState(false);

  const fondoRef = useRef(null);

  // Cargar el aula y validar que sea del profesor logueado
  useEffect(() => {
    (async () => {
      try {
        const data = await getAula(aulaId);
        if (!data || data.profesor_id !== usuario.uid) {
          setSinPermiso(true);
          return;
        }
        setAula(data);
      } catch (e) {
        console.error(e);
        setError("No se pudo cargar el aula.");
      } finally {
        setCargando(false);
      }
    })();
  }, [aulaId, usuario.uid]);

  // Suscripción en tiempo real a los mensajes
  useEffect(() => {
    if (!aula) return;
    return escucharMensajes(
      aulaId,
      setMensajes,
      (e) => {
        console.error(e);
        setError("No se pudieron cargar los mensajes.");
      }
    );
  }, [aula, aulaId]);

  // Bajar al último mensaje cuando llega uno nuevo
  useEffect(() => {
    fondoRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes.length]);

  const enviar = async (e) => {
    e.preventDefault();
    if (!texto.trim() || enviando) return;

    try {
      setEnviando(true);
      setError("");
      await enviarMensaje(aulaId, { texto }, { ...usuario, rol });
      setTexto("");
    } catch (err) {
      console.error(err);
      setError(err.message || "No se pudo enviar el mensaje.");
    } finally {
      setEnviando(false);
    }
  };

  const borrar = async (m) => {
    if (!window.confirm("¿Eliminar este mensaje?")) return;
    try {
      await eliminarMensaje(aulaId, m.id);
    } catch (err) {
      console.error(err);
      setError("No se pudo eliminar el mensaje.");
    }
  };

  if (cargando) return <p className="p-6">Cargando foro...</p>;

  if (sinPermiso) {
    return (
      <main className="p-6">
        <p className="text-red-600">No tenés acceso a este foro.</p>
        <Link to="/comunicacion" className="text-indigo-600 hover:underline">
          Volver a Comunicación
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto flex h-[calc(100vh-4rem)] max-w-4xl flex-col p-6">
      <nav className="mb-3 text-sm text-gray-500">
        <Link to="/comunicacion" className="hover:text-indigo-600">
          Comunicación
        </Link>{" "}
        / <span className="text-gray-900">{aula?.nombre}</span>
      </nav>

      <h1 className="mb-4 text-2xl font-bold">Foro: {aula?.nombre}</h1>

      {error && <p className="mb-2 text-sm text-red-600">{error}</p>}

      <div className="flex-1 space-y-3 overflow-y-auto rounded-xl border border-gray-200 bg-gray-50 p-4">
        {mensajes.length === 0 && (
          <p className="text-center text-sm text-gray-500">
            Todavía no hay mensajes. ¡Escribí el primero!
          </p>
        )}

        {mensajes.map((m) => {
          const mio = m.autor_id === usuario.uid;
          return (
            <div
              key={m.id}
              className={`flex ${mio ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`group max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow-sm ${
                  mio
                    ? "bg-indigo-600 text-white"
                    : "border border-gray-200 bg-white text-gray-900"
                }`}
              >
                <p
                  className={`mb-0.5 text-xs font-semibold ${
                    mio ? "text-indigo-100" : "text-indigo-600"
                  }`}
                >
                  {m.autor_nombre}
                  {m.autor_rol === "profesor" && " · Profesor"}
                </p>
                <p className="whitespace-pre-wrap break-words">{m.texto}</p>
                <div
                  className={`mt-1 flex items-center justify-end gap-2 text-[11px] ${
                    mio ? "text-indigo-200" : "text-gray-400"
                  }`}
                >
                  {formatearHora(m.fecha)}
                  {/* El profesor del aula puede moderar cualquier mensaje */}
                  <button
                    type="button"
                    onClick={() => borrar(m)}
                    title="Eliminar mensaje"
                    className="opacity-0 transition group-hover:opacity-100"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={fondoRef} />
      </div>

      <form onSubmit={enviar} className="mt-3 flex items-end gap-2">
        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) enviar(e);
          }}
          maxLength={MAX_LARGO_MENSAJE}
          rows={2}
          placeholder="Escribí un mensaje (Enter envía, Shift+Enter salto de línea)"
          className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        <button
          type="submit"
          disabled={enviando || !texto.trim()}
          className={btnPrimario}
        >
          <Send className="h-4 w-4" />
          Enviar
        </button>
      </form>
    </main>
  );
}

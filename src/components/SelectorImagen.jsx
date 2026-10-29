import { useRef, useState } from "react";

import { subirImagen, validarImagen } from "../services/imagenesService";

const btn =
  "rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50";
const btnQuitar =
  "rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50";

/**
 * Selector de imagen desde el dispositivo.
 * Sube el archivo a Firebase Storage y guarda la URL resultante.
 *
 * @param {string}   value       URL actual ("" si no hay)
 * @param {(url:string)=>void} onChange
 * @param {string}   carpeta     subcarpeta en Storage
 * @param {(b:boolean)=>void} [onSubiendo]  avisa al padre si hay subida en curso
 */
export default function SelectorImagen({
  value,
  onChange,
  carpeta,
  onSubiendo,
  claseVista = "max-h-40",
}) {
  const inputRef = useRef(null);
  const [progreso, setProgreso] = useState(null); // null = sin subida
  const [error, setError] = useState("");

  const subiendo = progreso !== null;

  const elegir = async (e) => {
    const archivo = e.target.files?.[0];
    e.target.value = ""; // permite volver a elegir el mismo archivo
    if (!archivo) return;

    const problema = validarImagen(archivo);
    if (problema) {
      setError(problema);
      return;
    }

    setError("");
    setProgreso(0);
    onSubiendo?.(true);
    try {
      onChange(await subirImagen(archivo, carpeta, setProgreso));
    } catch (err) {
      console.error(err);
      setError("No se pudo subir la imagen. Probá de nuevo.");
    } finally {
      setProgreso(null);
      onSubiendo?.(false);
    }
  };

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={elegir}
        className="hidden"
      />

      {value && (
        <img
          src={value}
          alt=""
          className={`mb-2 rounded-lg border border-gray-200 object-contain ${claseVista}`}
        />
      )}

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={subiendo}
          className={btn}
        >
          {subiendo
            ? `Subiendo... ${progreso}%`
            : value
              ? "Cambiar imagen"
              : "Elegir imagen"}
        </button>

        {value && !subiendo && (
          <button type="button" onClick={() => onChange("")} className={btnQuitar}>
            Quitar
          </button>
        )}
      </div>

      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

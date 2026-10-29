import { useAuth } from "../../auth/useAuth";
import SelectorImagen from "../SelectorImagen";
import { CARPETAS } from "../../services/imagenesService";
import EditorRetos from "./EditorRetos";
import { inputClase } from "./estilos";

// Nodo jefe: datos del jefe + vidas del jugador + retos de cualquier tipo
export default function EditorJefe({ contenido, onChange, onSubiendo }) {
  const { rol } = useAuth();
  const { jefe, vidasJugador, retos } = contenido;
  // Solo el editor sube imágenes de jefes; el profesor solo la ve
  const puedeSubirImagen = rol === "editor";

  const cambiarJefe = (cambios) =>
    onChange({ ...contenido, jefe: { ...jefe, ...cambios } });

  // Number("") es 0: se guarda NaN para que la validación lo rechace
  const entero = (valor) => (valor === "" ? NaN : Number(valor));

  return (
    <div className="space-y-5">
      <fieldset className="space-y-3 rounded-xl border border-gray-200 p-4">
        <legend className="px-1 text-sm font-medium text-gray-700">Jefe</legend>

        <div className="grid gap-3 sm:grid-cols-[1fr_120px_140px]">
          <label className="block text-sm font-medium text-gray-700">
            Nombre
            <input
              value={jefe.nombre}
              onChange={(e) => cambiarJefe({ nombre: e.target.value })}
              className={`${inputClase} mt-1`}
            />
          </label>

          <label className="block text-sm font-medium text-gray-700">
            Vida del jefe
            <input
              type="number"
              min={1}
              value={Number.isNaN(jefe.vida) ? "" : jefe.vida}
              onChange={(e) => cambiarJefe({ vida: entero(e.target.value) })}
              className={`${inputClase} mt-1`}
            />
          </label>

          <label className="block text-sm font-medium text-gray-700">
            Vidas del jugador
            <input
              type="number"
              min={1}
              value={Number.isNaN(vidasJugador) ? "" : vidasJugador}
              onChange={(e) =>
                onChange({ ...contenido, vidasJugador: entero(e.target.value) })
              }
              className={`${inputClase} mt-1`}
            />
          </label>
        </div>

        <div className="text-sm font-medium text-gray-700">
          <span className="mb-1 block">Imagen del jefe</span>
          {puedeSubirImagen ? (
            <SelectorImagen
              value={jefe.imagen}
              carpeta={CARPETAS.JEFE}
              onChange={(imagen) => cambiarJefe({ imagen })}
              onSubiendo={onSubiendo}
            />
          ) : (
            jefe.imagen && (
              <img
                src={jefe.imagen}
                alt=""
                className="max-h-40 rounded-lg border border-gray-200 object-contain"
              />
            )
          )}
        </div>
      </fieldset>

      <EditorRetos
        retos={retos}
        onChange={(r) => onChange({ ...contenido, retos: r })}
        tipos={["trivia", "emparejar", "ordenar"]}
      />
    </div>
  );
}

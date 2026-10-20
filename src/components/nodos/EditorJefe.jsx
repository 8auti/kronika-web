import EditorRetos from "./EditorRetos";
import { inputClase } from "./estilos";

// Nodo jefe: datos del jefe + vidas del jugador + retos de cualquier tipo
export default function EditorJefe({ contenido, onChange }) {
  const { jefe, vidasJugador, retos } = contenido;

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

        <label className="block text-sm font-medium text-gray-700">
          URL de la imagen del jefe
          <input
            type="url"
            placeholder="https://..."
            value={jefe.imagen}
            onChange={(e) => cambiarJefe({ imagen: e.target.value })}
            className={`${inputClase} mt-1`}
          />
        </label>
      </fieldset>

      <EditorRetos
        retos={retos}
        onChange={(r) => onChange({ ...contenido, retos: r })}
        tipos={["trivia", "emparejar", "ordenar"]}
      />
    </div>
  );
}

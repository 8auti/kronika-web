import { btnEditar, btnLink, btnPeligro, inputClase } from "./estilos";

// Bloques de una lectura: { tipo: "texto", texto } | { tipo: "imagen", url }
export default function EditorLectura({ bloques, onChange }) {
  const cambiar = (i, cambios) =>
    onChange(bloques.map((b, idx) => (idx === i ? { ...b, ...cambios } : b)));

  const quitar = (i) => onChange(bloques.filter((_, idx) => idx !== i));

  const mover = (i, delta) => {
    const j = i + delta;
    if (j < 0 || j >= bloques.length) return;
    const copia = [...bloques];
    [copia[i], copia[j]] = [copia[j], copia[i]];
    onChange(copia);
  };

  return (
    <fieldset>
      <legend className="text-sm font-medium text-gray-700">Bloques</legend>

      <div className="mt-2 space-y-3">
        {bloques.map((b, i) => (
          <div
            key={i}
            className="rounded-lg border border-gray-200 bg-gray-50 p-3"
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs text-indigo-700">
                {b.tipo === "imagen" ? "Imagen" : "Texto"}
              </span>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => mover(i, -1)}
                  disabled={i === 0}
                  className={btnEditar}
                  aria-label="Subir bloque"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => mover(i, 1)}
                  disabled={i === bloques.length - 1}
                  className={btnEditar}
                  aria-label="Bajar bloque"
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => quitar(i)}
                  className={btnPeligro}
                  aria-label="Quitar bloque"
                >
                  ✕
                </button>
              </div>
            </div>

            {b.tipo === "imagen" ? (
              <>
                <input
                  type="url"
                  placeholder="https://..."
                  value={b.url}
                  onChange={(e) => cambiar(i, { url: e.target.value })}
                  className={inputClase}
                />
                {b.url && (
                  <img
                    src={b.url}
                    alt=""
                    className="mt-2 max-h-40 rounded-lg object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                )}
              </>
            ) : (
              <textarea
                rows={4}
                value={b.texto}
                onChange={(e) => cambiar(i, { texto: e.target.value })}
                className={inputClase}
              />
            )}
          </div>
        ))}
      </div>

      <div className="mt-3 flex gap-4">
        <button
          type="button"
          onClick={() => onChange([...bloques, { tipo: "texto", texto: "" }])}
          className={btnLink}
        >
          + Texto
        </button>
        <button
          type="button"
          onClick={() => onChange([...bloques, { tipo: "imagen", url: "" }])}
          className={btnLink}
        >
          + Imagen
        </button>
      </div>
    </fieldset>
  );
}

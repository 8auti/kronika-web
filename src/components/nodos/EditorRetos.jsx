import {
  MAX_RESPUESTAS,
  MIN_ITEMS,
  MIN_PARES,
  MIN_RESPUESTAS,
  TIPOS_RETO,
  etiquetaTipoNodo,
  retoVacio,
  siguienteId,
} from "../../services/cursosService";
import { btnEditar, btnLink, btnPeligro, inputClase } from "./estilos";

/* ------------------------------ TRIVIA ------------------------------ */

function RetoTrivia({ reto, onChange, nombre }) {
  const { respuestas, respuesta_correcta_index: correcta } = reto;

  const cambiarRespuesta = (i, valor) =>
    onChange({
      ...reto,
      respuestas: respuestas.map((r, idx) => (idx === i ? valor : r)),
    });

  const quitarRespuesta = (i) => {
    if (respuestas.length <= MIN_RESPUESTAS) return;
    let nueva = correcta;
    if (i === correcta) nueva = 0;
    else if (i < correcta) nueva -= 1;
    onChange({
      ...reto,
      respuestas: respuestas.filter((_, idx) => idx !== i),
      respuesta_correcta_index: nueva,
    });
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        Pregunta
        <textarea
          rows={2}
          value={reto.pregunta}
          onChange={(e) => onChange({ ...reto, pregunta: e.target.value })}
          className={`${inputClase} mt-1`}
        />
      </label>

      <fieldset>
        <legend className="text-sm font-medium text-gray-700">
          Respuestas{" "}
          <span className="font-normal text-gray-500">(marcá la correcta)</span>
        </legend>

        <div className="mt-2 space-y-2">
          {respuestas.map((r, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="radio"
                name={`correcta-${nombre}`}
                checked={correcta === i}
                onChange={() =>
                  onChange({ ...reto, respuesta_correcta_index: i })
                }
                className="h-4 w-4 accent-indigo-600"
                aria-label={`Respuesta ${i + 1} correcta`}
              />
              <input
                value={r}
                onChange={(e) => cambiarRespuesta(i, e.target.value)}
                placeholder={`Respuesta ${i + 1}`}
                className={inputClase}
              />
              <button
                type="button"
                onClick={() => quitarRespuesta(i)}
                disabled={respuestas.length <= MIN_RESPUESTAS}
                className={btnPeligro}
                aria-label="Quitar respuesta"
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        {respuestas.length < MAX_RESPUESTAS && (
          <button
            type="button"
            onClick={() => onChange({ ...reto, respuestas: [...respuestas, ""] })}
            className={`${btnLink} mt-2`}
          >
            + Agregar respuesta
          </button>
        )}
      </fieldset>
    </div>
  );
}

/* ----------------------------- EMPAREJAR ----------------------------- */

function RetoEmparejar({ reto, onChange }) {
  const { pares } = reto;

  const cambiarPar = (i, cambios) =>
    onChange({
      ...reto,
      pares: pares.map((p, idx) => (idx === i ? { ...p, ...cambios } : p)),
    });

  return (
    <fieldset>
      <legend className="text-sm font-medium text-gray-700">
        Pares{" "}
        <span className="font-normal text-gray-500">
          (cada elemento de la izquierda va con el de la derecha)
        </span>
      </legend>

      <div className="mt-2 space-y-2">
        {pares.map((p, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              value={p.izquierda}
              onChange={(e) => cambiarPar(i, { izquierda: e.target.value })}
              placeholder="Izquierda"
              className={inputClase}
            />
            <span className="text-gray-400">↔</span>
            <input
              value={p.derecha}
              onChange={(e) => cambiarPar(i, { derecha: e.target.value })}
              placeholder="Derecha"
              className={inputClase}
            />
            <button
              type="button"
              onClick={() =>
                onChange({ ...reto, pares: pares.filter((_, idx) => idx !== i) })
              }
              disabled={pares.length <= MIN_PARES}
              className={btnPeligro}
              aria-label="Quitar par"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() =>
          onChange({ ...reto, pares: [...pares, { izquierda: "", derecha: "" }] })
        }
        className={`${btnLink} mt-2`}
      >
        + Agregar par
      </button>
    </fieldset>
  );
}

/* ------------------------------ ORDENAR ------------------------------ */

function RetoOrdenar({ reto, onChange }) {
  const { items } = reto;

  const mover = (i, delta) => {
    const j = i + delta;
    if (j < 0 || j >= items.length) return;
    const copia = [...items];
    [copia[i], copia[j]] = [copia[j], copia[i]];
    onChange({ ...reto, items: copia });
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        Consigna
        <input
          value={reto.consigna}
          onChange={(e) => onChange({ ...reto, consigna: e.target.value })}
          className={`${inputClase} mt-1`}
        />
      </label>

      <fieldset>
        <legend className="text-sm font-medium text-gray-700">
          Ítems{" "}
          <span className="font-normal text-gray-500">
            (cargalos en el orden correcto; al jugador se le mezclan)
          </span>
        </legend>

        <div className="mt-2 space-y-2">
          {items.map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="w-5 text-right text-sm text-gray-500">
                {i + 1}.
              </span>
              <input
                value={item}
                onChange={(e) =>
                  onChange({
                    ...reto,
                    items: items.map((it, idx) =>
                      idx === i ? e.target.value : it
                    ),
                  })
                }
                className={inputClase}
              />
              <button
                type="button"
                onClick={() => mover(i, -1)}
                disabled={i === 0}
                className={btnEditar}
                aria-label="Subir ítem"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => mover(i, 1)}
                disabled={i === items.length - 1}
                className={btnEditar}
                aria-label="Bajar ítem"
              >
                ↓
              </button>
              <button
                type="button"
                onClick={() =>
                  onChange({
                    ...reto,
                    items: items.filter((_, idx) => idx !== i),
                  })
                }
                disabled={items.length <= MIN_ITEMS}
                className={btnPeligro}
                aria-label="Quitar ítem"
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => onChange({ ...reto, items: [...items, ""] })}
          className={`${btnLink} mt-2`}
        >
          + Agregar ítem
        </button>
      </fieldset>
    </div>
  );
}

/* ------------------------------- LISTA ------------------------------- */

/**
 * Lista editable de retos.
 * `tipos`: tipos de reto permitidos. Con un solo tipo (nodos trivia,
 * emparejar, ordenar) no se muestra selector; con varios (jefe) cada reto
 * puede ser de un tipo distinto.
 */
export default function EditorRetos({ retos, onChange, tipos }) {
  const permitidos = TIPOS_RETO.filter((t) => tipos.includes(t.valor));
  const variosTipos = permitidos.length > 1;

  const cambiar = (i, reto) =>
    onChange(retos.map((r, idx) => (idx === i ? reto : r)));

  // Cambiar el tipo de un reto lo reinicia (conserva el id)
  const cambiarTipo = (i, tipo) => cambiar(i, retoVacio(tipo, retos[i].id));

  const agregar = (tipo) =>
    onChange([...retos, retoVacio(tipo, siguienteId("r", retos))]);

  const quitar = (i) => onChange(retos.filter((_, idx) => idx !== i));

  const mover = (i, delta) => {
    const j = i + delta;
    if (j < 0 || j >= retos.length) return;
    const copia = [...retos];
    [copia[i], copia[j]] = [copia[j], copia[i]];
    onChange(copia);
  };

  return (
    <section>
      <h3 className="text-sm font-medium text-gray-700">Retos</h3>

      <div className="mt-2 space-y-4">
        {retos.map((reto, i) => (
          <div
            key={reto.id}
            className="rounded-xl border border-gray-200 bg-gray-50 p-4"
          >
            <div className="mb-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-900">
                  Reto {i + 1}
                </span>
                {variosTipos ? (
                  <select
                    value={reto.tipo}
                    onChange={(e) => cambiarTipo(i, e.target.value)}
                    className="rounded-lg border border-gray-300 px-2 py-1 text-xs"
                    aria-label="Tipo de reto"
                  >
                    {permitidos.map((t) => (
                      <option key={t.valor} value={t.valor}>
                        {t.etiqueta}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs text-indigo-700">
                    {etiquetaTipoNodo(reto.tipo)}
                  </span>
                )}
              </div>

              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => mover(i, -1)}
                  disabled={i === 0}
                  className={btnEditar}
                  aria-label="Subir reto"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => mover(i, 1)}
                  disabled={i === retos.length - 1}
                  className={btnEditar}
                  aria-label="Bajar reto"
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => quitar(i)}
                  disabled={retos.length <= 1}
                  className={btnPeligro}
                  aria-label="Quitar reto"
                >
                  ✕
                </button>
              </div>
            </div>

            {reto.tipo === "emparejar" ? (
              <RetoEmparejar reto={reto} onChange={(r) => cambiar(i, r)} />
            ) : reto.tipo === "ordenar" ? (
              <RetoOrdenar reto={reto} onChange={(r) => cambiar(i, r)} />
            ) : (
              <RetoTrivia
                reto={reto}
                nombre={reto.id}
                onChange={(r) => cambiar(i, r)}
              />
            )}
          </div>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap gap-4">
        {permitidos.map((t) => (
          <button
            key={t.valor}
            type="button"
            onClick={() => agregar(t.valor)}
            className={btnLink}
          >
            + Reto de {t.etiqueta.toLowerCase()}
          </button>
        ))}
      </div>
    </section>
  );
}

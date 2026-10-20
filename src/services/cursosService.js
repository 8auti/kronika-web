import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  increment,
  query,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { db } from "../firebase";

/*
 * ESTRUCTURA
 *
 * cursos/{cursoId}
 *   titulo, descripcion, imagen_url, version, publicado
 *   unidades: [{ id: "u1", titulo, orden }]        (agrupan nodos)
 *   (extras de la app: tipo_creador, aula_id, curso_origen_id)
 *
 * cursos/{cursoId}/nodos/{nodoId}
 *   unidadId, orden, tipo, titulo
 *   + contenido embebido según el tipo:
 *     trivia | emparejar | ordenar -> retos: [...]
 *     lectura                      -> bloques: [...]
 *     jefe                         -> jefe, vidasJugador, retos: [...]
 *
 * El mapa del curso se arma con 1 query a nodos (ordenados por `orden`,
 * agrupados por unidadId en el cliente). Cada cambio de contenido sube
 * `version` del curso para poder invalidar caché / progreso guardado.
 */

/* ============================== TIPOS ============================== */

export const TIPOS_NODO = [
  { valor: "trivia", etiqueta: "Trivia" },
  { valor: "lectura", etiqueta: "Lectura" },
  { valor: "emparejar", etiqueta: "Emparejar" },
  { valor: "ordenar", etiqueta: "Ordenar" },
  { valor: "jefe", etiqueta: "Jefe" },
];

// Tipos de reto (los que pueden ir dentro de `retos`)
export const TIPOS_RETO = TIPOS_NODO.filter((t) =>
  ["trivia", "emparejar", "ordenar"].includes(t.valor)
);

export const etiquetaTipoNodo = (valor) =>
  TIPOS_NODO.find((t) => t.valor === valor)?.etiqueta ?? valor;

export const MIN_RESPUESTAS = 2;
export const MAX_RESPUESTAS = 6;
export const MIN_PARES = 2;
export const MIN_ITEMS = 2;

// Id corto y secuencial ("r1", "r2"...) que no repite los existentes
export function siguienteId(prefijo, existentes) {
  const max = existentes.reduce((m, e) => {
    const id = String(e.id ?? "");
    const n = Number(id.slice(prefijo.length));
    return id.startsWith(prefijo) && Number.isFinite(n) ? Math.max(m, n) : m;
  }, 0);
  return `${prefijo}${max + 1}`;
}

export function retoVacio(tipo, id) {
  switch (tipo) {
    case "emparejar":
      return {
        id,
        tipo,
        pares: [
          { izquierda: "", derecha: "" },
          { izquierda: "", derecha: "" },
        ],
      };
    case "ordenar":
      return { id, tipo, consigna: "", items: ["", ""] };
    default:
      return {
        id,
        tipo: "trivia",
        pregunta: "",
        respuestas: ["", ""],
        respuesta_correcta_index: 0,
      };
  }
}

// Completa un reto cargado de Firestore que puede venir incompleto (sin id,
// sin tipo o sin alguno de sus campos) para que el editor nunca falle.
// `usados` evita ids repetidos dentro del mismo nodo.
export function normalizarReto(reto, tipoPorDefecto, usados) {
  const tiposValidos = ["trivia", "emparejar", "ordenar"];
  const tipo = tiposValidos.includes(reto?.tipo)
    ? reto.tipo
    : tiposValidos.includes(tipoPorDefecto)
      ? tipoPorDefecto
      : "trivia";

  let id = reto?.id;
  if (!id || usados.has(id)) {
    id = siguienteId("r", [...usados].map((u) => ({ id: u })));
  }
  usados.add(id);

  const base = retoVacio(tipo, id);
  const completo = { ...base, ...reto, id, tipo };

  // Los campos de lista deben ser arrays (pueden venir null o con otro tipo)
  for (const campo of ["respuestas", "pares", "items"]) {
    if (campo in base && !Array.isArray(completo[campo])) {
      completo[campo] = base[campo];
    }
  }
  if (tipo === "trivia" && !Number.isInteger(completo.respuesta_correcta_index)) {
    completo.respuesta_correcta_index = 0;
  }
  return completo;
}

export function normalizarRetos(retos, tipoPorDefecto) {
  const usados = new Set();
  return (Array.isArray(retos) ? retos : []).map((r) =>
    normalizarReto(r, tipoPorDefecto, usados)
  );
}

// Contenido inicial de un nodo recién creado, según su tipo
export function contenidoVacio(tipo) {
  switch (tipo) {
    case "lectura":
      return { bloques: [{ tipo: "texto", texto: "" }] };
    case "jefe":
      return {
        jefe: { nombre: "", imagen: "", vida: 100 },
        vidasJugador: 3,
        retos: [retoVacio("trivia", "r1")],
      };
    default:
      return { retos: [retoVacio(tipo, "r1")] };
  }
}

/* ============================ VALIDACIÓN ============================ */

const vacio = (s) => !String(s ?? "").trim();

function validarReto(reto, n) {
  const pre = `Reto ${n}: `;
  switch (reto.tipo) {
    case "trivia": {
      if (vacio(reto.pregunta)) return `${pre}escribí la pregunta.`;
      if ((reto.respuestas?.length ?? 0) < MIN_RESPUESTAS)
        return `${pre}necesita al menos ${MIN_RESPUESTAS} respuestas.`;
      if (reto.respuestas.some(vacio))
        return `${pre}completá todas las respuestas o quitá las que sobren.`;
      const i = reto.respuesta_correcta_index;
      if (!Number.isInteger(i) || i < 0 || i >= reto.respuestas.length)
        return `${pre}marcá la respuesta correcta.`;
      return null;
    }
    case "emparejar":
      if ((reto.pares?.length ?? 0) < MIN_PARES)
        return `${pre}necesita al menos ${MIN_PARES} pares.`;
      if (reto.pares.some((p) => vacio(p.izquierda) || vacio(p.derecha)))
        return `${pre}completá ambos lados de todos los pares.`;
      return null;
    case "ordenar":
      if (vacio(reto.consigna)) return `${pre}escribí la consigna.`;
      if ((reto.items?.length ?? 0) < MIN_ITEMS)
        return `${pre}necesita al menos ${MIN_ITEMS} ítems.`;
      if (reto.items.some(vacio))
        return `${pre}completá todos los ítems o quitá los que sobren.`;
      return null;
    default:
      return `${pre}tipo de reto desconocido.`;
  }
}

/** Devuelve un mensaje de error, o null si el contenido es válido. */
export function validarContenido(tipo, contenido) {
  if (tipo === "lectura") {
    const bloques = contenido.bloques ?? [];
    if (bloques.length === 0) return "Agregá al menos un bloque.";
    for (const [i, b] of bloques.entries()) {
      if (b.tipo === "texto" && vacio(b.texto))
        return `Bloque ${i + 1}: escribí el texto.`;
      if (b.tipo === "imagen" && vacio(b.url))
        return `Bloque ${i + 1}: falta la URL de la imagen.`;
    }
    return null;
  }

  if (tipo === "jefe") {
    const { jefe, vidasJugador } = contenido;
    if (vacio(jefe?.nombre)) return "El jefe necesita un nombre.";
    if (!Number.isInteger(jefe.vida) || jefe.vida < 1)
      return "La vida del jefe debe ser un entero mayor a 0.";
    if (!Number.isInteger(vidasJugador) || vidasJugador < 1)
      return "Las vidas del jugador deben ser un entero mayor a 0.";
  }

  const retos = contenido.retos ?? [];
  if (retos.length === 0) return "Agregá al menos un reto.";
  for (const [i, r] of retos.entries()) {
    const error = validarReto(r, i + 1);
    if (error) return error;
  }
  return null;
}

// Recorta espacios y deja solo los campos que corresponden al tipo
export function limpiarContenido(tipo, contenido) {
  const t = (s) => String(s ?? "").trim();

  const limpiarReto = (r) => {
    switch (r.tipo) {
      case "emparejar":
        return {
          id: r.id,
          tipo: "emparejar",
          pares: r.pares.map((p) => ({
            izquierda: t(p.izquierda),
            derecha: t(p.derecha),
          })),
        };
      case "ordenar":
        return {
          id: r.id,
          tipo: "ordenar",
          consigna: t(r.consigna),
          items: r.items.map(t),
        };
      default:
        return {
          id: r.id,
          tipo: "trivia",
          pregunta: t(r.pregunta),
          respuestas: r.respuestas.map(t),
          respuesta_correcta_index: r.respuesta_correcta_index,
        };
    }
  };

  if (tipo === "lectura") {
    return {
      bloques: contenido.bloques.map((b) =>
        b.tipo === "imagen"
          ? { tipo: "imagen", url: t(b.url) }
          : { tipo: "texto", texto: t(b.texto) }
      ),
    };
  }

  if (tipo === "jefe") {
    return {
      jefe: {
        nombre: t(contenido.jefe.nombre),
        imagen: t(contenido.jefe.imagen),
        vida: contenido.jefe.vida,
      },
      vidasJugador: contenido.vidasJugador,
      retos: contenido.retos.map(limpiarReto),
    };
  }

  return { retos: contenido.retos.map(limpiarReto) };
}

/* ============================== ORDEN =============================== */

/**
 * Valida el campo `orden` de una unidad o de un nodo.
 * - entero mayor o igual a 1
 * - único: ningún otro elemento de `items` puede tener el mismo orden
 *   (el mapa se ordena por este número, así que repetirlo deja el orden
 *   ambiguo). `excluirId` es el elemento que se está editando.
 * Devuelve un mensaje de error o null.
 */
export function validarOrden(valor, items, excluirId = null) {
  const n = typeof valor === "number" ? valor : Number(String(valor).trim());
  if (String(valor).trim() === "" || !Number.isInteger(n) || n < 1)
    return "El orden debe ser un número entero mayor a 0.";

  const choque = items.find((i) => i.id !== excluirId && i.orden === n);
  if (choque)
    return `El orden ${n} ya lo usa "${choque.titulo}". Elegí otro número.`;
  return null;
}

/* ============================== CURSOS ============================== */

const cursoRef = (cursoId) => doc(db, "cursos", cursoId);
const nodosRef = (cursoId) => collection(db, "cursos", cursoId, "nodos");

// Campos que lleva todo curso nuevo (también los cursos creados en un aula)
export function datosCursoNuevo({ titulo, descripcion, imagen_url }) {
  return {
    titulo,
    descripcion,
    imagen_url,
    version: 1,
    publicado: false,
    unidades: [],
  };
}

// Título del curso; los cursos viejos usaban `nombre`
export const tituloCurso = (curso) => curso?.titulo ?? curso?.nombre ?? "";

// Cursos de Kronika (los del editor). Los cursos que un profesor crea o
// copia dentro de un aula tienen aula_id y no se listan acá.
export async function getCursos() {
  const snapshot = await getDocs(query(collection(db, "cursos")));
  return snapshot.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((c) => !c.aula_id);
}

export async function getCurso(cursoId) {
  const snap = await getDoc(cursoRef(cursoId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

// tipo_creador se toma del rol del usuario logueado (no lo escribe el editor)
export async function crearCurso(datos, tipoCreador) {
  return addDoc(collection(db, "cursos"), {
    ...datosCursoNuevo(datos),
    tipo_creador: tipoCreador,
  });
}

// Al editar no se toca tipo_creador, unidades ni publicado
export async function actualizarCurso(
  cursoId,
  { titulo, descripcion, imagen_url }
) {
  return updateDoc(cursoRef(cursoId), {
    titulo,
    descripcion,
    imagen_url,
    version: increment(1),
  });
}

export async function setPublicado(cursoId, publicado) {
  return updateDoc(cursoRef(cursoId), { publicado, version: increment(1) });
}

async function borrarRefs(refs) {
  // Lotes de hasta 400 operaciones (el máximo de Firestore es 500)
  for (let i = 0; i < refs.length; i += 400) {
    const batch = writeBatch(db);
    refs.slice(i, i + 400).forEach((ref) => batch.delete(ref));
    await batch.commit();
  }
}

// Firestore no borra subcolecciones solo: nodos -> curso
export async function eliminarCurso(cursoId) {
  const nodos = await getDocs(nodosRef(cursoId));
  await borrarRefs(nodos.docs.map((d) => d.ref));
  await deleteDoc(cursoRef(cursoId));
}

/* ============================== UNIDADES ============================== */
// Viven como array dentro del doc del curso: se leen junto con el curso.

export const unidadesOrdenadas = (curso) =>
  [...(curso?.unidades ?? [])].sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0));

// Crea la unidad (sin id) o actualiza una existente (con id)
export async function guardarUnidad(cursoId, unidades, { id, titulo, orden }) {
  const nuevas = id
    ? unidades.map((u) => (u.id === id ? { ...u, titulo, orden } : u))
    : [...unidades, { id: siguienteId("u", unidades), titulo, orden }];

  return updateDoc(cursoRef(cursoId), {
    unidades: nuevas,
    version: increment(1),
  });
}

// Los nodos de la unidad NO se borran: quedan sin unidad (unidadId: null)
// y el editor los muestra en "Nodos sin unidad". Primero se quita la unidad
// del curso: si algo falla después, los nodos igual aparecen como sin unidad
// porque apuntan a una unidad que ya no existe.
export async function eliminarUnidad(cursoId, unidades, unidadId) {
  await updateDoc(cursoRef(cursoId), {
    unidades: unidades.filter((u) => u.id !== unidadId),
    version: increment(1),
  });

  const nodos = await getNodos(cursoId);
  const afectados = nodos.filter((n) => n.unidadId === unidadId);

  // Lotes de hasta 400 operaciones (el máximo de Firestore es 500)
  for (let i = 0; i < afectados.length; i += 400) {
    const batch = writeBatch(db);
    afectados.slice(i, i + 400).forEach((n) => {
      batch.update(doc(nodosRef(cursoId), n.id), { unidadId: null });
    });
    await batch.commit();
  }
}

/* ============================== NODOS ============================== */

// Se ordena en el cliente para no requerir un índice en Firestore
export async function getNodos(cursoId) {
  const snapshot = await getDocs(nodosRef(cursoId));
  return snapshot.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0));
}

export async function getNodo(cursoId, nodoId) {
  const snap = await getDoc(doc(nodosRef(cursoId), nodoId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

// Crea el nodo con contenido vacío del tipo elegido y sube la versión
export async function crearNodo(cursoId, { unidadId, orden, tipo, titulo }) {
  const ref = doc(nodosRef(cursoId));
  const batch = writeBatch(db);
  batch.set(ref, { unidadId, orden, tipo, titulo, ...contenidoVacio(tipo) });
  batch.update(cursoRef(cursoId), { version: increment(1) });
  await batch.commit();
  return ref;
}

// `datos` puede incluir titulo, unidadId, orden y el contenido del tipo.
// El tipo no se cambia: cada nodo guarda un contenido distinto según su tipo.
export async function actualizarNodo(cursoId, nodoId, datos) {
  const batch = writeBatch(db);
  batch.update(doc(nodosRef(cursoId), nodoId), datos);
  batch.update(cursoRef(cursoId), { version: increment(1) });
  await batch.commit();
}

export async function eliminarNodo(cursoId, nodoId) {
  const batch = writeBatch(db);
  batch.delete(doc(nodosRef(cursoId), nodoId));
  batch.update(cursoRef(cursoId), { version: increment(1) });
  await batch.commit();
}

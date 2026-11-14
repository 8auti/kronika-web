const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { onDocumentWritten } = require("firebase-functions/v2/firestore");
const { setGlobalOptions } = require("firebase-functions/v2");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore, FieldValue, Timestamp } = require("firebase-admin/firestore");
const { isDeepStrictEqual } = require("util");

initializeApp();
const db = getFirestore();
setGlobalOptions({ region: "southamerica-east1", maxInstances: 10 });

// ---- Ajustes que el equipo puede tocar ----
const MAX_VIDAS = 5;
// jefe: solo se usa si el nodo no trae jefe.recompensa_xp
const XP_POR_TIPO = { lectura: 5, trivia: 10, ordenar: 15, emparejar: 15, jefe: 100 };
const PLAN_ILIMITADO = "premium"; // <- poné el valor real del campo "plan" con vidas infinitas
// Horas que tarda en regenerarse una vida (RF-37). Es el valor por defecto: si existe el documento
// config/juego con el campo numérico "horas_regeneracion_vida", ese valor lo reemplaza (sin redeploy).
const HORAS_REGENERACION_VIDA = 1;
const ZONA = "America/Argentina/Buenos_Aires";

// ---- Auxiliares ----
function diaLocal(fecha) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: ZONA }).format(fecha); // AAAA-MM-DD
}

// Opción A: +1 si la última actividad fue ayer, se mantiene si fue hoy, vuelve a 1 si no.
function calcularRacha(user, ahora) {
  const actual = user.racha_dias || 0;
  if (!user.fecha_ultima_actividad) return 1;
  const ultimo = diaLocal(user.fecha_ultima_actividad.toDate());
  if (ultimo === diaLocal(ahora)) return Math.max(actual, 1);
  if (ultimo === diaLocal(new Date(ahora.getTime() - 24 * 3600 * 1000))) return actual + 1;
  return 1;
}

// ---- Contrato de retos: tiene que dar EXACTAMENTE lo mismo que LogicaRetos.kt en la app ----
const TIPOS_RETO = ["trivia", "ordenar", "emparejar"];

// El tipo de cada reto manda: un nodo (sobre todo un jefe) puede mezclar tipos de reto.
// Sin "tipo" explícito: en un jefe se deduce de los datos; en el resto vale el tipo del nodo.
function tipoDeReto(reto, tipoNodo) {
  if (!reto) return "";
  if (TIPOS_RETO.includes(reto.tipo)) return reto.tipo;
  if (tipoNodo !== "jefe") return tipoNodo;
  if (Array.isArray(reto.pares) && reto.pares.length > 0) return "emparejar";
  if (Array.isArray(reto.items) && reto.items.length > 0) return "ordenar";
  return "trivia";
}

// Acepta números y también números guardados como texto ("10"); undefined si no es un número.
function aNumero(v) {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "" && Number.isFinite(Number(v))) return Number(v);
  return undefined;
}

// Acepta los nombres del panel y los de las pruebas manuales
function indiceCorrecto(reto) {
  return aNumero(reto.respuesta_correcta_index ?? reto.correcta_index);
}

const noVacio = (t) => typeof t === "string" && t.trim() !== "";

// Un reto mal formado no cuenta: ni se juega en la app ni se exige en el servidor.
function retoValido(reto, tipoNodo) {
  switch (tipoDeReto(reto, tipoNodo)) {
    case "trivia": {
      const ops = reto.respuestas;
      const idx = indiceCorrecto(reto);
      return noVacio(reto.pregunta) && Array.isArray(ops) && ops.length >= 2 &&
        Number.isInteger(idx) && idx >= 0 && idx < ops.length;
    }
    case "ordenar":
      return Array.isArray(reto.items) && reto.items.length >= 2 && reto.items.every(noVacio);
    case "emparejar": {
      const p = reto.pares;
      return Array.isArray(p) && p.length >= 2 &&
        p.every((x) => x && noVacio(x.izquierda) && noVacio(x.derecha)) &&
        new Set(p.map((x) => x.izquierda)).size === p.length;
    }
    default:
      return false;
  }
}

const MAX_RESPUESTAS = 200; // tope de respuestas por envío (un duelo puede repetir retos)

// Lee las horas de regeneración desde config/juego (cacheado 60 s para no leer en cada llamada)
const cacheConfig = { at: 0, ms: HORAS_REGENERACION_VIDA * 3600 * 1000 };
async function intervaloVidaMs() {
  const ahora = Date.now();
  if (ahora - cacheConfig.at < 60 * 1000) return cacheConfig.ms;
  let horas = HORAS_REGENERACION_VIDA;
  try {
    const snap = await db.collection("config").doc("juego").get();
    const h = snap.exists ? snap.data().horas_regeneracion_vida : undefined;
    if (typeof h === "number" && h > 0 && h <= 168) horas = h; // entre 0 y 1 semana
  } catch (e) {
    console.warn("No se pudo leer config/juego, uso el valor por defecto", e);
  }
  cacheConfig.at = ahora;
  cacheConfig.ms = horas * 3600 * 1000;
  return cacheConfig.ms;
}

// Regeneración perezosa: no hay ningún proceso corriendo, la cuenta se hace cuando se necesita.
// Campos del usuario: vidas (número guardado) y vidas_actualizadas_at (desde cuándo se cuenta).
// La app tiene que usar esta misma fórmula para mostrar las vidas y el contador.
function calcularVidas(user, ahora, intervaloMs) {
  const guardadas = Math.min(MAX_VIDAS, Math.max(0, user.vidas ?? MAX_VIDAS));
  if (guardadas >= MAX_VIDAS) return { vidas: MAX_VIDAS, ancla: null };
  const ancla = user.vidas_actualizadas_at ? user.vidas_actualizadas_at.toDate() : ahora;
  const ganadas = Math.floor((ahora.getTime() - ancla.getTime()) / intervaloMs);
  const vidas = Math.min(MAX_VIDAS, guardadas + ganadas);
  if (vidas >= MAX_VIDAS) return { vidas, ancla: null };
  // se conserva el resto de tiempo ya transcurrido para la próxima vida
  return { vidas, ancla: new Date(ancla.getTime() + ganadas * intervaloMs) };
}

// Quién tiene vidas limitadas: solo rol "usuario" con plan distinto del ilimitado.
function esLimitada(user) {
  return user.rol === "usuario" && user.plan !== PLAN_ILIMITADO;
}

// Errores de UN reto. El cliente manda "fallos" (intentos fallidos dentro del reto: ordenar con
// reintentos, pares mal armados en emparejar). Si además la respuesta final es incorrecta
// (se quedó sin vidas a mitad del reto) ese último fallo YA viene contado en "fallos",
// por eso se toma el máximo y no la suma.
function erroresDeReto(correcta, fallos) {
  const f = Number.isInteger(fallos) && fallos > 0 ? Math.min(fallos, 50) : 0;
  return Math.max(f, correcta ? 0 : 1);
}

// Id de intento que genera la app al abrir un nodo (para no cobrar dos veces los fallos)
const ID_INTENTO = /^[A-Za-z0-9_-]{8,64}$/;

function esCorrecta(tipo, reto, valor) {
  switch (tipo) {
    case "trivia": {
      // acepta los nombres del panel y los de las pruebas manuales; tolera números guardados como texto
      const correcta = indiceCorrecto(reto);
      return Number.isInteger(valor) && valor === correcta;
    }
    case "ordenar":
      return Array.isArray(valor) && Array.isArray(reto.items) &&
        valor.length === reto.items.length && valor.every((v, i) => v === reto.items[i]);
    case "emparejar": {
      const pares = Array.isArray(reto.pares) ? reto.pares : [];
      if (!Array.isArray(valor) || valor.length !== pares.length) return false;
      const izquierdas = new Set(valor.map((p) => p && p.izquierda));
      return izquierdas.size === pares.length &&
        valor.every((p) => p && pares.some((q) => q.izquierda === p.izquierda && q.derecha === p.derecha));
    }
    default:
      return false;
  }
}

// ---- Función principal ----
exports.completarNodo = onCall(async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Iniciá sesión.");
  const uid = request.auth.uid;
  const { cursoId, nodoId, respuestas, intentoId } = request.data || {};
  if (typeof cursoId !== "string" || typeof nodoId !== "string") {
    throw new HttpsError("invalid-argument", "Faltan cursoId o nodoId.");
  }
  const intentoValido = typeof intentoId === "string" && ID_INTENTO.test(intentoId);

  return db.runTransaction(async (tx) => {
    const userRef = db.doc(`users/${uid}`);
    const cursoRef = db.doc(`cursos/${cursoId}`);
    const nodoRef = cursoRef.collection("nodos").doc(nodoId);
    const progRef = userRef.collection("progreso").doc(cursoId);
    const intentoRef = intentoValido ? userRef.collection("intentos").doc(intentoId) : null;
    const snaps = await tx.getAll(userRef, cursoRef, nodoRef, progRef, ...(intentoRef ? [intentoRef] : []));
    const [userSnap, cursoSnap, nodoSnap, progSnap] = snaps;
    // vidas que ya se descontaron durante este intento con registrarFallo
    const cobrados = intentoRef && snaps[4].exists ? Number(snaps[4].data().cobrados) || 0 : 0;

    if (!userSnap.exists) throw new HttpsError("permission-denied", "Perfil inexistente.");
    if (!cursoSnap.exists || !nodoSnap.exists) throw new HttpsError("not-found", "Curso o nodo inexistente.");
    const user = userSnap.data();
    const curso = cursoSnap.data();
    const nodo = nodoSnap.data();

    if (user.estado === "suspendido" || user.activo === false) {
      throw new HttpsError("permission-denied", "Cuenta suspendida.");
    }
    if (curso.publicado === false) throw new HttpsError("failed-precondition", "Curso no publicado.");

    // ---- Rol y acceso ----
    const esUsuario = user.rol === "usuario";
    const esAlumno = user.rol === "alumno";
    if (!esUsuario && !esAlumno) throw new HttpsError("permission-denied", "Tu rol no completa nodos.");

    const aulaId = curso.aula_id || null;
    if (esUsuario && aulaId) throw new HttpsError("permission-denied", "Ese curso es de un aula.");
    if (esAlumno) {
      if (!aulaId || nodo.tipo === "jefe") {
        throw new HttpsError("permission-denied", "Nodo no disponible para alumnos.");
      }
      const insc = await tx.get(
        db.collection("inscripcion_aula")
          .where("alumno_id", "==", uid).where("aula_id", "==", aulaId).limit(1)
      );
      if (insc.empty) throw new HttpsError("permission-denied", "No estás inscripto en esa aula.");
    }

    // ---- Desbloqueo ----
    const previos = (progSnap.exists && progSnap.data().nodos) || {};
    const requiere = Array.isArray(nodo.requiere) ? nodo.requiere : [];
    const pendientes = requiere.filter((id) => !(previos[id] && previos[id].completado));
    if (pendientes.length > 0) {
      // Un prerrequisito que ya no existe (borrado) no debe bloquear a nadie
      const refs = pendientes.map((id) => cursoRef.collection("nodos").doc(id));
      const snapsPrev = await tx.getAll(...refs);
      const bloqueantes = pendientes.filter((id, i) => snapsPrev[i].exists);
      if (bloqueantes.length > 0) {
        throw new HttpsError("failed-precondition", `Nodo bloqueado: falta completar ${bloqueantes[0]}.`);
      }
    }

    const tipo = nodo.tipo;
    const retos = Array.isArray(nodo.retos) ? nodo.retos : [];
    const limitada = esUsuario && user.plan !== PLAN_ILIMITADO; // vidas de la cuenta limitadas
    const ahora = new Date();
    const intervaloMs = await intervaloVidaMs();
    const regen = limitada ? calcularVidas(user, ahora, intervaloMs) : null;
    const vidasIniciales = limitada ? regen.vidas : null;
    // vidas que tenía el usuario al arrancar el intento (las de ahora + las ya cobradas con registrarFallo)
    const vidasAlInicio = limitada ? Math.min(MAX_VIDAS, vidasIniciales + cobrados) : null;

    if (limitada && tipo !== "lectura" && vidasIniciales <= 0) {
      // No se lanza error: hay que guardar desde cuándo corre el contador (si no, nunca regenera)
      const anclaSinVidas = regen.ancla || ahora;
      if (!user.vidas_actualizadas_at) {
        tx.update(userRef, { vidas: 0, vidas_actualizadas_at: Timestamp.fromDate(anclaSinVidas) });
      }
      if (intentoRef) tx.delete(intentoRef); // el intento ya quedó liquidado
      return {
        completado: false,
        motivo: "sin_vidas",
        estrellas: null,
        xpGanado: 0,
        vidas: 0,
        proximaVidaEn: anclaSinVidas.getTime() + intervaloMs,
        racha: null,
        jefeVencido: false,
        coleccionablesNuevos: [],
      };
    }

    // ---- Evaluación ----
    let errores = 0;
    let jefeVencido = false;
    let sinVidas = false;
    let derrota = false;

    if (tipo !== "lectura") {
      if (!["trivia", "ordenar", "emparejar", "jefe"].includes(tipo)) {
        throw new HttpsError("invalid-argument", `Tipo de nodo no soportado: ${tipo}`);
      }
      // Solo cuentan los retos bien formados (la app descarta los demás y manda su índice original)
      const indicesValidos = new Set(retos.map((_, i) => i).filter((i) => retoValido(retos[i], tipo)));
      const totalValidos = indicesValidos.size;
      if (totalValidos === 0) throw new HttpsError("internal", "El nodo no tiene retos válidos.");
      if (!Array.isArray(respuestas) || respuestas.length === 0 || respuestas.length > MAX_RESPUESTAS) {
        throw new HttpsError("invalid-argument", "Faltan respuestas.");
      }
      const vistos = new Set();
      for (const r of respuestas) {
        // En un duelo un reto fallado vuelve a preguntarse, así que ahí puede repetirse
        const valido = r && Number.isInteger(r.reto) && indicesValidos.has(r.reto) &&
          (tipo === "jefe" || !vistos.has(r.reto));
        if (!valido) throw new HttpsError("invalid-argument", "Respuestas inválidas.");
        vistos.add(r.reto);
      }

      if (tipo === "jefe") {
        const jefe = nodo.jefe || {};
        const vidaTotal = aNumero(jefe.vida_total ?? jefe.vida);
        if (!(vidaTotal > 0)) throw new HttpsError("internal", "Jefe mal configurado: falta la vida.");
        // Si no hay daño definido (o no es positivo), acertar todos los retos válidos mata al jefe justo
        const danioConfig = aNumero(jefe.danio_por_respuesta ?? jefe.danio);
        const danio = danioConfig > 0 ? danioConfig : Math.ceil(vidaTotal / totalValidos);
        // RF-52: las vidas del duelo son las de la cuenta
        const vidasMax = limitada ? vidasAlInicio : Infinity;

        let vidaJefe = vidaTotal;
        for (const r of respuestas) {
          const reto = retos[r.reto];
          const ok = esCorrecta(tipoDeReto(reto, tipo), reto, r.valor);
          if (ok) vidaJefe -= danio;
          errores += erroresDeReto(ok, r.fallos);
          if (vidaJefe <= 0) { jefeVencido = true; break; }
          if (errores >= vidasMax) { sinVidas = true; break; }
        }
        if (!jefeVencido && !sinVidas) {
          if (respuestas.length < totalValidos) {
            throw new HttpsError("failed-precondition", "El duelo no terminó.");
          }
          derrota = true; // contestó todo y el jefe sigue vivo
        }
      } else {
        for (const r of respuestas) {
          const reto = retos[r.reto];
          const ok = esCorrecta(tipoDeReto(reto, tipo), reto, r.valor);
          errores += erroresDeReto(ok, r.fallos);
        }
        sinVidas = limitada && errores >= vidasAlInicio;
        // Solo se acepta una tanda incompleta si fue porque se acabaron las vidas
        if (!sinVidas && respuestas.length !== totalValidos) {
          throw new HttpsError("invalid-argument", "Hay que responder todos los retos.");
        }
      }
    }

    const completado = !sinVidas && !derrota && (tipo !== "jefe" || jefeVencido);
    const motivo = completado ? null : (sinVidas ? "sin_vidas" : "derrota");
    const estrellas = tipo === "lectura" ? null : errores === 0 ? 3 : errores === 1 ? 2 : 1;
    const previo = previos[nodoId] || null;
    const yaCompletado = !!(previo && previo.completado);
    const ts = Timestamp.fromDate(ahora);

    // Solo se cobra lo que todavía no se descontó con registrarFallo (también al repetir un nodo)
    const erroresPorCobrar = Math.max(0, errores - cobrados);
    const vidasFinales = limitada ? Math.max(0, vidasIniciales - erroresPorCobrar) : null;
    // Hora desde la que corre el contador de la próxima vida
    let anclaFinal = null;
    if (limitada && vidasFinales < MAX_VIDAS) {
      anclaFinal = (erroresPorCobrar > 0 && regen.ancla === null) ? ahora : (regen.ancla || ahora);
    }
    const xpGanado = completado && !yaCompletado && esUsuario
      ? (tipo === "jefe" ? (nodo.jefe?.recompensa_xp ?? XP_POR_TIPO.jefe) : (XP_POR_TIPO[tipo] || 0))
      : 0;
    const racha = completado && esUsuario ? calcularRacha(user, ahora) : null;

    // ---- Coleccionables: al vencer a un jefe se otorga la carta cuya condición apunta a este nodo ----
    // (es una lectura, así que va antes de las escrituras)
    const cartasNuevas = []; // { id, datos }
    if (completado && esUsuario && tipo === "jefe") {
      const catalogo = await tx.get(
        db.collection("coleccionables").where("condicion.nodo_id", "==", nodoId)
      );
      const yaTiene = user.coleccionables_obtenidos || {};
      for (const c of catalogo.docs) {
        const carta = c.data();
        if (carta.activa === false) continue;                       // carta desactivada
        if (!carta.condicion || carta.condicion.tipo !== "jefe") continue;
        if (yaTiene[c.id]) continue;                                // no se repite
        cartasNuevas.push({ id: c.id, datos: carta });
      }
    }

    // ---- Escrituras (todas después de las lecturas) ----
    const cambiosUser = {};
    for (const { id } of cartasNuevas) {
      // clave con punto = campo anidado: escribe solo esa carta, sin pisar las demás
      cambiosUser[`coleccionables_obtenidos.${id}`] = { fecha_obtenido: ts, origen: "jefe" };
    }
    // También se guarda la hora de arranque si el usuario está por debajo del máximo y todavía no la tiene
    // Se guarda el valor ya regenerado cada vez que cambia, para que el perfil no quede desactualizado.
    const faltaAncla = limitada && vidasFinales < MAX_VIDAS && !user.vidas_actualizadas_at;
    const cambioVidas = limitada && vidasFinales !== (user.vidas ?? MAX_VIDAS);
    if (limitada && (erroresPorCobrar > 0 || faltaAncla || cambioVidas)) {
      cambiosUser.vidas = vidasFinales;
      // al llegar al máximo ya no hay contador corriendo
      cambiosUser.vidas_actualizadas_at = anclaFinal ? Timestamp.fromDate(anclaFinal) : FieldValue.delete();
    }
    if (completado && esUsuario) {
      cambiosUser.racha_dias = racha;
      cambiosUser.fecha_ultima_actividad = ts;
      if (xpGanado > 0) {
        cambiosUser.xp = FieldValue.increment(xpGanado);
        cambiosUser.puntos_liga_semana = FieldValue.increment(xpGanado);
      }
    }
    if (Object.keys(cambiosUser).length > 0) tx.update(userRef, cambiosUser);
    if (intentoRef) tx.delete(intentoRef); // el intento ya quedó liquidado

    if (completado) {
      const dato = {};
      if (!yaCompletado) { dato.completado = true; dato.fecha = ts; }
      const estrellasPrevias = (previo && previo.estrellas) || 0;
      if (estrellas !== null && estrellas > estrellasPrevias) dato.estrellas = estrellas;

      const cambios = {
        curso_version: curso.version ?? 1,
        ultimo_nodo_id: nodoId,
        ultima_actividad: ts,
      };
      if (aulaId) cambios.aula_id = aulaId;
      if (Object.keys(dato).length > 0) cambios.nodos = { [nodoId]: dato };
      tx.set(progRef, cambios, { merge: true });
    }

    return {
      completado,
      motivo,
      estrellas: completado ? estrellas : null,
      xpGanado,
      vidas: vidasFinales,
      // cuándo llega la próxima vida (ms desde epoch), o null si está al máximo o es plan pago
      proximaVidaEn: anclaFinal ? anclaFinal.getTime() + intervaloMs : null,
      racha,
      jefeVencido,
      coleccionablesNuevos: cartasNuevas.map(({ id, datos }) => ({
        id,
        nombre: datos.nombre ?? null,
        titulo: datos.titulo ?? null,
        rareza: datos.rareza ?? null,
        imagen_url: datos.imagen_url ?? null,
      })),
    };
  });
});

// =====================================================================
// VIDAS: sincronización pasiva y descuento inmediato por fallo
// =====================================================================

// Pone al día las vidas guardadas (regeneración pasiva) y devuelve el estado real.
// La app la llama al abrir el curso / el nodo y cuando vence el contador.
exports.sincronizarVidas = onCall(async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Iniciá sesión.");
  const uid = request.auth.uid;
  const intervaloMs = await intervaloVidaMs();

  return db.runTransaction(async (tx) => {
    const userRef = db.doc(`users/${uid}`);
    const snap = await tx.get(userRef);
    if (!snap.exists) throw new HttpsError("permission-denied", "Perfil inexistente.");
    const user = snap.data();

    if (!esLimitada(user)) return { vidas: null, ilimitadas: true, proximaVidaEn: null };

    const ahora = new Date();
    const { vidas, ancla } = calcularVidas(user, ahora, intervaloMs);
    const cambios = {};
    if (vidas !== (user.vidas ?? MAX_VIDAS)) cambios.vidas = vidas;
    if (vidas >= MAX_VIDAS) {
      if (user.vidas_actualizadas_at) cambios.vidas_actualizadas_at = FieldValue.delete();
    } else {
      const actual = user.vidas_actualizadas_at ? user.vidas_actualizadas_at.toDate().getTime() : null;
      if (actual !== ancla.getTime()) cambios.vidas_actualizadas_at = Timestamp.fromDate(ancla);
    }
    if (Object.keys(cambios).length > 0) tx.update(userRef, cambios);

    return {
      vidas,
      ilimitadas: false,
      proximaVidaEn: vidas >= MAX_VIDAS ? null : ancla.getTime() + intervaloMs,
    };
  });
});

// Descuenta UNA vida en el momento del error. Así salir del nodo a mitad no devuelve las vidas.
// "intentoId" lo genera la app al abrir el nodo; completarNodo lo usa para no cobrar dos veces.
exports.registrarFallo = onCall(async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Iniciá sesión.");
  const uid = request.auth.uid;
  const { intentoId } = request.data || {};
  if (typeof intentoId !== "string" || !ID_INTENTO.test(intentoId)) {
    throw new HttpsError("invalid-argument", "intentoId inválido.");
  }
  const intervaloMs = await intervaloVidaMs();

  return db.runTransaction(async (tx) => {
    const userRef = db.doc(`users/${uid}`);
    const intentoRef = userRef.collection("intentos").doc(intentoId);
    const [userSnap, intentoSnap] = await tx.getAll(userRef, intentoRef);
    if (!userSnap.exists) throw new HttpsError("permission-denied", "Perfil inexistente.");
    const user = userSnap.data();

    if (!esLimitada(user)) return { vidas: null, proximaVidaEn: null };

    const ahora = new Date();
    const regen = calcularVidas(user, ahora, intervaloMs);

    if (regen.vidas <= 0) {
      // ya no hay nada que descontar; solo asegurar que el contador esté corriendo
      const ancla = regen.ancla || ahora;
      if (!user.vidas_actualizadas_at) {
        tx.update(userRef, { vidas: 0, vidas_actualizadas_at: Timestamp.fromDate(ancla) });
      }
      return { vidas: 0, proximaVidaEn: ancla.getTime() + intervaloMs };
    }

    const vidas = regen.vidas - 1;
    const ancla = regen.ancla || ahora; // si estaba al máximo, el contador arranca ahora
    tx.update(userRef, { vidas, vidas_actualizadas_at: Timestamp.fromDate(ancla) });

    const cobrados = intentoSnap.exists ? Number(intentoSnap.data().cobrados) || 0 : 0;
    tx.set(intentoRef, {
      cobrados: cobrados + 1,
      actualizado: Timestamp.fromDate(ahora),
      // Activá una política TTL de Firestore sobre este campo (grupo de colecciones "intentos")
      expira: Timestamp.fromDate(new Date(ahora.getTime() + 24 * 3600 * 1000)),
    });

    return { vidas, proximaVidaEn: ancla.getTime() + intervaloMs };
  });
});

// =====================================================================
// AULAS: el alumno se une con el código de invitación (RF-18)
// =====================================================================

// Anti fuerza bruta: el código es lo único que protege el acceso a un aula
const MAX_CODIGOS_FALLIDOS = 5;
const VENTANA_CODIGOS_MS = 15 * 60 * 1000;

exports.unirseAula = onCall(async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Iniciá sesión.");
  const uid = request.auth.uid;
  const bruto = request.data && request.data.codigo;
  if (typeof bruto !== "string") throw new HttpsError("invalid-argument", "Ingresá el código del aula.");
  const codigo = bruto.trim();
  if (codigo.length < 3 || codigo.length > 40) {
    throw new HttpsError("invalid-argument", "El código no es válido.");
  }

  const userSnap = await db.doc(`users/${uid}`).get();
  if (!userSnap.exists) throw new HttpsError("permission-denied", "Perfil inexistente.");
  const user = userSnap.data();
  if (user.estado === "suspendido" || user.activo === false) {
    throw new HttpsError("permission-denied", "Cuenta suspendida.");
  }
  if (user.rol !== "alumno") {
    throw new HttpsError("permission-denied", "Solo los alumnos pueden unirse a un aula.");
  }

  // ---- Límite de intentos fallidos ----
  const ahora = new Date();
  const limRef = db.doc(`users/${uid}/limites/unirse_aula`);
  const limSnap = await limRef.get();
  const lim = limSnap.exists ? limSnap.data() : null;
  const enVentana = !!(lim && lim.desde &&
    ahora.getTime() - lim.desde.toDate().getTime() < VENTANA_CODIGOS_MS);
  if (enVentana && (lim.fallidos || 0) >= MAX_CODIGOS_FALLIDOS) {
    throw new HttpsError("resource-exhausted", "Demasiados intentos. Probá de nuevo en unos minutos.");
  }

  // ---- Buscar el aula (se prueba tal cual y en mayúsculas) ----
  const candidatos = [...new Set([codigo, codigo.toUpperCase()])];
  const q = await db.collection("aulas").where("codigo_aula", "in", candidatos).limit(2).get();
  if (q.empty) {
    if (enVentana) await limRef.set({ fallidos: FieldValue.increment(1) }, { merge: true });
    else await limRef.set({ fallidos: 1, desde: Timestamp.fromDate(ahora) });
    throw new HttpsError("not-found", "No encontramos un aula con ese código.");
  }
  if (q.size > 1) {
    console.error("Código de aula repetido", codigo);
    throw new HttpsError("failed-precondition", "Ese código está repetido. Avisale a tu profesor.");
  }
  const aulaDoc = q.docs[0];
  const aula = aulaDoc.data();

  // Si el alumno y el aula declaran institución, tienen que coincidir
  if (user.institucionId && aula.institucion_id && user.institucionId !== aula.institucion_id) {
    throw new HttpsError("permission-denied", "Esa aula es de otra institución.");
  }

  // ---- Inscripción (idempotente: id = aulaId_uid) ----
  const inscRef = db.doc(`inscripcion_aula/${aulaDoc.id}_${uid}`);
  const yaInscripto = await db.runTransaction(async (tx) => {
    const snap = await tx.get(inscRef);
    if (snap.exists) return true;
    tx.set(inscRef, {
      alumno_id: uid,
      aula_id: aulaDoc.id,
      fecha_inscripcion: Timestamp.fromDate(ahora),
    });
    return false;
  });
  if (lim) await limRef.delete(); // código correcto: se reinicia el contador de fallos

  return { aulaId: aulaDoc.id, nombre: aula.nombre ?? "", yaInscripto };
});

// =====================================================================
// MANTENIMIENTO DE NODOS (se dispara solo cuando alguien toca nodos o unidades)
// =====================================================================

// Recalcula para todo el curso: requiere de cada nodo, nodos_total y version.
async function reconstruirCurso(cursoId) {
  const cursoRef = db.doc(`cursos/${cursoId}`);
  await db.runTransaction(async (tx) => {
    const cursoSnap = await tx.get(cursoRef);
    const nodosSnap = await tx.get(cursoRef.collection("nodos"));
    if (!cursoSnap.exists) return;

    const unidades = [...(cursoSnap.data().unidades || [])].sort((a, b) => a.orden - b.orden);
    const nodos = nodosSnap.docs;

    // Secuencia de juego: unidades en orden; dentro de cada una, nodos por "orden" (empates por id)
    const secuencia = unidades.flatMap((u) =>
      nodos
        .filter((d) => (d.data().unidadId ?? d.data().unidad_id) === u.id)
        .sort((a, b) => (a.data().orden ?? 1e9) - (b.data().orden ?? 1e9) || a.id.localeCompare(b.id))
    );

    secuencia.forEach((d, i) => {
      const esperado = i === 0 ? [] : [secuencia[i - 1].id];
      if (!isDeepStrictEqual(d.data().requiere ?? [], esperado)) {
        tx.update(d.ref, { requiere: esperado });
      }
    });

    // "version" le avisa a las apps que refresquen su caché de nodos
    tx.update(cursoRef, { nodos_total: secuencia.length, version: FieldValue.increment(1) });
  });
}

// Cuando se crea, edita o borra un nodo
exports.mantenerNodos = onDocumentWritten("cursos/{cursoId}/nodos/{nodoId}", async (event) => {
  const antes = event.data.before.exists ? event.data.before.data() : null;
  const despues = event.data.after.exists ? event.data.after.data() : null;
  if (antes && despues) {
    const { requiere: _a, ...a } = antes;
    const { requiere: _d, ...d } = despues;
    if (isDeepStrictEqual(a, d)) return; // cambio que hizo esta misma función: no repetir
  }
  await reconstruirCurso(event.params.cursoId);
});

// Cuando cambian las unidades del curso (crear, borrar, reordenar)
exports.mantenerUnidades = onDocumentWritten("cursos/{cursoId}", async (event) => {
  if (!event.data.after.exists) return;
  const antes = event.data.before.exists ? event.data.before.data() : null;
  const despues = event.data.after.data();
  if (antes && isDeepStrictEqual(antes.unidades ?? [], despues.unidades ?? [])) return;
  await reconstruirCurso(event.params.cursoId);
});
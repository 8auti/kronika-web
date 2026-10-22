import { useEffect, useState, useCallback } from 'react';
import { collection, getDocs, getCountFromServer } from 'firebase/firestore';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { db } from '../../firebase'; // tu archivo de inicialización de Firebase

// ───────────── Configuración ─────────────

// Colecciones de las que solo quieres saber "cuántos hay"
const COLECCIONES = [
  'aulas',
  'cursos',
  'lecciones',
  'jefes',
  'ligas',
  'logros',
  'coleccionables',
  'combates',
  'progreso',
  'instituciones',
  'inscripcion_a', // ← ajusta al nombre completo (aparece cortado en la consola)
  'gemas_transac', // ← ajusta al nombre completo (aparece cortado en la consola)
];

// Campo de fecha de registro en los documentos de `users` (Timestamp de Firestore).
// Sin este campo no se pueden hacer gráficas en el tiempo.
const CAMPO_FECHA = 'creadoEn';
const DIAS = 30;

const INDIGO = '#4f46e5';
const INDIGO_SUAVE = '#c7d2fe';
const PIE_COLORES = ['#4f46e5', '#818cf8', '#c7d2fe', '#e0e7ff'];

// ───────────── Utilidades ─────────────

function agrupar(lista, campo) {
  const conteo = {};
  lista.forEach((item) => {
    const clave = item[campo] ?? 'sin dato';
    conteo[clave] = (conteo[clave] || 0) + 1;
  });
  return Object.entries(conteo)
    .map(([nombre, total]) => ({ nombre, total }))
    .sort((a, b) => b.total - a.total);
}

function aFecha(v) {
  if (!v) return null;
  if (typeof v.toDate === 'function') return v.toDate();
  const d = new Date(v);
  return isNaN(d) ? null : d;
}

const claveDia = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`;

// Usuarios nuevos por día: últimos 30 días vs los 30 anteriores (alineados día a día)
function serieRegistros(users) {
  const porDia = {};
  users.forEach((u) => {
    const f = aFecha(u[CAMPO_FECHA]);
    if (f) porDia[claveDia(f)] = (porDia[claveDia(f)] || 0) + 1;
  });

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const serie = [];
  for (let i = DIAS - 1; i >= 0; i--) {
    const actual = new Date(hoy);
    actual.setDate(hoy.getDate() - i);
    const anterior = new Date(actual);
    anterior.setDate(actual.getDate() - DIAS);
    serie.push({
      dia: `${actual.getDate()}/${actual.getMonth() + 1}`,
      actual: porDia[claveDia(actual)] || 0,
      anterior: porDia[claveDia(anterior)] || 0,
    });
  }
  return serie;
}

// ───────────── Página ─────────────

export default function Metricas() {
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState(null);
  const [cargando, setCargando] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const snap = await getDocs(collection(db, 'users'));
      const users = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

      const conteos = await Promise.all(
        COLECCIONES.map(async (nombre) => {
          try {
            const c = await getCountFromServer(collection(db, nombre));
            return { nombre, total: c.data().count };
          } catch {
            return { nombre, total: 0 };
          }
        })
      );

      // Distribución de vidas (0, 1, 2, 3...)
      const vidasMap = {};
      users.forEach((u) => {
        const v = Number(u.vidas) || 0;
        vidasMap[v] = (vidasMap[v] || 0) + 1;
      });
      const porVidas = Object.keys(vidasMap)
        .map(Number)
        .sort((a, b) => a - b)
        .map((v) => ({ nombre: String(v), total: vidasMap[v] }));

      const vidasTotal = users.reduce((a, u) => a + (Number(u.vidas) || 0), 0);
      const serie = serieRegistros(users);
      const nuevos = serie.reduce((a, d) => a + d.actual, 0);
      const nuevosAnt = serie.reduce((a, d) => a + d.anterior, 0);

      setDatos({
        totalUsuarios: users.length,
        activos: users.filter((u) => u.estado === 'activo').length,
        promedioVidas: users.length ? (vidasTotal / users.length).toFixed(1) : 0,
        tieneFechas: users.some((u) => aFecha(u[CAMPO_FECHA])),
        serie,
        nuevos,
        variacion: nuevosAnt > 0 ? (((nuevos - nuevosAnt) / nuevosAnt) * 100).toFixed(1) : null,
        porPlan: agrupar(users, 'plan'),
        porEstado: agrupar(users, 'estado'),
        porRol: agrupar(users, 'rol'),
        porVidas,
        conteos: conteos.sort((a, b) => b.total - a.total),
        cursos: conteos.find((c) => c.nombre === 'cursos')?.total ?? 0,
        actualizado: new Date().toLocaleString(),
      });
    } catch (e) {
      console.error(e);
      setError('No se pudieron cargar las métricas. Revisa las reglas de Firestore.');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  return (
    <div className="mx-auto max-w-7xl p-6">
      <div>
        <header className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Métricas</h1>
            {datos && <p className="mt-0.5 text-sm text-slate-500">Actualizado: {datos.actualizado}</p>}
          </div>
          <button
            onClick={cargar}
            disabled={cargando}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-default disabled:opacity-60"
          >
            {cargando ? 'Actualizando…' : 'Actualizar'}
          </button>
        </header>

        {error && <p className="text-sm text-rose-600">{error}</p>}
        {!datos && !error && <p className="py-10 text-sm text-slate-500">Cargando métricas…</p>}

        {datos && (
          <div className="space-y-4">
            {/* KPIs */}
            <section className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
              <Kpi
                titulo="Usuarios"
                valor={datos.totalUsuarios}
                pie={
                  datos.tieneFechas
                    ? `${datos.nuevos} nuevos en ${DIAS} días`
                    : 'Total registrados'
                }
                variacion={datos.variacion}
                sparkline={datos.tieneFechas ? datos.serie.slice(-12) : null}
              />
              <Kpi
                titulo="Usuarios activos"
                valor={datos.activos}
                pie={`${
                  datos.totalUsuarios ? Math.round((datos.activos / datos.totalUsuarios) * 100) : 0
                }% del total`}
              />
              <Kpi titulo="Vidas promedio" valor={datos.promedioVidas} pie="Por usuario" />
              <Kpi titulo="Cursos" valor={datos.cursos} pie="Publicados en la plataforma" />
            </section>

            {/* Línea + Donut */}
            <section className="flex flex-wrap gap-4">
              <Tarjeta
                className="min-w-[320px] flex-[2]"
                titulo="Usuarios nuevos"
                subtitulo={`Últimos ${DIAS} días vs. los ${DIAS} anteriores`}
              >
                {datos.tieneFechas ? <GraficaLinea data={datos.serie} /> : <SinFechas />}
              </Tarjeta>

              <Tarjeta className="min-w-[260px] flex-1" titulo="Usuarios por plan" subtitulo="Distribución actual">
                <Donut data={datos.porPlan} total={datos.totalUsuarios} />
              </Tarjeta>
            </section>

            {/* Tres tarjetas */}
            <section className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-4">
              <Tarjeta titulo="Vidas por usuario" subtitulo="Cuántos usuarios tienen cada cantidad">
                <BarrasVidas data={datos.porVidas} />
              </Tarjeta>

              <Tarjeta titulo="Estado de cuentas" subtitulo="Usuarios por estado">
                <Resumen data={datos.porEstado} />
              </Tarjeta>

              <Tarjeta titulo="Roles" subtitulo="Usuarios por rol">
                <DotPlot data={datos.porRol} />
              </Tarjeta>
            </section>

            {/* Contenido */}
            <section>
              <Tarjeta titulo="Contenido" subtitulo="Documentos por colección">
                <DotPlot data={datos.conteos} />
              </Tarjeta>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}

// ───────────── Layout ─────────────

function Tarjeta({ titulo, subtitulo, className = '', children }) {
  return (
    <div className={`rounded-2xl bg-white p-5 shadow-sm ${className}`}>
      <h2 className="text-sm font-semibold text-slate-800">{titulo}</h2>
      {subtitulo && <p className="mb-4 mt-0.5 text-xs text-slate-400">{subtitulo}</p>}
      {children}
    </div>
  );
}

function Kpi({ titulo, valor, pie, variacion, sparkline }) {
  const positiva = variacion !== null && variacion !== undefined && Number(variacion) >= 0;
  const maxSpark = sparkline ? Math.max(...sparkline.map((d) => d.actual), 1) : 1;

  return (
    <div className="flex items-end justify-between gap-3 rounded-2xl bg-white p-5 shadow-sm">
      <div>
        <p className="text-xs text-slate-500">{titulo}</p>
        <p className="mt-2 text-3xl font-semibold tabular-nums">{valor}</p>
        <p className="mt-2 text-xs text-slate-400">
          {variacion !== null && variacion !== undefined && (
            <span className={`mr-1 font-medium ${positiva ? 'text-indigo-600' : 'text-rose-500'}`}>
              {positiva ? '+' : ''}
              {variacion}%
            </span>
          )}
          {pie}
        </p>
      </div>

      {sparkline && (
        <div className="flex h-14 items-end gap-1" aria-hidden="true">
          {sparkline.map((d, i) => (
            <div
              key={i}
              className={`w-2 rounded-sm ${i === sparkline.length - 1 ? 'bg-indigo-600' : 'bg-indigo-200'}`}
              style={{ height: `${Math.max((d.actual / maxSpark) * 100, 8)}%` }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ───────────── Gráficas ─────────────

const tooltipStyle = {
  background: '#fff',
  border: '1px solid #e2e8f0',
  borderRadius: 8,
  fontSize: 12,
  boxShadow: '0 4px 12px rgba(15,23,42,0.08)',
};
const tick = { fill: '#94a3b8', fontSize: 11 };

// Tendencia en el tiempo → línea, periodo actual vs anterior
function GraficaLinea({ data }) {
  return (
    <>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={data} margin={{ left: -16, right: 8, top: 8 }}>
          <CartesianGrid vertical={false} stroke="#eef2f7" />
          <XAxis dataKey="dia" tick={tick} axisLine={false} tickLine={false} minTickGap={28} />
          <YAxis tick={tick} axisLine={false} tickLine={false} allowDecimals={false} />
          <Tooltip contentStyle={tooltipStyle} />
          <Line
            type="monotone"
            dataKey="anterior"
            name="Periodo anterior"
            stroke={INDIGO_SUAVE}
            strokeWidth={2}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="actual"
            name="Este periodo"
            stroke={INDIGO}
            strokeWidth={2.5}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
      <div className="mt-3 flex gap-5 text-xs text-slate-500">
        <Leyenda color={INDIGO} texto="Este periodo" />
        <Leyenda color={INDIGO_SUAVE} texto="Periodo anterior" />
      </div>
    </>
  );
}

function Leyenda({ color, texto }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
      {texto}
    </span>
  );
}

function SinFechas() {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 px-5 py-10 text-center text-sm text-slate-500">
      <p className="font-medium text-slate-700">Aún no hay fechas de registro</p>
      <p className="mt-1">
        Agrega el campo <code className="rounded bg-slate-100 px-1">{CAMPO_FECHA}</code> (Timestamp)
        a los documentos de <code className="rounded bg-slate-100 px-1">users</code> para ver esta
        gráfica.
      </p>
    </div>
  );
}

// Partes de un todo (pocas categorías) → donut
function Donut({ data, total }) {
  return (
    <div>
      <div className="relative mx-auto h-44 w-44">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="total"
              nameKey="nombre"
              innerRadius={58}
              outerRadius={82}
              paddingAngle={data.length > 1 ? 3 : 0}
              stroke="none"
            >
              {data.map((_, i) => (
                <Cell key={i} fill={PIE_COLORES[i % PIE_COLORES.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-semibold tabular-nums">{total}</span>
          <span className="text-xs text-slate-400">usuarios</span>
        </div>
      </div>

      <ul className="mt-4 space-y-2">
        {data.map((d, i) => (
          <li key={d.nombre} className="flex items-center justify-between text-sm">
            <Leyenda color={PIE_COLORES[i % PIE_COLORES.length]} texto={d.nombre} />
            <span className="font-medium tabular-nums">{d.total}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Distribución de un valor numérico → barras (la más alta resaltada)
function BarrasVidas({ data }) {
  const max = Math.max(...data.map((d) => d.total), 0);
  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={data} margin={{ left: -28, right: 4 }}>
        <XAxis dataKey="nombre" tick={tick} axisLine={false} tickLine={false} />
        <YAxis tick={tick} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip
          cursor={{ fill: 'rgba(79,70,229,0.06)' }}
          contentStyle={tooltipStyle}
          formatter={(v) => [v, 'Usuarios']}
          labelFormatter={(l) => `${l} vidas`}
        />
        <Bar dataKey="total" radius={[4, 4, 0, 0]}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.total === max ? INDIGO : INDIGO_SUAVE} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// Cifras clave por categoría, separadas por líneas finas
function Resumen({ data }) {
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(80px,1fr))] divide-x divide-slate-100">
      {data.map((d) => (
        <div key={d.nombre} className="px-3 first:pl-0">
          <p className="text-2xl font-semibold tabular-nums">{d.total}</p>
          <p className="mt-1 text-xs text-slate-400">{d.nombre}</p>
        </div>
      ))}
    </div>
  );
}

// Muchas categorías → gráfico de puntos
function DotPlot({ data }) {
  const max = Math.max(...data.map((d) => d.total), 1);
  if (!data.length) return <p className="text-sm text-slate-400">Sin datos todavía.</p>;

  return (
    <ul className="space-y-3">
      {data.map((d) => {
        const pct = (d.total / max) * 100;
        return (
          <li key={d.nombre} className="flex items-center gap-3">
            <span className="w-28 shrink-0 truncate text-sm text-slate-600" title={d.nombre}>
              {d.nombre}
            </span>
            <div className="relative mx-1.5 h-4 flex-1">
              <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-slate-100" />
              <div
                className="absolute top-1/2 h-px -translate-y-1/2 bg-indigo-200"
                style={{ width: `${pct}%` }}
              />
              <div
                className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-600 ring-2 ring-white"
                style={{ left: `${pct}%` }}
              />
            </div>
            <span className="w-8 shrink-0 text-right text-sm font-semibold tabular-nums">
              {d.total}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
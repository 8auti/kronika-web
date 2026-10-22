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
  'inscripcion_a', // ← ajusta al nombre completo
  'gemas_transac', // ← ajusta al nombre completo
];

// Campo de fecha de registro en `users` (Timestamp de Firestore)
const CAMPO_FECHA = 'creadoEn';
const DIAS = 30;

const INDIGO = '#4f46e5';
const INDIGO_SUAVE = '#c7d2fe';
const PIE_COLORES = ['#4f46e5', '#818cf8', '#c7d2fe', '#e0e7ff'];

// ───────────── Utilidades ─────────────

function agrupar(lista, campo, vacio = 'sin dato') {
  const conteo = {};
  lista.forEach((item) => {
    const clave = item[campo] ?? vacio;
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

// Registros por día: últimos 30 días vs los 30 anteriores (alineados día a día)
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
      conteos.sort((a, b) => b.total - a.total);

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
      const serieActivos = serieRegistros(users.filter((u) => u.estado === 'activo'));
      const nuevos = serie.reduce((a, d) => a + d.actual, 0);
      const nuevosAnt = serie.reduce((a, d) => a + d.anterior, 0);

      setDatos({
        totalUsuarios: users.length,
        activos: users.filter((u) => u.estado === 'activo').length,
        promedioVidas: users.length ? (vidasTotal / users.length).toFixed(1) : 0,
        tieneFechas: users.some((u) => aFecha(u[CAMPO_FECHA])),
        serie,
        serieActivos,
        nuevos,
        variacion: nuevosAnt > 0 ? (((nuevos - nuevosAnt) / nuevosAnt) * 100).toFixed(1) : null,
        porPlan: agrupar(users, 'plan', 'sin plan'),
        porRol: agrupar(users, 'rol', 'sin rol'),
        porVidas,
        conteos,
        totalDocs: conteos.reduce((a, c) => a + c.total, 0),
        coleccionesConDatos: conteos.filter((c) => c.total > 0).length,
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

  const d = datos;
  const ultimos = (serie) => serie.slice(-10).map((x) => x.actual);
  const indiceMax = (arr) => arr.indexOf(Math.max(...arr));

  return (
    <div className="min-w-0 text-slate-900">
      <header className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Métricas</h1>
          {d && <p className="mt-0.5 text-sm text-slate-500">Actualizado: {d.actualizado}</p>}
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
      {!d && !error && <p className="py-10 text-sm text-slate-500">Cargando métricas…</p>}

      {d && (
        <div className="space-y-4">
          {/* KPIs: misma estructura en las cuatro */}
          <section className="grid grid-cols-[repeat(auto-fit,minmax(230px,1fr))] gap-4">
            <Kpi
              titulo="Usuarios"
              valor={d.totalUsuarios}
              variacion={d.variacion}
              pie={d.tieneFechas ? `${d.nuevos} nuevos en ${DIAS} días` : 'Total registrados'}
              barras={d.tieneFechas ? ultimos(d.serie) : []}
              resaltar={9}
            />
            <Kpi
              titulo="Usuarios activos"
              valor={d.activos}
              pie={`${d.totalUsuarios ? Math.round((d.activos / d.totalUsuarios) * 100) : 0}% del total`}
              barras={d.tieneFechas ? ultimos(d.serieActivos) : []}
              resaltar={9}
            />
            <Kpi
              titulo="Vidas promedio"
              valor={d.promedioVidas}
              pie="Por usuario"
              barras={d.porVidas.map((v) => v.total)}
              resaltar={indiceMax(d.porVidas.map((v) => v.total))}
            />
            <Kpi
              titulo="Documentos"
              valor={d.totalDocs}
              pie={`En ${d.coleccionesConDatos} colecciones`}
              barras={d.conteos.slice(0, 6).map((c) => c.total)}
              resaltar={0}
            />
          </section>

          {/* Tendencia + plan */}
          <section className="flex flex-wrap gap-4">
            <Tarjeta
              className="min-w-[340px] flex-[2]"
              titulo="Usuarios nuevos"
              subtitulo={`Últimos ${DIAS} días vs. los ${DIAS} anteriores`}
            >
              {d.tieneFechas ? (
                <>
                  <p className="mb-2 text-3xl font-semibold tabular-nums">{d.nuevos}</p>
                  <ChartBox min={240}>
                    <GraficaLinea data={d.serie} />
                  </ChartBox>
                  <div className="mt-3 flex gap-5 text-xs text-slate-500">
                    <Leyenda color={INDIGO} texto="Este periodo" />
                    <Leyenda color={INDIGO_SUAVE} texto="Periodo anterior" />
                  </div>
                </>
              ) : (
                <SinFechas />
              )}
            </Tarjeta>

            <Tarjeta
              className="min-w-[280px] flex-1"
              titulo="Usuarios por plan"
              subtitulo={`${d.totalUsuarios} usuarios en total`}
            >
              <ChartBox min={200}>
                <Donut data={d.porPlan} total={d.totalUsuarios} />
              </ChartBox>
              <div className="mt-4">
                <Resumen data={d.porPlan} colores />
              </div>
            </Tarjeta>
          </section>

          {/* Tres tarjetas que llenan su alto */}
          <section className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-4">
            <Tarjeta titulo="Vidas por usuario" subtitulo="Cuántos usuarios tienen cada cantidad">
              <ChartBox min={200}>
                <BarrasVidas data={d.porVidas} />
              </ChartBox>
            </Tarjeta>

            <Tarjeta titulo="Estado de cuentas" subtitulo="Porcentaje de usuarios activos">
              <Gauge activos={d.activos} total={d.totalUsuarios} />
            </Tarjeta>

            <Tarjeta titulo="Roles" subtitulo="Usuarios por rol">
              <DotPlot data={d.porRol} />
            </Tarjeta>
          </section>

          {/* Contenido en dos columnas para aprovechar el ancho */}
          <Tarjeta titulo="Contenido" subtitulo="Documentos por colección">
            <DotPlot data={d.conteos} columnas />
          </Tarjeta>
        </div>
      )}
    </div>
  );
}

// ───────────── Estructura ─────────────

function Tarjeta({ titulo, subtitulo, className = '', children }) {
  return (
    <div className={`flex flex-col rounded-2xl bg-white p-5 shadow-sm ${className}`}>
      <h2 className="text-sm font-semibold text-slate-800">{titulo}</h2>
      {subtitulo && <p className="mb-4 mt-0.5 text-xs text-slate-400">{subtitulo}</p>}
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
    </div>
  );
}

// Caja que se estira para ocupar todo el espacio libre de la tarjeta
function ChartBox({ min = 200, children }) {
  return (
    <div className="relative flex-1" style={{ minHeight: min }}>
      <div className="absolute inset-0">{children}</div>
    </div>
  );
}

function Kpi({ titulo, valor, pie, variacion, barras = [], resaltar = 0 }) {
  const positiva = variacion !== null && variacion !== undefined && Number(variacion) >= 0;
  const max = Math.max(...barras, 1);

  return (
    <div className="flex flex-col justify-between gap-4 rounded-2xl bg-white p-5 shadow-sm">
      <p className="text-xs text-slate-500">{titulo}</p>

      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-3xl font-semibold tabular-nums">{valor}</p>
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

        <div className="flex h-14 shrink-0 items-end gap-1" aria-hidden="true">
          {barras.map((v, i) => (
            <div
              key={i}
              className={`w-2 rounded-sm bg-gradient-to-b ${
                i === resaltar ? 'from-indigo-600 to-indigo-300' : 'from-indigo-200 to-indigo-50'
              }`}
              style={{ height: `${Math.max((v / max) * 100, 8)}%` }}
            />
          ))}
        </div>
      </div>
    </div>
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
    <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 px-5 py-10 text-center text-sm text-slate-500">
      <p className="font-medium text-slate-700">Aún no hay fechas de registro</p>
      <p className="mt-1">
        Agrega el campo <code className="rounded bg-slate-100 px-1">{CAMPO_FECHA}</code> (Timestamp)
        a los documentos de <code className="rounded bg-slate-100 px-1">users</code> para ver esta
        gráfica.
      </p>
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

// Tendencia: línea, periodo actual vs anterior
function GraficaLinea({ data }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ left: -18, right: 8, top: 8 }}>
        <CartesianGrid vertical={false} stroke="#e8ecf3" strokeDasharray="4 4" />
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
          activeDot={{ r: 5, fill: '#fff', stroke: INDIGO, strokeWidth: 2 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

// Partes de un todo → dona que se adapta al alto disponible
function Donut({ data, total }) {
  return (
    <>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="total"
            nameKey="nombre"
            cx="50%"
            cy="50%"
            innerRadius="68%"
            outerRadius="92%"
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
        <span className="text-3xl font-semibold tabular-nums">{total}</span>
        <span className="text-xs text-slate-400">usuarios</span>
      </div>
    </>
  );
}

// Distribución numérica → barras (la más alta resaltada)
function BarrasVidas({ data }) {
  const max = Math.max(...data.map((d) => d.total), 0);
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ left: -24, right: 4, top: 8 }}>
        <CartesianGrid vertical={false} stroke="#e8ecf3" strokeDasharray="4 4" />
        <XAxis dataKey="nombre" tick={tick} axisLine={false} tickLine={false} />
        <YAxis tick={tick} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip
          cursor={{ fill: 'rgba(79,70,229,0.06)' }}
          contentStyle={tooltipStyle}
          formatter={(v) => [v, 'Usuarios']}
          labelFormatter={(l) => `${l} vidas`}
        />
        <Bar dataKey="total" radius={[6, 6, 0, 0]} maxBarSize={40}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.total === max ? INDIGO : INDIGO_SUAVE} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// Porcentaje de un total → medidor semicircular
function Gauge({ activos, total }) {
  const pct = total ? Math.round((activos / total) * 100) : 0;
  const arco = 'M 20 100 A 80 80 0 0 1 180 100';

  return (
    <div className="flex flex-1 flex-col justify-between gap-4">
      <div className="flex flex-1 items-center justify-center">
        <div className="relative w-full max-w-[300px]">
          <svg viewBox="0 0 200 110" className="w-full" role="img" aria-label={`${pct}% de cuentas activas`}>
            <path d={arco} fill="none" stroke="#e0e7ff" strokeWidth="12" strokeLinecap="round" />
            <path
              d={arco}
              fill="none"
              stroke={INDIGO}
              strokeWidth="12"
              strokeLinecap="round"
              pathLength="100"
              strokeDasharray={`${pct} 100`}
            />
          </svg>
          <div className="absolute inset-x-0 bottom-0 text-center">
            <p className="text-3xl font-semibold tabular-nums">{pct}%</p>
            <p className="text-xs text-slate-400">cuentas activas</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 divide-x divide-slate-100">
        <div className="pr-3">
          <p className="text-xl font-semibold tabular-nums">{activos}</p>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
            <span className="h-2 w-2 rounded-full bg-indigo-600" /> Activas
          </p>
        </div>
        <div className="pl-3">
          <p className="text-xl font-semibold tabular-nums">{total - activos}</p>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
            <span className="h-2 w-2 rounded-full bg-indigo-200" /> Otros estados
          </p>
        </div>
      </div>
    </div>
  );
}

// Cifras clave por categoría, separadas por líneas finas
function Resumen({ data, colores = false }) {
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(80px,1fr))] divide-x divide-slate-100">
      {data.map((d, i) => (
        <div key={d.nombre} className="px-3 first:pl-0">
          <p className="text-xl font-semibold tabular-nums">{d.total}</p>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
            {colores && (
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ background: PIE_COLORES[i % PIE_COLORES.length] }}
              />
            )}
            <span className="truncate">{d.nombre}</span>
          </p>
        </div>
      ))}
    </div>
  );
}

// Muchas categorías → gráfico de puntos (en columnas si hay espacio)
function DotPlot({ data, columnas = false }) {
  const max = Math.max(...data.map((d) => d.total), 1);
  if (!data.length) return <p className="text-sm text-slate-400">Sin datos todavía.</p>;

  return (
    <ul
      className={
        columnas
          ? 'grid grid-cols-[repeat(auto-fit,minmax(340px,1fr))] gap-x-12 gap-y-3'
          : 'flex flex-1 flex-col justify-around gap-3'
      }
    >
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
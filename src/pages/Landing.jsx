import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

import BotonGooglePlay from "../components/BotonGooglePlay";

const IMG = {
  hero: "/img/grifo-hero.png",
  racha: "/img/grifo-racha.png",
  temas: "/img/isla-temas.png",
  cta: "/img/grifo-cta.png",
  cursos: {
    griega: "/img/curso-griego.png",
    roma: "/img/curso-roma.png",
    egipto: "/img/curso-egipto.png",
    filosofia: "/img/curso-filosofia.png",
  },
};

const PASOS = [
  {
    titulo: "Elige un Curso",
    texto:
      "De la Roma Antigua a los mitos griegos: empieza por lo que más te llame la atención.",
  },
  {
    titulo: "Completa lecciones cortas",
    texto:
      "Cada lección toma unos 5 minutos, así que cabe en cualquier momento del día.",
  },
  {
    titulo: "Mantén tu racha",
    texto:
      "Aprende un poco cada día, suma días seguidos y celebra con tu logro.",
  },
];

const CURSOS = [
  { nombre: "Mitología Griega", estado: "Nuevo!", img: IMG.cursos.griega },
  { nombre: "Roma Antigua", estado: "Nuevo!", img: IMG.cursos.roma },
  { nombre: "Egipto Antiguo", estado: "Pronto", img: IMG.cursos.egipto },
  { nombre: "Filosofía Griega", estado: "Pronto", img: IMG.cursos.filosofia },
];

const TEMAS = ["Mitología", "Filosofía", "Roma", "Egipto"];

const DIAS = ["L", "M", "X", "J", "V", "S", "D"];

// TODO: reemplaza las respuestas por las reales
const FAQ = [
  {
    pregunta: "¿Es gratis?",
    respuesta: "Puedes descargar Kronika y empezar tus primeras lecciones sin costo.",
  },
  {
    pregunta: "¿Para qué edades es?",
    respuesta: "Está pensada para cualquiera que quiera aprender historia de forma entretenida.",
  },
  {
    pregunta: "¿Cuánto dura cada lección?",
    respuesta: "Unos 5 minutos, para que puedas hacerla en cualquier momento.",
  },
  {
    pregunta: "¿Funciona sin conexión?",
    respuesta: "Pronto podrás descargar lecciones para estudiar sin internet.",
  },
];

/* ------------------------------------------------------------------ */
/* Motion                                                              */
/* Todo el CSS de animación vive aquí para no tocar tu tailwind.config.*/
/* Respeta prefers-reduced-motion.                                     */
/* ------------------------------------------------------------------ */

const ESTILOS_MOTION = `
.reveal{
  opacity:0;
  transform:translate3d(var(--x,0),var(--y,1.5rem),0) scale(var(--s,1));
  transition:opacity .7s ease-out, transform .8s cubic-bezier(.2,.7,.2,1);
  transition-delay:var(--d,0ms);
}
.reveal.visto{opacity:1;transform:none}

@keyframes flota{
  0%,100%{transform:translateY(0) rotate(-1deg)}
  50%{transform:translateY(-14px) rotate(1deg)}
}
.flota{animation:flota 6s ease-in-out infinite}
.flota-lento{animation:flota 9s ease-in-out -3s infinite}

@keyframes ondea{to{transform:translateX(-9.09%)}}
.ondea{animation:ondea 9s ease-in-out infinite alternate}

@keyframes nudge{50%{transform:translateX(5px)}}
.nudge{animation:nudge 1.8s ease-in-out infinite}

@keyframes latido{50%{transform:scale(1.1)}}
.latido{animation:latido 2.2s ease-in-out infinite}

@keyframes anillo{
  0%{transform:scale(1);opacity:.7}
  100%{transform:scale(1.7);opacity:0}
}
.anillo{animation:anillo 2.8s ease-out infinite}

@keyframes dibuja{to{stroke-dashoffset:0}}
.subrayado path{
  stroke-dasharray:1;
  stroke-dashoffset:1;
  animation:dibuja .9s .9s cubic-bezier(.6,0,.2,1) forwards;
}

@media (prefers-reduced-motion: reduce){
  .reveal{opacity:1;transform:none;transition:none}
  .flota,.flota-lento,.ondea,.nudge,.latido,.anillo{animation:none}
  .subrayado path{animation:none;stroke-dashoffset:0}
}
`;

/** Marca `visto = true` la primera vez que el elemento entra en pantalla. */
function useEnVista(umbral = 0.2) {
  const ref = useRef(null);
  const [visto, setVisto] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!("IntersectionObserver" in window)) {
      setVisto(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisto(true);
          io.disconnect();
        }
      },
      { threshold: umbral, rootMargin: "0px 0px -6% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [umbral]);

  return [ref, visto];
}

const DIRECCIONES = {
  up: { "--x": "0", "--y": "1.5rem" },
  left: { "--x": "-2.5rem", "--y": "0" },
  right: { "--x": "2.5rem", "--y": "0" },
  zoom: { "--x": "0", "--y": "0.75rem", "--s": "0.9" },
};

/** Entrada al hacer scroll (o al cargar, si ya está a la vista). */
function Reveal({ as: Tag = "div", dir = "up", delay = 0, className = "", children }) {
  const [ref, visto] = useEnVista(0.15);
  return (
    <Tag
      ref={ref}
      className={`reveal ${visto ? "visto" : ""} ${className}`}
      style={{ ...DIRECCIONES[dir], "--d": `${delay}ms` }}
    >
      {children}
    </Tag>
  );
}

/** Sección de ancho completo cuyo fondo cambia de blanco a un tono al entrar. */
const FONDOS = {
  azul: "bg-azul-claro",
  violeta: "bg-violeta-claro",
};

function SeccionColor({ tono, children }) {
  const [ref, visto] = useEnVista(0.25);
  return (
    <section
      ref={ref}
      className={`transition-colors duration-1000 ease-out motion-reduce:transition-none ${
        visto ? FONDOS[tono] : "bg-white"
      }`}
    >
      {children}
    </section>
  );
}

/** Barra fina de progreso de lectura, pegada al borde superior. */
function BarraProgreso() {
  const ref = useRef(null);

  useEffect(() => {
    let raf = 0;
    const actualizar = () => {
      raf = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(window.scrollY / max, 1) : 0;
      if (ref.current) ref.current.style.transform = `scaleX(${p})`;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(actualizar);
    };
    actualizar();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="fixed inset-x-0 top-0 z-[60] h-1 origin-left bg-naranja"
      style={{ transform: "scaleX(0)" }}
    />
  );
}

/* ------------------------------------------------------------------ */
/* Piezas reutilizables                                                */
/* ------------------------------------------------------------------ */

/**
 * Ola que se mece despacio. `fondo` es el color que queda "detrás" de la
 * curva (el de la sección vecina), para que el borde siempre cuadre.
 */
function Ola({ className = "", invertida = false, fondo = "bg-white" }) {
  return (
    <div
      aria-hidden="true"
      className={`overflow-hidden leading-none ${fondo} ${invertida ? "rotate-180" : ""}`}
    >
      <svg
        viewBox="0 0 1440 120"
        preserveAspectRatio="none"
        className={`ondea block h-12 w-[110%] max-w-none md:h-24 ${className}`}
      >
        <path
          d="M0,70 C200,10 420,10 700,45 C980,80 1200,95 1440,35 L1440,121 L0,121 Z"
          fill="currentColor"
        />
      </svg>
    </div>
  );
}

function Titulo({ children, className = "" }) {
  return (
    <h2 className={`font-display text-3xl font-bold md:text-4xl ${className}`}>
      {children}
    </h2>
  );
}

function Hero() {
  return (
    <section className="relative mx-auto grid max-w-6xl items-center gap-10 px-6 py-12 md:grid-cols-2 md:py-20">
      <div>
        <Reveal delay={0}>
          <h1 className="font-display text-3xl font-bold leading-tight text-gray-900 md:text-4xl">
            La nueva y adictiva forma de realmente aprender{" "}
            <span className="relative inline-block text-naranja">
              historia.
              <svg
                viewBox="0 0 200 12"
                preserveAspectRatio="none"
                aria-hidden="true"
                className="subrayado absolute -bottom-1 left-0 h-2 w-full"
              >
                <path
                  d="M2,8 C50,2 110,12 198,4"
                  pathLength="1"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>
            </span>
          </h1>
        </Reveal>
        <Reveal delay={150}>
          <p className="mt-6 max-w-sm text-sm leading-relaxed text-gray-600">
            Domina las épocas del mundo, desde la mitología hasta la Edad Moderna,
            y convierte tu tiempo libre en conocimiento.
          </p>
        </Reveal>
        <Reveal delay={300}>
          <div className="mt-8 inline-block transition-transform duration-300 hover:scale-105 active:scale-95 motion-reduce:transition-none">
            <BotonGooglePlay />
          </div>
        </Reveal>
      </div>

      <Reveal dir="zoom" delay={200} className="relative">
        {/* Manchas de color que se mecen detrás del búho */}
        <span
          aria-hidden="true"
          className="flota-lento absolute -left-4 top-6 h-40 w-40 rounded-full bg-azul-claro"
        />
        <span
          aria-hidden="true"
          className="flota absolute -right-2 bottom-4 h-32 w-32 rounded-full bg-violeta-claro"
        />
        <img
          src={IMG.hero}
          alt="Búho de Kronika rodeado de objetos históricos"
          className="flota relative mx-auto w-full max-w-md"
        />
      </Reveal>
    </section>
  );
}

function Pasos() {
  return (
    <SeccionColor tono="azul">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <Titulo className="text-center text-gray-900">
          En tres pasos ya estas aprendiendo
        </Titulo>

        <ol className="mt-10 flex flex-col items-stretch gap-4 md:flex-row md:items-center">
          {PASOS.map((paso, i) => (
            <li key={paso.titulo} className="contents">
              {/* Los pasos entran en orden: el retraso comunica la secuencia */}
              <Reveal delay={i * 220} className="flex-1">
                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-azul-claro font-display text-lg font-bold text-azul">
                    {i + 1}
                  </span>
                  <h3 className="mt-4 font-display text-lg font-bold text-gray-900">
                    {paso.titulo}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-500">
                    {paso.texto}
                  </p>
                </div>
              </Reveal>
              {i < PASOS.length - 1 && (
                <span
                  aria-hidden="true"
                  className="self-center text-gray-400 max-md:rotate-90"
                >
                  <span className="nudge inline-block">→</span>
                </span>
              )}
            </li>
          ))}
        </ol>
      </div>
    </SeccionColor>
  );
}

function Cursos() {
  return (
    <section>
      {/* Arriba: color de Pasos. Abajo: blanco de Racha. */}
      <Ola className="text-azul" fondo="bg-azul-claro" />
      <div className="bg-azul pb-4 pt-6">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex items-baseline justify-between gap-4">
            <Titulo className="text-white">Que puedes Aprender</Titulo>
            <span className="text-sm font-semibold text-white">
              Y mas Cursos En camino
            </span>
          </div>

          <ul className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {CURSOS.map((curso, i) => (
              <Reveal as="li" dir="zoom" delay={i * 110} key={curso.nombre}>
                <div className="group overflow-hidden rounded-xl bg-white p-1.5">
                  <div className="overflow-hidden rounded-lg">
                    <img
                      src={curso.img}
                      alt=""
                      className="aspect-[4/3] w-full object-cover transition-transform duration-500 group-hover:scale-110 motion-reduce:transition-none"
                    />
                  </div>
                  <div className="flex items-center justify-between gap-2 px-2 pb-2 pt-2.5">
                    <span className="text-xs font-bold text-gray-900">
                      {curso.nombre}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                        curso.estado === "Pronto"
                          ? "bg-violeta-claro text-violeta"
                          : "latido bg-azul-claro text-azul"
                      }`}
                    >
                      {curso.estado}
                    </span>
                  </div>
                </div>
              </Reveal>
            ))}
          </ul>
        </div>
      </div>
      <Ola className="text-azul" invertida fondo="bg-white" />
    </section>
  );
}

/** Siete días que se encienden uno tras otro cuando la sección entra. */
function PuntosRacha() {
  const [ref, visto] = useEnVista(0.6);
  return (
    <ul
      ref={ref}
      aria-label="Ejemplo de una semana de racha"
      className="mt-8 flex gap-2"
    >
      {DIAS.map((dia, i) => (
        <li
          key={i}
          style={{ transitionDelay: visto ? `${i * 130}ms` : "0ms" }}
          className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold transition-all duration-500 motion-reduce:transition-none ${
            visto
              ? "scale-100 bg-naranja text-white"
              : "scale-90 bg-gray-200 text-gray-500"
          }`}
        >
          {dia}
        </li>
      ))}
    </ul>
  );
}

function Racha() {
  return (
    <section className="mx-auto grid max-w-6xl items-center gap-8 px-6 py-16 md:grid-cols-2">
      <div>
        <Reveal dir="left">
          <Titulo className="text-naranja">
            Una racha que no
            <br />
            quieres romper
          </Titulo>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-gray-600">
            Los imperios no se construyeron en un día, pero sí día tras día.
            Mantén tu racha y conquista la historia.
          </p>
        </Reveal>
        <PuntosRacha />
      </div>
      <Reveal dir="right" delay={150}>
        <img
          src={IMG.racha}
          alt="Búho construyendo una columna griega"
          className="flota-lento mx-auto w-full max-w-sm"
        />
      </Reveal>
    </section>
  );
}

function Temas() {
  return (
    <SeccionColor tono="violeta">
      <div className="mx-auto grid max-w-6xl items-center gap-8 px-6 py-16 md:grid-cols-2">
        <Reveal dir="left">
          <img
            src={IMG.temas}
            alt="Isla flotante con Templo Griego, Piramide, Barco y Locomotora"
            className="flota mx-auto w-full max-w-sm rounded-xl md:order-none"
          />
        </Reveal>
        <div>
          <Reveal dir="right">
            <Titulo className="text-naranja">Gran variedad de temas</Titulo>
            <p className="mt-3 text-sm leading-relaxed text-gray-600">
              Desde dioses y héroes hasta imperios y filósofos: elige la época que
              más te guste y avanza a tu ritmo.
            </p>
          </Reveal>
          <ul className="mt-4 flex flex-wrap gap-2">
            {TEMAS.map((tema, i) => (
              <Reveal as="li" dir="zoom" delay={300 + i * 100} key={tema}>
                <span className="inline-block rounded-full bg-white px-3 py-1 text-xs font-semibold text-violeta">
                  {tema}
                </span>
              </Reveal>
            ))}
          </ul>
        </div>
      </div>
    </SeccionColor>
  );
}

function Instituciones() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-16">
      <Reveal dir="zoom">
        <div className="relative flex flex-col items-start justify-between gap-6 overflow-hidden rounded-3xl bg-azul p-8 text-white md:flex-row md:items-center md:px-12 md:py-10">
          {/* Círculos decorativos que se mecen */}
          <span
            aria-hidden="true"
            className="flota-lento absolute -right-10 -top-12 h-44 w-44 rounded-full bg-white/10"
          />
          <span
            aria-hidden="true"
            className="flota absolute -bottom-16 left-1/3 h-36 w-36 rounded-full bg-white/10"
          />
          <div className="relative">
            <h2 className="font-display text-3xl font-bold md:text-4xl">
              Kronika para instituciones
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed">
              [Beneficios Para Colegios Y Profesores: Seguimiento De Progreso,
              Grupos, Contenido Alineado Al Currículo.]
            </p>
          </div>
          <Link
            to="/instituciones"
            className="group relative shrink-0 rounded-lg bg-gray-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            Mas Informacion
            <span
              aria-hidden="true"
              className="ml-2 inline-block transition-transform duration-300 group-hover:translate-x-1 motion-reduce:transition-none"
            >
              →
            </span>
          </Link>
        </div>
      </Reveal>
    </section>
  );
}

function Pregunta({ pregunta, respuesta, abierta, onToggle, id }) {
  return (
    <div className="rounded-lg bg-white shadow-sm">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={abierta}
        aria-controls={id}
        className="flex w-full items-center justify-between gap-4 rounded-lg px-5 py-4 text-left text-sm font-semibold text-gray-900 transition-colors hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-azul"
      >
        {pregunta}
        <span
          aria-hidden="true"
          className={`text-lg leading-none text-gray-600 transition-transform duration-300 motion-reduce:transition-none ${
            abierta ? "rotate-45" : ""
          }`}
        >
          +
        </span>
      </button>
      {/* grid 0fr → 1fr: la respuesta se despliega sin medir alturas */}
      <div
        id={id}
        role="region"
        aria-hidden={!abierta}
        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out motion-reduce:transition-none ${
          abierta ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <p className="px-5 pb-4 text-sm leading-relaxed text-gray-600">
            {respuesta}
          </p>
        </div>
      </div>
    </div>
  );
}

function Faq() {
  const [abierta, setAbierta] = useState(null);

  return (
    <section>
      <Ola className="text-naranja" fondo="bg-white" />
      <div className="bg-naranja pb-6 pt-6">
        <div className="mx-auto max-w-2xl px-6">
          <Titulo className="text-center text-white">Preguntas frecuentes</Titulo>
          <div className="mt-10 space-y-5">
            {FAQ.map((item, i) => (
              <Reveal key={item.pregunta} delay={i * 90}>
                <Pregunta
                  id={`faq-${i}`}
                  pregunta={item.pregunta}
                  respuesta={item.respuesta}
                  abierta={abierta === i}
                  onToggle={() => setAbierta(abierta === i ? null : i)}
                />
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function CtaFinal() {
  return (
    <section className="bg-azul">
      {/* La ola naranja "cuelga" del bloque anterior sobre el fondo azul */}
      <Ola className="text-naranja" invertida fondo="bg-azul" />
      <div className="mx-auto flex max-w-6xl flex-col items-center px-6 pb-20 pt-6 text-center">
        <Reveal dir="zoom">
          <div className="relative h-40 w-40">
            {/* Dos anillos que se expanden: llaman la atención hacia el botón */}
            <span
              aria-hidden="true"
              className="anillo absolute inset-0 rounded-full border-2 border-white"
            />
            <span
              aria-hidden="true"
              className="anillo absolute inset-0 rounded-full border-2 border-white"
              style={{ animationDelay: "1.4s" }}
            />
            <img
              src={IMG.cta}
              alt=""
              className="relative h-40 w-40 rounded-full bg-white object-cover"
            />
          </div>
        </Reveal>
        <Reveal delay={150}>
          <h2 className="mt-8 font-display text-2xl font-bold text-white md:text-3xl">
            Empieza tu primera leccion Hoy
          </h2>
          <p className="mt-3 text-sm text-white">
            Cinco minutos al día bastan para empezar tu racha.
          </p>
        </Reveal>
        <Reveal delay={300}>
          <div className="mt-8 inline-block transition-transform duration-300 hover:scale-105 active:scale-95 motion-reduce:transition-none">
            <BotonGooglePlay />
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Página                                                              */
/* ------------------------------------------------------------------ */
export default function Landing() {
  return (
    <>
      <style>{ESTILOS_MOTION}</style>
      <BarraProgreso />
      <main className="overflow-x-hidden bg-white text-gray-900">
        <Hero />
        <Pasos />
        <Cursos />
        <Racha />
        <Temas />
        <Instituciones />
        <Faq />
        <CtaFinal />
      </main>
    </>
  );
}
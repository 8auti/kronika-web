import { useState } from "react";
import { Link } from "react-router-dom";

import Ola from "../components/Ola";
import Footer from "../components/Footer";
import Reveal from "../components/motion/Reveal"
import SeccionColor from "../components/motion/SeccionColor"
import useEnVista from "../components/motion/UseEnVista"
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
    <SeccionColor tono="bg-azul-claro">
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
        <div className="mx-auto max-w-6xl px-6 pb-20">
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
    <SeccionColor tono="bg-violeta-claro">
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
            <Titulo className="text-white">Gran variedad de temas</Titulo>
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
      <Footer />
    </>
  );
}
import { useState } from "react";
import { Link } from "react-router-dom";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import BotonGooglePlay from "../components/BotonGooglePlay";

import { useAuth } from "../auth/useAuth.jsx";

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
/* Piezas reutilizables                                                */
/* ------------------------------------------------------------------ */

function Ola({ className = "", invertida = false }) {
  return (
    <svg
      viewBox="0 0 1440 120"
      preserveAspectRatio="none"
      aria-hidden="true"
      className={`block h-12 w-full md:h-24 ${invertida ? "rotate-180" : ""} ${className}`}
    >
      <path
        d="M0,70 C200,10 420,10 700,45 C980,80 1200,95 1440,35 L1440,121 L0,121 Z"
        fill="currentColor"
      />
    </svg>
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
    <section className="mx-auto grid max-w-6xl items-center gap-10 px-6 py-12 md:grid-cols-2 md:py-20">
      <div>
        <h1 className="font-display text-3xl font-bold leading-tight text-gray-900 md:text-4xl">
          La nueva y adictiva forma de realmente aprender{" "}
          <span className="text-naranja">historia.</span>
        </h1>
        <p className="mt-6 max-w-sm text-sm leading-relaxed text-gray-600">
          Domina las épocas del mundo, desde la mitología hasta la Edad Moderna,
          y convierte tu tiempo libre en conocimiento.
        </p>
        <BotonGooglePlay className="mt-8" />
      </div>
      <img
        src={IMG.hero}
        alt="Búho de Kronika rodeado de objetos históricos"
        className="mx-auto w-full max-w-md"
      />
    </section>
  );
}

function Pasos() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-10">
      <Titulo className="text-center text-gray-900">
        En tres pasos ya estas aprendiendo
      </Titulo>

      <ol className="mt-10 flex flex-col items-stretch gap-4 md:flex-row md:items-center">
        {PASOS.map((paso, i) => (
          <li key={paso.titulo} className="contents">
            <div className="flex-1 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
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
            {i < PASOS.length - 1 && (
              <span
                aria-hidden="true"
                className="self-center text-3xl text-gray-400 max-md:rotate-90"
              >
                →
              </span>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}

function Cursos() {
  return (
    <section className="bg-white">
      <Ola className="text-azul" />
      <div className="bg-azul pb-4 pt-6">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex items-baseline justify-between gap-4">
            <Titulo className="text-white">Que puedes Aprender</Titulo>
            <span className="text-sm font-semibold text-white">
              Y mas Cursos En camino
            </span>
          </div>

          <ul className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {CURSOS.map((curso) => (
              <li
                key={curso.nombre}
                className="overflow-hidden rounded-xl bg-white p-1.5"
              >
                <img
                  src={curso.img}
                  alt=""
                  className="aspect-[4/3] w-full rounded-lg object-cover"
                />
                <div className="flex items-center justify-between gap-2 px-2 pb-2 pt-2.5">
                  <span className="text-xs font-bold text-gray-900">
                    {curso.nombre}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                      curso.estado === "Pronto"
                        ? "bg-violeta-claro text-violeta"
                        : "bg-azul-claro text-azul"
                    }`}
                  >
                    {curso.estado}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <Ola className="text-azul" invertida />
    </section>
  );
}

function Racha() {
  return (
    <section className="mx-auto grid max-w-6xl items-center gap-8 px-6 py-16 md:grid-cols-2">
      <div>
        <Titulo className="text-naranja">
          Una racha que no
          <br />
          quieres romper
        </Titulo>
        <p className="mt-4 max-w-sm text-sm leading-relaxed text-gray-600">
          Los imperios no se construyeron en un día, pero sí día tras día.
          Mantén tu racha y conquista la historia.
        </p>
      </div>
      <img
        src={IMG.racha}
        alt="Búho construyendo una columna griega"
        className="mx-auto w-full max-w-sm"
      />
    </section>
  );
}

function Temas() {
  return (
    <section className="mx-auto grid max-w-6xl items-center gap-8 px-6 py-16 md:grid-cols-2">
      <img
        src={IMG.temas}
        alt="Isla flotante con Templo Griego, Piramide, Barco y Locomotora"
        className="mx-auto w-full max-w-sm rounded-xl md:order-none"
      />
      <div>
        <Titulo className="text-naranja">Gran variedad de temas</Titulo>
        <p className="mt-3 text-sm leading-relaxed text-gray-600">
          Desde dioses y héroes hasta imperios y filósofos: elige la época que
          más te guste y avanza a tu ritmo.
        </p>
        <ul className="mt-4 flex flex-wrap gap-2">
          {TEMAS.map((tema) => (
            <li
              key={tema}
              className="rounded-full bg-violeta-claro px-3 py-1 text-xs font-semibold text-violeta"
            >
              {tema}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Instituciones() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-16">
      <div className="flex flex-col items-start justify-between gap-6 rounded-3xl bg-azul p-8 text-white md:flex-row md:items-center md:px-12 md:py-10">
        <div>
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
          className="shrink-0 rounded-lg bg-gray-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          Mas Informacion
        </Link>
      </div>
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
        className="flex w-full items-center justify-between gap-4 rounded-lg px-5 py-4 text-left text-sm font-semibold text-gray-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-azul"
      >
        {pregunta}
        <span aria-hidden="true" className="text-lg leading-none text-gray-600">
          {abierta ? "−" : "+"}
        </span>
      </button>
      {abierta && (
        <p id={id} className="px-5 pb-4 text-sm leading-relaxed text-gray-600">
          {respuesta}
        </p>
      )}
    </div>
  );
}

function Faq() {
  const [abierta, setAbierta] = useState(null);

  return (
    <section className="bg-white">
      <Ola className="text-naranja" />
      <div className="bg-naranja pb-6 pt-6">
        <div className="mx-auto max-w-2xl px-6">
          <Titulo className="text-center text-white">Preguntas frecuentes</Titulo>
          <div className="mt-10 space-y-5">
            {FAQ.map((item, i) => (
              <Pregunta
                key={item.pregunta}
                id={`faq-${i}`}
                pregunta={item.pregunta}
                respuesta={item.respuesta}
                abierta={abierta === i}
                onToggle={() => setAbierta(abierta === i ? null : i)}
              />
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
      <Ola className="text-naranja" invertida />
      <div className="mx-auto flex max-w-6xl flex-col items-center px-6 pb-20 pt-6 text-center">
        <img
          src={IMG.cta}
          alt=""
          className="h-40 w-40 rounded-full bg-white object-cover"
        />
        <h2 className="mt-8 font-display text-2xl font-bold text-white md:text-3xl">
          Empieza tu primera leccion Hoy
        </h2>
        <p className="mt-3 text-sm text-white">
          Cinco minutos al día bastan para empezar tu racha.
        </p>
        <BotonGooglePlay className="mt-8"/>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Página                                                              */
/* ------------------------------------------------------------------ */
export default function Landing() {
  const { usuario, rol, cargando } = useAuth();

  return (
    <>
      {/* Sin sesión el Navbar muestra "Iniciar sesión" en lugar del rol */}
      {!cargando && <Navbar rol={usuario ? rol : null} />}

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
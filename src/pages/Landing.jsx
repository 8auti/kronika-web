import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { MoveUpRight } from "lucide-react"

import Ola from "../components/Ola";
import Footer from "../components/Footer";
import Pregunta from "../components/Pregunta";
import Reveal from "../components/motion/Reveal"
import SeccionColor from "../components/motion/SeccionColor"
import BotonGooglePlay from "../components/BotonGooglePlay";
import Mascot from "../components/landing/Mascot";

import {HERRAMIENTAS} from "../data/educativo/Herramientas";
import {PASOS} from "../data/landing/Pasos";
import {FAQ} from "../data/landing/Faq";

const IMG = {
  hero: "/img/landing/grifo-hero.png",
  racha: "/img/landing/grifo-racha.png",
  temas: "/img/landing/isla-temas.png",
  cta: "/img/landing/grifo-cta.png",
  cursos: {
    griega: "/img/landing/cursos/curso-griego.png",
    roma: "/img/landing/cursos/curso-roma.png",
    egipto: "/img/landing/cursos/curso-egipto.png",
    filosofia: "/img/landing/cursos/curso-filosofia.png",
  },
};

const CURSOS = [
  { nombre: "Mitología Griega", estado: "Nuevo!", img: IMG.cursos.griega },
  { nombre: "Roma Antigua", estado: "Nuevo!", img: IMG.cursos.roma },
  { nombre: "Egipto Antiguo", estado: "Pronto", img: IMG.cursos.egipto },
  { nombre: "Filosofía Griega", estado: "Pronto", img: IMG.cursos.filosofia },
];

const TEMAS = ["Mitología", "Filosofía", "Roma", "Egipto"];

function Titulo({ children, className = "" }) {
  return (
    <h2 className={`font-display text-3xl font-bold md:text-4xl ${className}`}>
      {children}
    </h2>
  );
}

/**
 * Una "pantalla" del scroll con snap.
 * - min-h-dvh: igual a la altura visible real (en celular no se desfasa con la barra del navegador).
 * - flex-col + justify-center: centra el contenido verticalmente si sobra espacio.
 * - Si el contenido es más alto que la pantalla, simplemente crece (no se corta).
 *
 * IMPORTANTE: los hijos con `mx-auto max-w-*` necesitan `w-full`, porque dentro de
 * un contenedor flex se encogen al ancho de su contenido y quedan chicos/corridos.
 */
function Pantalla({ children, className = "" }) {
  return (
    <div
      className={`flex min-h-dvh snap-start flex-col justify-center ${className}`}
    >
      {children}
    </div>
  );
}

function Hero() {
  return (
    <section className="relative mx-auto grid w-full max-w-6xl items-center gap-8 px-6 py-10 md:grid-cols-2 md:gap-10 md:px-24 md:py-16">
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
        {/* max-h en dvh: la imagen nunca empuja la sección más allá de la pantalla */}
        <img
          src={IMG.hero}
          alt="Búho de Kronika rodeado de objetos históricos"
          className="flota relative mx-auto max-h-[38dvh] w-full max-w-md object-contain md:max-h-[65dvh]"
        />
      </Reveal>
    </section>
  );
}

function Pasos() {
  return (
    <section className="relative mx-auto w-full max-w-6xl px-6 py-10">
      <Titulo className="text-center text-gray-900">
        En tres pasos ya estás aprendiendo
      </Titulo>

      <ol className="mt-6 flex flex-col items-stretch gap-4 md:mt-10 md:flex-row md:items-center md:gap-0">
        {PASOS.map((paso, i) => (
          <li key={paso.titulo} className="contents">
            {/* Los pasos entran en orden: el retraso comunica la secuencia */}
            <Reveal delay={i * 220} className="flex-1">
              <div className="relative isolate px-0 py-4 md:px-10 md:py-12">
                {/* Número gigante de fondo (más chico en mobile para que entren los 3 pasos) */}
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute -z-10 select-none font-display font-bold leading-none text-azul-claro
                             left-0 top-1/2 -translate-y-1/2 text-[9rem]
                             md:left-6 md:text-[20rem]"
                >
                  {i + 1}
                </span>

                <h3 className="font-display text-3xl font-bold leading-tight text-azul md:text-5xl">
                  {paso.titulo}
                </h3>
                <p className="mt-3 max-w-xs text-base leading-relaxed text-gray-700 md:mt-6">
                  {paso.texto}
                </p>
              </div>
            </Reveal>

            {/* Divisor vertical entre pasos (solo desktop) */}
            {i < PASOS.length - 1 && (
              <span
                aria-hidden="true"
                className="hidden h-24 w-0.5 shrink-0 self-center bg-azul md:block"
              />
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}

function Cursos() {
  return (
    // flex-1: la sección ocupa toda la pantalla, así el azul llega hasta abajo
    <section className="flex flex-1 flex-col">
      <Ola className="text-azul" />
      <div className="flex flex-1 flex-col justify-center bg-azul pb-4 pt-6">
        <div className="mx-auto w-full max-w-6xl px-6 py-10">
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

function Racha() {
  return (
    <section className="mx-auto grid w-full max-w-6xl items-center gap-8 px-6 py-10 md:grid-cols-2">
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
      <Reveal dir="right" delay={150}>
        <img
          src={IMG.racha}
          alt="Búho construyendo una columna griega"
          className="flota-lento mx-auto max-h-[40dvh] w-full max-w-sm object-contain md:max-h-[60dvh]"
        />
      </Reveal>
    </section>
  );
}

function Temas() {
  return (
    <section className="mx-auto grid w-full max-w-6xl items-center gap-8 px-6 py-10 md:grid-cols-2">
      <Reveal dir="left">
        <img
          src={IMG.temas}
          alt="Isla flotante con Templo Griego, Piramide, Barco y Locomotora"
          className="flota mx-auto max-h-[40dvh] w-full max-w-sm rounded-xl object-contain md:max-h-[60dvh]"
        />
      </Reveal>
      <div>
        <Reveal dir="right">
          <Titulo className="text-naranja">Gran variedad de temas</Titulo>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-gray-600">
            Desde dioses y héroes hasta imperios y filósofos: elige la época que
            más te guste y avanza a tu ritmo.
          </p>
        </Reveal>
        <ul className="mt-4 flex flex-wrap gap-2">
          {TEMAS.map((tema, i) => (
            <Reveal as="li" dir="zoom" delay={300 + i * 100} key={tema}>
              <span className="inline-block rounded-full bg-azul-claro px-3 py-1 text-xs font-semibold text-azul">
                {tema}
              </span>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Instituciones() {
  return (
    <section className="mx-auto w-full max-w-6xl px-6 py-16 md:py-20">
      <Reveal dir="zoom">
        <header className="mx-auto max-w-xl text-center">
          <h2 className="font-display text-3xl font-bold text-gray-900 md:text-4xl">
            Kronika para <span className="text-azul">colegios</span>
          </h2>
          <p className="mt-4 text-base leading-relaxed text-gray-500">
            Descubrí los beneficios que ofrece nuestra versión educativa para
            colegios y profesores.
          </p>
        </header>
 
        <ul className="mt-12 grid gap-10 md:mt-16 md:grid-cols-3 md:gap-8">
          {HERRAMIENTAS.map(({ titulo, descripcion, img }, i) => (
            <Reveal delay={i * 220} className="flex-1">
              <li key={titulo}>
                <div className="flex aspect-[8/5] w-full items-center justify-center rounded-3xl border border-gray-200 bg-white">
                  <img src={img} alt={titulo} className="h-full w-full object-contain" />
                </div>
                <h3 className="mt-6 font-display text-xl font-bold text-gray-900">
                  {titulo}
                </h3>
                <p className="mt-3 max-w-xs text-base leading-relaxed text-gray-800">
                  {descripcion}
                </p>
              </li>
            </Reveal>
          ))}
        </ul>
        
        <div className="mt-14 flex justify-center md:mt-16">
          <Link
            to="/educativo"
            className="group inline-flex items-center gap-2 rounded-xl bg-azul px-8 py-4 text-base font-semibold text-white transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-azul"
          >
            Más información
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              className="h-5 w-5 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 motion-reduce:transition-none"
            >
              <path d="M7 17 17 7M8 7h9v9" />
            </svg>
          </Link>
        </div>
      </Reveal>
    </section>
  );
}

function Faq() {
  const [abierta, setAbierta] = useState(null);

  return (
    <section className="flex flex-1 flex-col">
      <Ola className="text-naranja" fondo="bg-white" />
      <div className="flex flex-1 flex-col justify-center bg-naranja py-10">
        <div className="mx-auto w-full max-w-2xl px-6">
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
  const [active, setActive] = useState(false);
  const ctaRef = useRef(null);

  return (
    <section className="flex flex-1 flex-col items-center px-6 pt-8">
      <div className="my-auto flex flex-col items-center gap-6 py-6 sm:gap-8">
        <Titulo className="font-display text-4xl text-amber-500">
          ¿Empezamos ahora?
        </Titulo>

        <p className="max-w-sm text-center text-sm text-neutral-500">
          Dominá las épocas del mundo, desde la mitología hasta la Edad Moderna,
          y convertí tu tiempo libre en conocimiento.
        </p>

        <button
          ref={ctaRef}
          id="cta"
          onPointerEnter={() => setActive(true)}
          onPointerLeave={() => setActive(false)}
          onFocus={() => setActive(true)}
          onBlur={() => setActive(false)}
          className="group inline-flex items-center gap-2 rounded-xl bg-neutral-800 px-10 py-3 font-bold text-white transition hover:scale-105 hover:bg-amber-500 active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-300"
        >
          Descargar
          <MoveUpRight
            aria-hidden="true"
            className="size-4"
          />
        </button>
      </div>

      {/* La mascota queda siempre apoyada sobre el footer */}
      <div className="relative aspect-[10/7] w-64 shrink-0 md:w-96 [clip-path:inset(-120px_-120px_0_-120px)]">
        <Mascot
          className="absolute inset-x-0 top-0 w-full"
          active={active}
          lookAtRef={ctaRef}
        />
      </div>
    </section>
  );
}

export default function Landing() {
  return (
    <main className="h-dvh snap-y snap-proximity overflow-x-hidden overflow-y-auto bg-white text-gray-900">
      <Pantalla>
        <Hero />
      </Pantalla>

      <Pantalla>
        <Pasos />
      </Pantalla>

      <Pantalla>
        <Cursos />
      </Pantalla>

      <Pantalla>
        <Racha />
      </Pantalla>

      <Pantalla>
        <Temas />
      </Pantalla>

      <Pantalla>
        <Instituciones />
      </Pantalla>

      <Pantalla>
        <Faq />
      </Pantalla>

      <div className="flex min-h-dvh snap-start flex-col">
        <CtaFinal />
        <Footer />
      </div>
    </main>
  );
}
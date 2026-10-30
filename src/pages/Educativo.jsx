import { useState } from "react";
import { Check } from "lucide-react";

import Footer from "../components/Footer";
import Pregunta from "../components/Pregunta";
import Reveal from "../components/motion/Reveal"
import SeccionColor from "../components/motion/SeccionColor";
import Ola from "../components/Ola";

import {BENEFICIOS} from "../data/educativo/Beneficios";
import {HERRAMIENTAS} from "../data/educativo/Herramientas";
import {PLANES} from "../data/educativo/Planes";
import {FAQ} from "../data/educativo/Faq";

const IMG = {
  hero: "/img/educativo/hero.png",
  cta: "/img/educativo/cta.png"
};

function Titulo({ children, className = "" }) {
  return (
    <h2 className={`font-display text-3xl font-bold md:text-4xl ${className}`}>
      {children}
    </h2>
  );
}

function Hero() {
  return (
    <section className="relative mx-auto grid max-w-6xl items-center gap-10 px-6 py-12 md:grid-cols-2 md:py-40">
      <div>
        <Reveal delay={0}>
          <h1 className="font-display text-3xl font-bold leading-tight text-gray-900 md:text-4xl">
            Kronika para instituciones:{" "}
            <span className="relative inline-block text-azul">
              historia que tus alumnos quieren repasar.
            </span>
          </h1>
        </Reveal>
        <Reveal delay={150}>
          <p className="mt-6 max-w-sm text-sm leading-relaxed text-gray-600">
            Cursos y lecciones cortas con gamificación, y un panel web para que
            los profesores asignen contenido, creen el suyo y sigan el progreso
            de cada alumno.
          </p>
        </Reveal>

        <Reveal delay={300}>
          <div className="my-6 grid grid-cols-2 gap-4">
            <a
              href="#contacto"
              className="w-full rounded-md border border-gray-900 bg-gray-900 px-4 py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-gray-800"
            >
              Solicitar demo
            </a>
            <a
              href="#planes"
              className="w-full rounded-md border border-gray-200 bg-white px-4 py-2.5 text-center text-sm font-semibold text-gray-900 transition-colors hover:bg-gray-50"
            >
              Ver planes y precios
            </a>
          </div>
        </Reveal>
      </div>

      <Reveal dir="zoom" delay={200} className="relative">
        <img
          src={IMG.hero}
          alt="Búho de Kronika mirando a un panel administrativo flotante"
          className="flota relative mx-auto w-full max-w-md"
        />
      </Reveal>

    </section>
  );
}

function Beneficios() {
  return (
    <SeccionColor tono="bg-azul">
      <div className="mx-auto max-w-6xl px-6 py-40">
        <Titulo className="text-center text-white">
          Pensada para el aula, dentro y fuera de ella
        </Titulo>

        <ol className="mt-10 flex flex-col items-stretch gap-4 md:flex-row md:items-center">
          {BENEFICIOS.map((beneficio, i) => (
            <li key={beneficio.titulo} className="contents">
              <Reveal delay={i * 220} className="flex-1">
                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-azul-claro font-display text-lg font-bold text-azul">
                    {beneficio.icono && <beneficio.icono className="size-5" color="#2394ff" aria-hidden="true" />}
                  </span>
                  <h3 className="mt-4 font-display text-lg font-bold text-gray-900">
                    {beneficio.titulo}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-500">
                    {beneficio.texto}
                  </p>
                </div>
              </Reveal>
            </li>
          ))}
        </ol>
      </div>
    </SeccionColor>
  );
}

function Herramientas() {

  return (
    <SeccionColor>
      <section className="mx-auto mt-40 max-w-6xl items-center">
        <Titulo>
          Herramientas para los profesores
        </Titulo>

        {HERRAMIENTAS.map((item, i) => {
          const invertir = i % 2 !== 0;

          return (
            <section
              key={item.titulo}
              className="mx-auto grid items-center gap-8 py-16 md:grid-cols-2"
            >
              <div className={invertir ? "md:order-2" : "md:order-1"}>
                <Reveal dir={invertir ? "right" : "left"}>
                  <Titulo className="text-xl text-black">{item.titulo}</Titulo>
                  <p className="mt-4 mb-4 max-w-sm text-sm leading-relaxed text-gray-600">
                    {item.descripcion}
                  </p>

                  <ul className="mt-4 flex flex-wrap gap-2">
                    {item.tags.map((tag, i) => (
                      <Reveal as="li" dir="zoom" delay={300 + i * 100} key={tag}>
                        <span className="inline-block rounded-full bg-azul-claro px-3 py-1 text-xs font-semibold text-azul">
                          {tag}
                        </span>
                      </Reveal>
                    ))}
                  </ul>
                </Reveal>
              </div>

              <div className={invertir ? "md:order-1" : "md:order-2"}>
                <Reveal dir={invertir ? "left" : "right"} delay={150}>
                  <img
                    src={item.img}
                    alt=""
                    className="flota-lento mx-auto w-full max-w-3xs"
                  />
                </Reveal>
              </div>
            </section>
          );
        })}

      </section>
    </SeccionColor>
  );
}

function Planes() {
  const [anual, setAnual] = useState(false);

  return (
      <section id="planes" className="mx-auto max-w-6xl px-6 py-40">
        <Titulo className="text-gray-900">Planes y precios</Titulo>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-gray-600">
          Los alumnos acceden sin costo propio: la institución elige un plan
          según su tamaño.
        </p>

        {/* Toggle mensual / anual */}
        <div
          role="group"
          aria-label="Periodo de facturación"
          className="mt-6 inline-flex rounded-lg border border-gray-200 bg-white p-1"
        >
          <button
            type="button"
            onClick={() => setAnual(false)}
            aria-pressed={!anual}
            className={`rounded-md px-4 py-2 text-sm font-semibold transition-colors ${
              !anual ? "bg-gray-900 text-white" : "text-gray-900"
            }`}
          >
            Mensual
          </button>
          <button
            type="button"
            onClick={() => setAnual(true)}
            aria-pressed={anual}
            className={`rounded-md px-4 py-2 text-sm font-semibold transition-colors ${
              anual ? "bg-gray-900 text-white" : "text-gray-900"
            }`}
          >
            Anual (–20%)
          </button>
        </div>

        {/* Tarjetas */}
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {PLANES.map((plan, i) => {
            const precio =
              plan.precio === null
                ? null
                : anual
                ? Math.round(plan.precio * 0.8)
                : plan.precio;

            return (
              <Reveal key={plan.nombre} dir="zoom" delay={i * 150} className="h-full">
                <div
                  className={`relative flex h-full flex-col rounded-xl bg-white p-6 shadow-sm ${
                    plan.destacado
                      ? "border-2 border-azul"
                      : "border border-gray-200"
                  }`}
                >
                  {plan.destacado && (
                    <span className="absolute -top-3 left-4 rounded-full bg-azul px-3 py-0.5 text-xs font-bold text-white">
                      Más elegido
                    </span>
                  )}

                  <h3 className="font-display text-lg font-bold text-gray-900">
                    {plan.nombre}
                  </h3>
                  <p className="text-sm text-gray-500">{plan.descripcion}</p>

                  <p className="mt-5 flex items-baseline gap-1.5">
                    {precio === null ? (
                      <span className="font-display text-4xl font-bold text-gray-900">
                        A medida
                      </span>
                    ) : (
                      <>
                        <span className="font-display text-4xl font-bold text-gray-900">
                          {precio}
                        </span>
                        <span className="text-sm text-gray-500">USD / mes</span>
                      </>
                    )}
                  </p>

                  <ul className="mt-5 divide-y divide-gray-100 border-t border-gray-100">
                    {plan.items.map((item) => {
                      const texto = typeof item === "string" ? item : item.texto;
                      const pronto = typeof item !== "string" && item.pronto;

                      return (
                        <li
                          key={texto}
                          className="flex items-center gap-3 py-2 text-sm text-gray-600"
                        >
                          {pronto ? (
                            <span className="flex size-4 shrink-0 items-center justify-center">
                              <span className="size-1.5 rounded-full bg-amber-400" />
                            </span>
                          ) : (
                            <Check
                              className="size-4 shrink-0 text-azul"
                              aria-hidden="true"
                            />
                          )}
                          {texto}
                        </li>
                      );
                    })}
                  </ul>

                  <button
                    type="button"
                    className={`mt-auto w-full rounded-md border px-4 py-2.5 text-sm font-semibold transition-colors ${
                      plan.destacado
                        ? "border-gray-900 bg-gray-900 text-white hover:bg-gray-800"
                        : "border-gray-200 bg-white text-gray-900 hover:bg-gray-50"
                    }`}
                  >
                    {plan.cta}
                  </button>
                </div>
              </Reveal>
            );
          })}
        </div>

        <p className="mt-6 text-xs text-gray-500">
          Precios sin impuestos incluidos.
        </p>
      </section>
  );
}

function Faq() {
  const [abierta, setAbierta] = useState(null);

  return (
    <section>
      <Ola className="text-azul-claro" fondo="bg-white" />
      <div className="bg-azul-claro pb-24 pt-12">
        <div className="mx-auto max-w-2xl px-6">
          <Titulo className="text-center text-azul">Preguntas frecuentes</Titulo>
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
    <section id="contacto" className="bg-azul">
      <Ola className="text-azul-claro" invertida fondo="bg-azul" />
      <div className="mx-auto flex max-w-6xl flex-col items-center px-6 pb-20 pt-6 text-center">
        <Reveal dir="zoom">
          <div className="relative h-40 w-40">
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
            Llevemos Kronika a tu institución
          </h2>
          <p className="mt-3 text-sm text-white">
            Cuéntanos cuántos profesores y alumnos serían y te respondemos
            pronto.
          </p>
        </Reveal>

        <Reveal delay={300}>
          <a
            href="mailto:correo@kronika.app?subject=Kronika%20para%20instituciones"
            className="mt-6 inline-block rounded-md border border-white bg-white px-6 py-2.5 text-sm font-semibold text-gray-900 transition-colors hover:bg-gray-100"
          >
            Contactar a ventas
          </a>
        </Reveal>
      </div>
    </section>
  );
}

export default function Educativo() {
  return (
    <>
      <main className="overflow-x-hidden bg-white text-gray-900">
        <Hero />
        <Beneficios/>
        <Herramientas/>
        <Planes/>
        <Faq/>
        <CtaFinal/>
      </main>
      <Footer />
    </>
  );
}

import Reveal from "../components/motion/Reveal"
import Ola from "../components/Ola";

const IMG = {
  hero: "/img/grifo-panel.png",
  racha: "/img/grifo-racha.png",
  cursos: {
    griega: "/img/curso-griego.png",
    roma: "/img/curso-roma.png",
    egipto: "/img/curso-egipto.png",
    filosofia: "/img/curso-filosofia.png",
  },
};

const HERRAMIENTAS = [
  {
    titulo: "Clases y grupos",
    descripcion:
      "Crea una clase y suma a tus alumnos con un código o una invitación. Asigna cursos o lecciones específicas.",
    imagen: IMG.racha,
    tags: ["Código de clase", "Asignación de lecciones"]
  },
  {
    titulo: "Progreso y reportes",
    descripcion:
      "Consulta el avance individual y grupal, y genera reportes de desempeño para compartir con tu institución.",
    imagen: IMG.racha,
    tags: ["Progreso individual", "Reportes"]
  },
  {
    titulo: "Contenido propio desde el panel web",
    descripcion:
      "Escribe tus lecciones y preguntas con teclado y pantalla amplia. El equipo de Kronika revisa el contenido para evitar errores o material inapropiado.",
    imagen: IMG.racha,
    tags: ["Código de clase", "Asignación de lecciones"]
  },
];

function Hero() {
  return (
    <section className="relative mx-auto grid max-w-6xl items-center gap-10 px-6 py-12 md:grid-cols-2 md:py-20">
      <div>
        <Reveal delay={0}>
          <h1 className="font-display text-3xl font-bold leading-tight text-gray-900 md:text-4xl">
            Kronika para instituciones:{" "}
            <span className="relative inline-block text-naranja">
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

function Herramientas() {
  return HERRAMIENTAS.map((item, i) => {
    const invertir = i % 2 !== 0;

    return (
      <section
        key={item.titulo}
        className="mx-auto grid max-w-4xl items-center gap-8 px-6 py-16 md:grid-cols-2"
      >
        <div className={invertir ? "md:order-2" : "md:order-1"}>
          <Reveal dir={invertir ? "right" : "left"}>
            <h3 className="text-xl text-black">{item.titulo}</h3>
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
              src={item.imagen}
              alt=""
              className="flota-lento mx-auto w-full max-w-xs"
            />
          </Reveal>
        </div>
      </section>
    );
  });
}

function CtaFinal() {
  return (
    <section className="bg-azul">
      <Ola className="text-white" invertida fondo="bg-azul" />
      <div className="mx-auto flex max-w-6xl flex-col items-center px-6 pb-20 pt-6 text-center">
        <Reveal delay={150}>
          <h2 className="mt-8 font-display text-2xl font-bold text-white md:text-3xl">
            Llevemos Kronika a tu institución
          </h2>
          <p className="mt-3 text-sm text-white">
            Cuéntanos cuántos profesores y alumnos serían y te respondemos
            pronto.
          </p>
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
        <Herramientas/>
        <CtaFinal/>
      </main>
    </>
  );
}

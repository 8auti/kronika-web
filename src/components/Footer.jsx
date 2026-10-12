import { Link } from "react-router-dom";

function Footer() {
  const enlaces = {
    Producto: [
      { texto: "Cursos", to: "/cursos" },
      { texto: "Instituciones", to: "/instituciones" },
    ],
    Legal: [
      { texto: "Política de privacidad", to: "/privacidad" },
      { texto: "Términos de uso", to: "/terminos" },
    ],
    Contacto: [
      { texto: "correo@kronika.app", href: "mailto:correo@kronika.app" },
      { texto: "Redes Sociales", to: "/redes" },
    ],
  };

  return (
    <footer className="bg-[#2a2a2a] text-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-12 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
        <div>
          <p className="font-display text-xl font-bold text-naranja">Kronika</p>
          <p className="mt-2 text-xs text-gray-300">
            Aprende historia, un poco cada día
          </p>
          <p className="mt-10 text-[11px] text-gray-400">2026 Kronika</p>
        </div>

        {Object.entries(enlaces).map(([titulo, items]) => (
          <nav key={titulo} aria-label={titulo}>
            <p className="text-xs font-semibold">{titulo}</p>
            <ul className="mt-3 space-y-3">
              {items.map((item) => (
                <li key={item.texto}>
                  {item.href ? (
                    <a
                      href={item.href}
                      className="text-xs text-gray-300 underline underline-offset-2 hover:text-white"
                    >
                      {item.texto}
                    </a>
                  ) : (
                    <Link
                      to={item.to}
                      className="text-xs text-gray-300 underline underline-offset-2 hover:text-white"
                    >
                      {item.texto}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
    </footer>
  );
}

export default Footer;
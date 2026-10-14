export default function Paginacion({
  pagina,
  totalPaginas,
  setPagina,
}) {
  if (totalPaginas <= 1) return null;

  const obtenerPaginas = () => {
    const paginas = [];
    const inicio = Math.max(1, pagina - 2);
    const fin = Math.min(totalPaginas, pagina + 2);

    for (let i = inicio; i <= fin; i++) {
      paginas.push(i);
    }

    return paginas;
  };

  const paginas = obtenerPaginas();
  const primeraPagina = paginas[0];
  const ultimaPagina = paginas[paginas.length - 1];

  const botonBase =
    "inline-flex h-9 min-w-9 items-center justify-center rounded-lg border border-gray-300 px-3 text-sm font-medium transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-40";

  const botonNormal =
    "bg-white text-gray-700 hover:bg-gray-50";

  const botonActivo =
    "border-blue-600 bg-blue-600 text-white shadow-sm hover:bg-blue-700";

  return (
    <nav
      aria-label="Paginación"
      className="flex justify-center border-t border-gray-300 px-2 py-5"
    >
      <div className="flex flex-wrap items-center justify-center gap-1.5">
        <button
          type="button"
          onClick={() => setPagina((p) => p - 1)}
          disabled={pagina === 1}
          aria-label="Página anterior"
          className={`${botonBase} ${botonNormal} gap-2`}
        >
          <span aria-hidden="true" className="text-base leading-none">
            ←
          </span>
          <span className="hidden sm:inline">Anterior</span>
        </button>

        {primeraPagina > 1 && (
          <>
            <button
              type="button"
              onClick={() => setPagina(1)}
              className={`${botonBase} ${botonNormal}`}
            >
              1
            </button>

            {primeraPagina > 2 && (
              <span className="px-1 text-gray-400">…</span>
            )}
          </>
        )}

        {paginas.map((numero) => (
          <button
            key={numero}
            type="button"
            onClick={() => setPagina(numero)}
            aria-current={pagina === numero ? "page" : undefined}
            aria-label={`Página ${numero}`}
            className={`${botonBase} ${
              pagina === numero ? botonActivo : botonNormal
            }`}
          >
            {numero}
          </button>
        ))}

        {ultimaPagina < totalPaginas && (
          <>
            {ultimaPagina < totalPaginas - 1 && (
              <span className="px-1 text-gray-400">…</span>
            )}

            <button
              type="button"
              onClick={() => setPagina(totalPaginas)}
              className={`${botonBase} ${botonNormal}`}
            >
              {totalPaginas}
            </button>
          </>
        )}

        <button
          type="button"
          onClick={() => setPagina((p) => p + 1)}
          disabled={pagina === totalPaginas}
          aria-label="Página siguiente"
          className={`${botonBase} ${botonNormal} gap-2`}
        >
          <span className="hidden sm:inline">Siguiente</span>
          <span aria-hidden="true" className="text-base leading-none">
            →
          </span>
        </button>
      </div>
    </nav>
  );
}
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

export default Pregunta;
export default function CursoCard({ curso, onClick, acciones }) {
  const { nombre, descripcion, horas, tipo_creador, imagen_url } = curso;

  return (
    <article
      onClick={onClick}
      className={`overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition
        ${onClick ? "cursor-pointer hover:-translate-y-0.5 hover:shadow-md" : ""}`}
    >
      {imagen_url && (
        <img
          src={imagen_url}
          alt={nombre}
          className="h-36 w-full object-cover"
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
      )}

      <div className="p-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-lg font-semibold text-gray-900">{nombre}</h3>
          {tipo_creador && (
            <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs capitalize text-indigo-700">
              {tipo_creador}
            </span>
          )}
        </div>

        <p className="my-2 text-gray-600">{descripcion}</p>

        {horas != null && (
          <p className="text-sm text-gray-500">{horas} horas</p>
        )}

        {acciones && (
          <div
            className="mt-3 flex gap-2"
            onClick={(e) => e.stopPropagation()}
          >
            {acciones}
          </div>
        )}
      </div>
    </article>
  );
}

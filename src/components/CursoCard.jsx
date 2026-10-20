import { tituloCurso } from "../services/cursosService";

export default function CursoCard({ curso, onClick, acciones }) {
  const { descripcion, horas, tipo_creador, imagen_url, publicado, version } =
    curso;
  const titulo = tituloCurso(curso);

  return (
    <article
      onClick={onClick}
      className={`overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition
        ${onClick ? "cursor-pointer hover:-translate-y-0.5 hover:shadow-md" : ""}`}
    >
      {imagen_url && (
        <img
          src={imagen_url}
          alt={titulo}
          className="h-36 w-full object-cover"
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
      )}

      <div className="p-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-lg font-semibold text-gray-900">{titulo}</h3>
          {tipo_creador && (
            <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs capitalize text-indigo-700">
              {tipo_creador}
            </span>
          )}
        </div>

        <p className="my-2 text-gray-600">{descripcion}</p>

        {publicado !== undefined && (
          <p className="mb-1 flex items-center gap-2 text-xs">
            <span
              className={`rounded-full px-2 py-0.5 ${
                publicado
                  ? "bg-green-50 text-green-700"
                  : "bg-amber-50 text-amber-700"
              }`}
            >
              {publicado ? "Publicado" : "Borrador"}
            </span>
            <span className="text-gray-500">v{version ?? 1}</span>
          </p>
        )}

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

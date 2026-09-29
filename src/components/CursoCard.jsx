export default function CursoCard({ curso, onClick }) {
  const { nombre, descripcion, horas, tipo_creador } = curso;

  return (
    <article
      onClick={onClick}
      className={`rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition
        ${onClick ? "cursor-pointer hover:-translate-y-0.5 hover:shadow-md" : ""}`}
    >
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
    </article>
  );
}
import { ESTADOS } from "../../services/usuariosService";

export default function TarjetaUsuario({
  usuario,
  esElMismo,
  rolesEditables,
  onEditar,
  onAlternarEstado,
}) {
  const suspendido = usuario.estado === ESTADOS.BANEADO;

  return (
    <article className="min-w-0 rounded-xl border border-gray-300 bg-white p-4 shadow-sm">
      {/* Nombre y estado */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="break-words font-semibold text-gray-900">
            {usuario.nombre || "Sin nombre"}
            {esElMismo && (
              <span className="ml-2 text-xs font-normal text-gray-400">
                (vos)
              </span>
            )}
          </h3>

          <p className="mt-1 break-all text-sm text-gray-500">
            {usuario.email || "-"}
          </p>
        </div>

        <span
          className={`shrink-0 rounded-full px-2 py-1 text-xs font-medium capitalize ${
            suspendido
              ? "bg-red-100 text-red-700"
              : "bg-green-100 text-green-700"
          }`}
        >
          {usuario.estado || "-"}
        </span>
      </div>

      {/* Rol */}
      <div className="mt-3">
        <span className="rounded-full bg-indigo-100 px-3 py-1 text-sm capitalize text-indigo-700">
          {usuario.rol || "-"}
        </span>
      </div>

      {/* UID */}
      <details className="mt-3 text-xs text-gray-500">
        <summary className="cursor-pointer">
          Ver UID
        </summary>
        <p className="mt-2 break-all font-mono">
          {usuario.uid}
        </p>
      </details>

      {/* Acciones */}
      <div className="mt-4 flex flex-wrap gap-2 border-t border-gray-300 pt-3">
        {rolesEditables.includes(usuario.rol) && (
          <button
            type="button"
            onClick={() => onEditar(usuario)}
            className="flex-1 rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium hover:bg-gray-200"
          >
            Editar
          </button>
        )}

        <button
          type="button"
          onClick={() => onAlternarEstado(usuario)}
          disabled={esElMismo}
          className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium text-white disabled:opacity-40 ${
            suspendido
              ? "bg-green-600 hover:bg-green-700"
              : "bg-red-500 hover:bg-red-600"
          }`}
        >
          {suspendido ? "Reactivar" : "Suspender"}
        </button>
      </div>
    </article>
  );
}
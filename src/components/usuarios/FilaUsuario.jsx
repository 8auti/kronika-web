import { ESTADOS } from "../../services/usuariosService";

export default function FilaUsuario({
  usuario,
  esElMismo,
  rolesEditables,
  onEditar,
  onAlternarEstado,
}) {
  const suspendido = usuario.estado === ESTADOS.BANEADO;

  return (
    <tr className="border-t border-gray-300">
      <td className="px-4 py-3">
        {usuario.nombre || "-"}

        {esElMismo && (
          <span className="ml-2 text-xs text-gray-400">
            (vos)
          </span>
        )}
      </td>

      <td className="px-4 py-3">
        {usuario.email || "-"}
      </td>

      <td className="px-4 py-3">
        <span className="rounded-full bg-indigo-100 px-3 py-1 text-sm capitalize text-indigo-700">
          {usuario.rol || "-"}
        </span>
      </td>

      <td className="px-4 py-3">
        <span
          className={`rounded-full px-3 py-1 text-sm capitalize ${
            suspendido
              ? "bg-red-100 text-red-700"
              : "bg-green-100 text-green-700"
          }`}
        >
          {usuario.estado || "-"}
        </span>
      </td>

      <td
        className="max-w-xs truncate px-4 py-3 font-mono text-xs text-gray-500"
        title={usuario.uid}
      >
        {usuario.uid}
      </td>

      <td className="whitespace-nowrap px-4 py-3 text-right">
        {rolesEditables.includes(usuario.rol) && (
          <button
            type="button"
            onClick={() => onEditar(usuario)}
            className="mr-2 rounded-lg bg-gray-200 px-3 py-2 font-medium text-gray-800 hover:bg-gray-300"
          >
            Editar
          </button>
        )}

        <button
          type="button"
          onClick={() => onAlternarEstado(usuario)}
          disabled={esElMismo}
          title={
            esElMismo
              ? "No podés suspenderte a vos mismo"
              : undefined
          }
          className={`rounded-lg px-3 py-2 font-medium text-white disabled:cursor-not-allowed disabled:opacity-40 ${
            suspendido
              ? "bg-green-600 hover:bg-green-700"
              : "bg-red-500 hover:bg-red-600"
          }`}
        >
          {suspendido ? "Reactivar" : "Suspender"}
        </button>
      </td>
    </tr>
  );
}
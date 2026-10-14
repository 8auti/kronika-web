import FilaUsuario from "./FilaUsuario";
import TarjetaUsuario from "./TarjetaUsuario";

export default function ListaUsuarios({
  usuarios,
  usuarioActualUid,
  rolesEditables,
  onEditar,
  onAlternarEstado,
  cargando,
  hayUsuariosRegistrados,
}) {
  if (cargando) {
    return <p className="p-6">Cargando usuarios...</p>;
  }

  if (usuarios.length === 0) {
    return (
      <div className="rounded-xl border border-gray-300 bg-white p-8 text-center">
        {hayUsuariosRegistrados
          ? "Ningún usuario coincide con la búsqueda."
          : "No hay usuarios registrados."}
      </div>
    );
  }

  return (
    <>
      {/* Escritorio: tabla */}
      <div className="hidden overflow-x-auto rounded-xl border border-gray-300 bg-white shadow-sm md:block">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left">Nombre</th>
              <th className="px-4 py-3 text-left">Email</th>
              <th className="px-4 py-3 text-left">Rol</th>
              <th className="px-4 py-3 text-left">Estado</th>
              <th className="px-4 py-3 text-left">UID</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>

          <tbody>
            {usuarios.map((usuario) => (
              <FilaUsuario
                key={usuario.uid}
                usuario={usuario}
                esElMismo={usuario.uid === usuarioActualUid}
                rolesEditables={rolesEditables}
                onEditar={onEditar}
                onAlternarEstado={onAlternarEstado}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Móvil: tarjetas */}
      <div className="grid gap-3 md:hidden">
        {usuarios.map((usuario) => (
          <TarjetaUsuario
            key={usuario.uid}
            usuario={usuario}
            esElMismo={usuario.uid === usuarioActualUid}
            rolesEditables={rolesEditables}
            onEditar={onEditar}
            onAlternarEstado={onAlternarEstado}
          />
        ))}
      </div>
    </>
  );
}
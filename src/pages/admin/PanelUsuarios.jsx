import { useEffect, useMemo, useState } from "react";

import Navbar from "../../components/Navbar";
import { useAuth } from "../../auth/useAuth";
import {
  ROLES,
  actualizarUsuario,
  cambiarEstadoUsuario,
  completarEstados,
  ESTADOS,
  crearUsuario,
  getUsuarios,
} from "../../services/usuariosService";

const FORMULARIO_VACIO = {
  nombre: "",
  email: "",
  rol: "profesor",
  password: "",
};

export default function PanelUsuarios() {
  const { rol, usuario: usuarioActual } = useAuth();

  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [busqueda, setBusqueda] = useState("");

  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [editandoUid, setEditandoUid] = useState(null);
  const [formulario, setFormulario] = useState(FORMULARIO_VACIO);

  const editando = editandoUid !== null;
  const editandoseASiMismo = editandoUid === usuarioActual?.uid;

  const cargarUsuarios = async () => {
    try {
      setCargando(true);
      setError("");

      let lista = await getUsuarios();

      // Guarda el campo "estado" en los perfiles que aún no lo tienen
      if (lista.some((u) => u.sinEstado)) {
        try {
          await completarEstados(lista);
          lista = lista.map((u) => ({ ...u, sinEstado: false }));
        } catch (error) {
          console.error("No se pudo completar el estado:", error);
        }
      }

      setUsuarios(lista);
    } catch (error) {
      console.error(error);
      setError("No se pudieron cargar los usuarios.");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const usuariosFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();

    if (!texto) return usuarios;

    return usuarios.filter((u) =>
      [u.nombre, u.email, u.rol, u.estado]
        .filter(Boolean)
        .some((campo) => campo.toLowerCase().includes(texto))
    );
  }, [usuarios, busqueda]);

  const cambiarFormulario = (e) => {
    const { name, value } = e.target;
    setFormulario((actual) => ({ ...actual, [name]: value }));
  };

  const cerrarFormulario = () => {
    setMostrarFormulario(false);
    setEditandoUid(null);
    setFormulario(FORMULARIO_VACIO);
  };

  const abrirCrear = () => {
    setMensaje("");
    setError("");
    setEditandoUid(null);
    setFormulario(FORMULARIO_VACIO);
    setMostrarFormulario(true);
  };

  const abrirEditar = (u) => {
    setMensaje("");
    setError("");
    setEditandoUid(u.uid);
    setFormulario({
      nombre: u.nombre || "",
      email: u.email || "",
      rol: u.rol || "profesor",
      password: "",
    });
    setMostrarFormulario(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const guardar = async (e) => {
    e.preventDefault();

    try {
      setGuardando(true);
      setError("");
      setMensaje("");

      if (editando) {
        await actualizarUsuario(editandoUid, formulario);
        setMensaje("Usuario actualizado correctamente.");
      } else {
        await crearUsuario(formulario);
        setMensaje("Usuario creado correctamente.");
      }

      cerrarFormulario();
      await cargarUsuarios();
    } catch (error) {
      console.error(error);
      setError(
        error.message ||
          (editando
            ? "No se pudo actualizar el usuario."
            : "No se pudo crear el usuario.")
      );
    } finally {
      setGuardando(false);
    }
  };

  const alternarEstado = async (u) => {
    const nuevoEstado =
      u.estado === ESTADOS.BANEADO ? ESTADOS.ACTIVO : ESTADOS.BANEADO;

    if (nuevoEstado === ESTADOS.BANEADO) {
      const confirmar = window.confirm(
        `¿Seguro que querés suspender a ${u.nombre || u.email}? No podrá iniciar sesión.`
      );

      if (!confirmar) return;
    }

    try {
      setError("");
      setMensaje("");

      await cambiarEstadoUsuario(u.uid, nuevoEstado);

      setMensaje(
        nuevoEstado === ESTADOS.BANEADO
          ? "Usuario suspendido correctamente."
          : "Usuario reactivado correctamente."
      );
      await cargarUsuarios();
    } catch (error) {
      console.error(error);
      setError(error.message || "No se pudo cambiar el estado.");
    }
  };

  return (
    <>
      <Navbar rol={rol} />

      <main className="mx-auto max-w-7xl p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Gestión de usuarios</h1>
            <p className="mt-1 text-gray-500">
              Administración de usuarios de Kronika
            </p>
          </div>

          <button
            type="button"
            onClick={mostrarFormulario ? cerrarFormulario : abrirCrear}
            className="rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700"
          >
            {mostrarFormulario ? "Cancelar" : "Nuevo usuario"}
          </button>
        </div>

        {error && (
          <div className="mb-6 rounded-lg bg-red-100 p-4 text-red-700">
            {error}
          </div>
        )}

        {mensaje && (
          <div className="mb-6 rounded-lg bg-green-100 p-4 text-green-700">
            {mensaje}
          </div>
        )}

        {mostrarFormulario && (
          <form
            onSubmit={guardar}
            className="mb-8 rounded-xl border bg-white p-6 shadow-sm"
          >
            <h2 className="mb-4 text-xl font-semibold">
              {editando ? "Editar usuario" : "Crear usuario"}
            </h2>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Nombre
                </label>
                <input
                  type="text"
                  name="nombre"
                  value={formulario.nombre}
                  onChange={cambiarFormulario}
                  required
                  className="w-full rounded-lg border px-3 py-2"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formulario.email}
                  onChange={cambiarFormulario}
                  required
                  disabled={editando}
                  className="w-full rounded-lg border px-3 py-2 disabled:bg-gray-100 disabled:text-gray-500"
                />
              </div>

              {!editando && (
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Contraseña
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formulario.password}
                    onChange={cambiarFormulario}
                    required
                    minLength={6}
                    autoComplete="new-password"
                    className="w-full rounded-lg border px-3 py-2"
                  />
                </div>
              )}

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Rol
                </label>
                <select
                  name="rol"
                  value={formulario.rol}
                  onChange={cambiarFormulario}
                  disabled={editandoseASiMismo}
                  className="w-full rounded-lg border px-3 py-2 capitalize disabled:bg-gray-100 disabled:text-gray-500"
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>

                {editandoseASiMismo && (
                  <p className="mt-1 text-xs text-gray-500">
                    No podés cambiar tu propio rol.
                  </p>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={guardando}
              className="mt-6 rounded-lg bg-green-600 px-5 py-2 font-medium text-white hover:bg-green-700 disabled:opacity-50"
            >
              {guardando
                ? "Guardando..."
                : editando
                  ? "Guardar cambios"
                  : "Crear usuario"}
            </button>
          </form>
        )}

        <input
          type="search"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre, email, rol o estado..."
          className="mb-4 w-full rounded-lg border bg-white px-3 py-2 md:max-w-sm"
        />

        {cargando ? (
          <p>Cargando usuarios...</p>
        ) : usuariosFiltrados.length === 0 ? (
          <div className="rounded-xl border bg-white p-8 text-center">
            {usuarios.length === 0
              ? "No hay usuarios registrados."
              : "Ningún usuario coincide con la búsqueda."}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">
            <table className="w-full">
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
                {usuariosFiltrados.map((u) => {
                  const esElMismo = u.uid === usuarioActual?.uid;

                  return (
                    <tr key={u.uid} className="border-t">
                      <td className="px-4 py-3">
                        {u.nombre || "-"}
                        {esElMismo && (
                          <span className="ml-2 text-xs text-gray-400">
                            (vos)
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3">{u.email || "-"}</td>

                      <td className="px-4 py-3">
                        <span className="rounded-full bg-indigo-100 px-3 py-1 text-sm capitalize text-indigo-700">
                          {u.rol || "-"}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-3 py-1 text-sm capitalize ${
                            u.estado === ESTADOS.BANEADO
                              ? "bg-red-100 text-red-700"
                              : "bg-green-100 text-green-700"
                          }`}
                        >
                          {u.estado}
                        </span>
                      </td>

                      <td className="max-w-xs truncate px-4 py-3 font-mono text-xs text-gray-500">
                        {u.uid}
                      </td>

                      <td className="whitespace-nowrap px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => abrirEditar(u)}
                          className="mr-2 rounded-lg bg-gray-200 px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-300"
                        >
                          Editar
                        </button>

                        <button
                          type="button"
                          onClick={() => alternarEstado(u)}
                          disabled={esElMismo}
                          title={
                            esElMismo
                              ? "No podés suspenderte a vos mismo"
                              : undefined
                          }
                          className={`rounded-lg px-3 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40 ${
                            u.estado === ESTADOS.BANEADO
                              ? "bg-green-600 hover:bg-green-700"
                              : "bg-red-500 hover:bg-red-600"
                          }`}
                        >
                          {u.estado === ESTADOS.BANEADO
                            ? "Reactivar"
                            : "Suspender"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </>
  );
}

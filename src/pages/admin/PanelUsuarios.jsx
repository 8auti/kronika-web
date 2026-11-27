import GestorUsuarios from "../../components/usuarios/GestorUsuarios";
import { ROLES_ADMIN } from "../../services/usuariosService";

// El admin crea y edita todos los roles (admin, editor, institución,
// profesor, alumno y usuario), y ve a qué institución pertenece cada
// profesor y alumno.
export default function PanelUsuarios() {
  return (
    <GestorUsuarios
      titulo="Gestión de usuarios"
      descripcion="Administración de usuarios de Kronika"
      rolesCreables={ROLES_ADMIN}
      mostrarInstitucion
    />
  );
}

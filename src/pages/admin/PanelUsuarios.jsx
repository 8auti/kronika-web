import GestorUsuarios from "../../components/GestorUsuarios";
import { ROLES } from "../../services/usuariosService";

// El admin crea/edita admin, editor e institución.
// Profesores y alumnos los gestiona la institución: el admin solo
// puede verlos y suspenderlos.
export default function PanelUsuarios() {
  return (
    <GestorUsuarios
      titulo="Gestión de usuarios"
      descripcion="Administración de usuarios de Kronika"
      rolesCreables={ROLES}
    />
  );
}

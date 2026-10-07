import GestorUsuarios from "../../components/GestorUsuarios";
import { useAuth } from "../../auth/useAuth";
import { ROLES_INSTITUCION } from "../../services/usuariosService";

// La institución solo ve y gestiona sus profesores y alumnos.
export default function PanelOrganizacion() {
  const { usuario } = useAuth();

  return (
    <GestorUsuarios
      titulo="Organización"
      descripcion="Gestión de profesores y alumnos de tu institución"
      rolesCreables={ROLES_INSTITUCION}
      rolesVisibles={ROLES_INSTITUCION}
      institucionId={usuario.uid}
    />
  );
}

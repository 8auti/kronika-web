import {
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import Login from "./auth/Login";
import RutaProtegida from "./auth/RutaProtegida";

import Landing from "./pages/Landing";
import SinAcceso from "./pages/SinAcceso";

import PanelUsuarios from "./pages/admin/PanelUsuarios";
import PanelOrganizacion from "./pages/institucion/PanelOrganizacion";
import PanelCursos from "./pages/editor/PanelCursos";
import PanelLecciones from "./pages/editor/PanelLecciones";
import PanelPreguntas from "./pages/editor/PanelPreguntas";
import PanelAulas from "./pages/profesor/PanelAulas";
import PanelCursosAula from "./pages/profesor/PanelCursosAula";

export default function App() {
  return (
    <Routes>
      {/* Público */}
      <Route path="/login" element={<Login />} />
      <Route path="/landing" element={<Landing />} />

      {/* Admin */}
      <Route
        path="/usuarios"
        element={
          <RutaProtegida rolesPermitidos={["admin"]}>
            <PanelUsuarios />
          </RutaProtegida>
        }
      />

      {/* Institución (el admin no accede) */}
      <Route
        path="/organizacion"
        element={
          <RutaProtegida rolesPermitidos={["institucion"]}>
            <PanelOrganizacion />
          </RutaProtegida>
        }
      />

      {/* Editor: cursos de Kronika */}
      <Route
        path="/cursos"
        element={
          <RutaProtegida
            rolesPermitidos={["editor"]}
          >
            <PanelCursos />
          </RutaProtegida>
        }
      />

      <Route
        path="/cursos/:cursoId/lecciones"
        element={
          <RutaProtegida rolesPermitidos={["editor"]}>
            <PanelLecciones />
          </RutaProtegida>
        }
      />

      <Route
        path="/cursos/:cursoId/lecciones/:leccionId/preguntas"
        element={
          <RutaProtegida rolesPermitidos={["editor"]}>
            <PanelPreguntas />
          </RutaProtegida>
        }
      />

      {/* Profesor: aulas y sus cursos */}
      <Route
        path="/aulas"
        element={
          <RutaProtegida rolesPermitidos={["profesor"]}>
            <PanelAulas />
          </RutaProtegida>
        }
      />

      <Route
        path="/aulas/:aulaId/cursos"
        element={
          <RutaProtegida rolesPermitidos={["profesor"]}>
            <PanelCursosAula />
          </RutaProtegida>
        }
      />

      <Route
        path="/aulas/:aulaId/cursos/:cursoId/lecciones"
        element={
          <RutaProtegida rolesPermitidos={["profesor"]}>
            <PanelLecciones />
          </RutaProtegida>
        }
      />

      <Route
        path="/aulas/:aulaId/cursos/:cursoId/lecciones/:leccionId/preguntas"
        element={
          <RutaProtegida rolesPermitidos={["profesor"]}>
            <PanelPreguntas />
          </RutaProtegida>
        }
      />

      <Route
        path="/sin-acceso"
        element={<SinAcceso />}
      />

      {/* Inicio */}
      <Route
        path="/"
        element={<Inicio />}
      />

      <Route
        path="*"
        element={<Navigate to="/" replace />}
      />
    </Routes>
  );
}

function Inicio() {
  return (
    <Navigate to="/landing" replace />
  );
}



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
import PanelCursos from "./pages/editor/PanelCursos";
import PanelLecciones from "./pages/editor/PanelLecciones";
import PanelPreguntas from "./pages/editor/PanelPreguntas";

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

      {/* Editor + Profesor */}
      <Route
        path="/cursos"
        element={
          <RutaProtegida
            rolesPermitidos={["editor", "profesor"]}
          >
            <PanelCursos />
          </RutaProtegida>
        }
      />

      <Route
        path="/cursos/:cursoId/lecciones"
        element={
          <RutaProtegida rolesPermitidos={["editor", "profesor"]}>
            <PanelLecciones />
          </RutaProtegida>
        }
      />

      <Route
        path="/cursos/:cursoId/lecciones/:leccionId/preguntas"
        element={
          <RutaProtegida rolesPermitidos={["editor", "profesor"]}>
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



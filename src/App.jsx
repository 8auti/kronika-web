import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import { useAuth } from "./auth/useAuth.jsx";

import Login from "./auth/Login";
import RutaProtegida from "./auth/RutaProtegida";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer.jsx";
import DashboardShell from "./components/DashboardShell.jsx";
import { ROLES_CON_DASHBOARD } from "./config/menuPorRol.js";

import Landing from "./pages/Landing";
import SinAcceso from "./pages/SinAcceso";

import PanelUsuarios from "./pages/admin/PanelUsuarios";
import PanelOrganizacion from "./pages/institucion/PanelOrganizacion";
import PanelCursos from "./pages/editor/PanelCursos";
import PanelCurso from "./pages/editor/PanelCurso";
import PanelNodo from "./pages/editor/PanelNodo";
import PanelAulas from "./pages/profesor/PanelAulas";
import PanelCursosAula from "./pages/profesor/PanelCursosAula";

// Layout con navbar: todas las rutas anidadas lo muestran
function MainLayout() {
  const { usuario, rol, cargando } = useAuth();

  return (
    <>
      {!cargando && <Navbar rol={usuario ? rol : null} />}
      <Outlet />
      <Footer />
    </>
  );
}

export default function App() {
  return (
    <Routes>
      {/* Con navbar */}
      <Route element={<MainLayout />}>
        {/* Público */}
        <Route path="/landing" element={<Landing />} />
        <Route path="/sin-acceso" element={<SinAcceso />} />
        <Route path="/login" element={<Login />} />

        {/* Dashboard: navbar arriba + sidebar al costado.
            Entra cualquier rol con dashboard; cada grupo restringe a su rol. */}
        <Route element={<RutaProtegida rolesPermitidos={ROLES_CON_DASHBOARD} />}>
          <Route element={<DashboardShell />}>
            {/* Admin */}
            <Route element={<RutaProtegida rolesPermitidos={["admin"]} />}>
              <Route path="/usuarios" element={<PanelUsuarios />} />
            </Route>

            {/* Institución (el admin no accede) */}
            <Route element={<RutaProtegida rolesPermitidos={["institucion"]} />}>
              <Route path="/organizacion" element={<PanelOrganizacion />} />
            </Route>

            {/* Editor: cursos de Kronika */}
            <Route element={<RutaProtegida rolesPermitidos={["editor"]} />}>
              <Route path="/cursos" element={<PanelCursos />} />
              <Route path="/cursos/:cursoId" element={<PanelCurso />} />
              <Route
                path="/cursos/:cursoId/nodos/:nodoId"
                element={<PanelNodo />}
              />
            </Route>

            {/* Profesor: aulas y sus cursos */}
            <Route element={<RutaProtegida rolesPermitidos={["profesor"]} />}>
              <Route path="/aulas" element={<PanelAulas />} />
              <Route path="/aulas/:aulaId/cursos" element={<PanelCursosAula />} />
              <Route
                path="/aulas/:aulaId/cursos/:cursoId"
                element={<PanelCurso />}
              />
              <Route
                path="/aulas/:aulaId/cursos/:cursoId/nodos/:nodoId"
                element={<PanelNodo />}
              />
            </Route>
          </Route>
        </Route>
      </Route>

      {/* Redirecciones */}
      <Route path="/" element={<Navigate to="/landing" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
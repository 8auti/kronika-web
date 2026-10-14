import {
  Activity,
  BookOpen,
  Building2,
  ClipboardList,
  Library,
  MessageSquare,
  School,
  TrendingUp,
  Users,
} from "lucide-react";

// Un solo lugar para definir qué ve cada rol en el sidebar.
// `end: true` hace que el ítem solo se marque con la ruta exacta.
export const menuPorRol = {
  admin: [
    { to: "/usuarios", label: "Usuarios", icon: Users },
    { to: "/metricas", label: "Métricas", icon: Activity },
  ],
  editor: [
    { to: "/cursos", label: "Cursos", icon: BookOpen },
    { to: "/coleccionables", label: "Coleccionables", icon: Library },
  ],
  institucion: [
    { to: "/organizacion", label: "Organización", icon: Building2 },
  ],
  profesor: [
    { to: "/aulas", label: "Aulas", icon: School },
    { to: "/reportes", label: "Reportes de desempeño", icon: ClipboardList },
    { to: "/progreso", label: "Progreso de alumnos", icon: TrendingUp },
    { to: "/comunicacion", label: "Comunicación", icon: MessageSquare },
  ],
};

// Roles que entran al dashboard (cualquier otro va a /sin-acceso)
export const ROLES_CON_DASHBOARD = Object.keys(menuPorRol);

export const PLANES = [
  {
    nombre: "Aula",
    descripcion: "Para un profesor y su grupo.",
    precio: 29,
    cta: "Elegir Aula",
    items: [
      "1 profesor",
      "Hasta 40 alumnos",
      "Clases con código de invitación",
      "Asignación de cursos y lecciones",
      "Seguimiento de progreso",
    ],
  },
  {
    nombre: "Colegio",
    descripcion: "Para toda una institución.",
    precio: 149,
    destacado: true,
    cta: "Elegir Colegio",
    items: [
      "Profesores ilimitados",
      "Hasta 500 alumnos",
      "Todo lo de Aula",
      "Contenido propio desde el panel web",
      "Reportes de desempeño",
      "Soporte prioritario",
    ],
  },
  {
    nombre: "Red de instituciones",
    descripcion: "Para varias sedes o colegios.",
    precio: null,
    cta: "Hablar con ventas",
    items: [
      "Alumnos y sedes a convenir",
      "Todo lo de Colegio",
      "Gestor de cuenta dedicado",
      { texto: "Próximamente: marca propia", pronto: true },
      { texto: "Próximamente: analíticas avanzadas", pronto: true },
    ],
  },
];
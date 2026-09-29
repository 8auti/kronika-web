import { useEffect, useState } from "react";
import CursoCard from "./components/CursoCard";
import { getCursos } from "./services/cursosService";

function App() {
  return <ListaCursos />;
}

function ListaCursos() {
  const [cursos, setCursos] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    getCursos()
      .then(setCursos)
      .finally(() => setCargando(false));
  }, []);

  if (cargando) return <p>Cargando...</p>;

  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4 p-4">
      {cursos.map((c) => (
        <CursoCard key={c.id} curso={c} />
      ))}
    </div>
  );
}

export default App;
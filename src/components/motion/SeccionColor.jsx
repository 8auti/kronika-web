import useEnVista from "./UseEnVista";

function SeccionColor({ tono, children }) {
  const [ref, visto] = useEnVista(0.25);
  return (
    <section
      ref={ref}
      className={`transition-colors duration-1000 ease-out motion-reduce:transition-none ${
        visto ? tono : "bg-white"
      }`}
    >
      {children}
    </section>
  );
}

export default SeccionColor;
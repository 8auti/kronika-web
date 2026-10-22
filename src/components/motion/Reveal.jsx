import useEnVista from "./UseEnVista";

const DIRECCIONES = {
  up: { "--x": "0", "--y": "1.5rem" },
  left: { "--x": "-2.5rem", "--y": "0" },
  right: { "--x": "2.5rem", "--y": "0" },
  zoom: { "--x": "0", "--y": "0.75rem", "--s": "0.9" },
};

function Reveal({ as: Tag = "div", dir = "up", delay = 0, className = "", children }) {
  const [ref, visto] = useEnVista(0.15);
  return (
    <Tag
      ref={ref}
      className={`reveal ${visto ? "visto" : ""} ${className}`}
      style={{ ...DIRECCIONES[dir], "--d": `${delay}ms` }}
    >
      {children}
    </Tag>
  );
}

export default Reveal;
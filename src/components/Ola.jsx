function Ola({ className = "", invertida = false, fondo = "bg-white" }) {
  return (
    <div
      aria-hidden="true"
      className={`overflow-hidden leading-none ${fondo} ${invertida ? "rotate-180" : ""}`}
    >
      <svg
        viewBox="0 0 1440 120"
        preserveAspectRatio="none"
        className={`ondea block h-12 w-[110%] max-w-none md:h-24 ${className}`}
      >
        <path
          d="M0,70 C200,10 420,10 700,45 C980,80 1200,95 1440,35 L1440,121 L0,121 Z"
          fill="currentColor"
        />
      </svg>
    </div>
  );
}

export default Ola;
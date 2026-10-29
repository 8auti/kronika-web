import { useEffect, useRef, useState } from "react";

/**
 * Mascota animada
 * - Pop-up de entrada (cuando entra al viewport)
 * - Sigue el mouse: inclinación 3D + parallax por capas + pupilas
 * - Click: rebote
 * - Respeta prefers-reduced-motion
 *
 * Uso: <Mascot className="w-64 md:w-96" />
 */

// Cuánto se desplaza cada capa (en unidades del viewBox) cuando el mouse
// está en el extremo. Más profundidad = más movimiento.
const DEPTH = {
  earsBack: 6,
  earsFront: 10,
  head: 14,
  mask: 20,
  chest: 18,
  eyes: 24,
  beak: 28,
};

const PUPIL_TRAVEL = 30; // recorrido extra de la pupila dentro del ojo
const TILT_DEG = 10; // inclinación 3D máxima
const RANGE = 500; // px de distancia del mouse para llegar al máximo
const EASE = 0.12; // suavizado (0-1). Menor = más lento
const GAZE = 1; // fuerza al mirar el CTA (1 = giro máximo, sin importar la distancia)

const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

export default function Mascot({
  className = "w-72",
  label = "Mascota",
  popOnView = true,
  active = false, // true = la mascota se emociona (hover/focus en el CTA)
  lookAtRef = null, // ref del elemento al que mira cuando active = true
}) {
  const wrapRef = useRef(null);
  const tiltRef = useRef(null);
  const svgRef = useRef(null);
  const [popped, setPopped] = useState(!popOnView);
  const activeRef = useRef(active);
  const aimRef = useRef(null);

  // Al activarse/desactivarse, recalcula hacia dónde mirar
  useEffect(() => {
    activeRef.current = active;
    aimRef.current?.();
  }, [active]);

  // ---- Pop-up al entrar al viewport -------------------------------------
  useEffect(() => {
    if (!popOnView) return;
    const el = wrapRef.current;
    if (!el || !("IntersectionObserver" in window)) {
      setPopped(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setPopped(true);
          io.disconnect();
        }
      },
      { threshold: 0.35 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [popOnView]);

  // ---- Seguimiento del mouse -------------------------------------------
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduce.matches) return;

    const svg = svgRef.current;
    const tilt = tiltRef.current;
    const layers = [...svg.querySelectorAll("[data-depth]")].map((node) => ({
      node,
      depth: DEPTH[node.dataset.depth] ?? 0,
    }));
    const pupils = [...svg.querySelectorAll("[data-pupil]")];

    const target = { x: 0, y: 0 };
    const current = { x: 0, y: 0 };
    let raf = 0;

    const render = () => {
      current.x += (target.x - current.x) * EASE;
      current.y += (target.y - current.y) * EASE;

      tilt.style.transform = `perspective(900px) rotateY(${
        current.x * TILT_DEG
      }deg) rotateX(${-current.y * TILT_DEG * 0.8}deg)`;

      for (const { node, depth } of layers) {
        node.style.transform = `translate(${current.x * depth}px, ${
          current.y * depth * 0.7
        }px)`;
      }
      for (const p of pupils) {
        p.style.transform = `translate(${current.x * PUPIL_TRAVEL}px, ${
          current.y * PUPIL_TRAVEL
        }px)`;
      }

      const settled =
        Math.abs(target.x - current.x) < 0.001 &&
        Math.abs(target.y - current.y) < 0.001;
      raf = settled ? 0 : requestAnimationFrame(render);
    };

    const kick = () => {
      if (!raf) raf = requestAnimationFrame(render);
    };

    const pointer = { x: null, y: null };

    // Decide hacia dónde mirar: el elemento CTA si está activo, si no el mouse
    const aim = () => {
      let px = pointer.x;
      let py = pointer.y;
      const el = lookAtRef?.current;
      if (activeRef.current && el) {
        // Mira hacia el CTA con fuerza fija: solo importa la dirección
        const b = el.getBoundingClientRect();
        const r = svg.getBoundingClientRect();
        const dx = b.left + b.width / 2 - (r.left + r.width / 2);
        const dy = b.top + b.height / 2 - (r.top + r.height / 2);
        const len = Math.hypot(dx, dy) || 1;
        target.x = (dx / len) * GAZE;
        target.y = (dy / len) * GAZE;
        kick();
        return;
      }
      if (px === null) {
        target.x = 0;
        target.y = 0;
      } else {
        const r = svg.getBoundingClientRect();
        target.x = clamp((px - (r.left + r.width / 2)) / RANGE, -1, 1);
        target.y = clamp((py - (r.top + r.height / 2)) / RANGE, -1, 1);
      }
      kick();
    };
    aimRef.current = aim;

    const onMove = (e) => {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      aim();
    };

    const onLeave = () => {
      pointer.x = null;
      pointer.y = null;
      aim();
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    window.addEventListener("blur", onLeave);

    return () => {
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("blur", onLeave);
      aimRef.current = null;
      cancelAnimationFrame(raf);
    };
  }, []);

  // ---- Click: rebote ----------------------------------------------------
  const bounce = () => {
    svgRef.current?.animate(
      [
        { transform: "scale(1, 1)" },
        { transform: "scale(1.08, 0.88)", offset: 0.25 },
        { transform: "scale(0.94, 1.1) translateY(-4%)", offset: 0.55 },
        { transform: "scale(1, 1)" },
      ],
      { duration: 450, easing: "cubic-bezier(.34,1.56,.64,1)" }
    );
  };

  return (
    <div
      ref={wrapRef}
      className={`mascot-pop ${popped ? "is-popped" : ""} ${
        active ? "is-excited" : ""
      } ${className}`}
    >
      <style>{CSS}</style>

      <div className="mascot-hop">
      <div ref={tiltRef} className="will-change-transform">
        <svg
          ref={svgRef}
          viewBox="0 0 1250 1250"
          role="img"
          aria-label={label}
          onClick={bounce}
          className="block h-auto w-full cursor-pointer select-none overflow-visible"
          style={{ transformOrigin: "50% 90%" }}
        >
          {/* orejas traseras */}
          <g data-depth="earsBack" className="layer">
            <g
              className="ear"
              style={{ transformOrigin: "265px 310px", "--d": "0.38s" }}
            >
              <path
                d="M165 425 C80 380 40 300 55 245 C60 225 90 225 110 235 L265 310 Z"
                fill="#F29427"
              />
            </g>
            <g
              className="ear"
              style={{ transformOrigin: "985px 310px", "--d": "0.42s" }}
            >
              <path
                d="M1085 425 C1170 380 1210 300 1195 245 C1190 225 1160 225 1140 235 L985 310 Z"
                fill="#F29427"
              />
            </g>
          </g>

          {/* orejas delanteras */}
          <g data-depth="earsFront" className="layer">
            <g
              className="ear"
              style={{ transformOrigin: "330px 290px", "--d": "0.46s" }}
            >
              <path
                d="M265 310 C170 305 130 250 112 190 C100 130 130 80 175 80 C210 80 250 115 300 155 L408 250 Z"
                fill="#FDB72C"
              />
            </g>
            <g
              className="ear"
              style={{ transformOrigin: "920px 290px", "--d": "0.5s" }}
            >
              <path
                d="M985 310 C1080 305 1120 250 1138 190 C1150 130 1120 80 1075 80 C1040 80 1000 115 950 155 L842 250 Z"
                fill="#FDB72C"
              />
            </g>
          </g>

          {/* cabeza */}
          <g data-depth="head" className="layer">
            <path
              d="M30 735 C60 600 120 470 200 360 C300 260 400 240 410 250 C480 215 550 205 625 205 C700 205 770 215 845 250 C850 240 950 260 1050 360 C1130 470 1190 600 1222 735 C1230 760 1220 772 1190 772 C1185 900 1100 1000 980 1030 C940 1045 900 1045 860 1045 L390 1045 C350 1045 310 1040 270 1030 C150 1000 65 900 70 772 C40 772 25 760 30 735 Z"
              fill="#FDB72C"
            />
          </g>

          {/* antifaz */}
          <g data-depth="mask" className="layer">
            <ellipse cx="385" cy="620" rx="265" ry="237" fill="#85442B" />
            <ellipse cx="865" cy="620" rx="265" ry="237" fill="#85442B" />
            <path d="M520 430 Q625 495 730 430 L730 720 L520 720 Z" fill="#85442B" />
          </g>

          {/* pecho crema */}
          <g data-depth="chest" className="layer">
            <path
              d="M400 845 C360 890 350 940 365 965 C380 985 405 983 425 983 C400 1020 390 1060 400 1085 C420 1120 480 1130 525 1100 C545 1140 590 1175 625 1175 C660 1175 705 1140 725 1100 C770 1130 830 1120 850 1085 C860 1060 850 1020 825 983 C845 983 870 985 885 965 C900 940 890 890 850 845 L625 700 Z"
              fill="#FBE9C6"
            />
          </g>

          {/* ojos */}
          <g data-depth="eyes" className="layer">
            <circle cx="370" cy="634" r="175" fill="#FFFFFF" />
            <circle cx="880" cy="634" r="175" fill="#FFFFFF" />
            {/* las pupilas se mueven dentro del ojo */}
            <g data-pupil className="layer">
              <g className="pupil-scale">
                <circle cx="390" cy="640" r="125" fill="#6B2F1E" />
                <circle cx="322" cy="590" r="48" fill="#FFFFFF" />
              </g>
            </g>
            <g data-pupil className="layer">
              <g className="pupil-scale">
                <circle cx="862" cy="640" r="125" fill="#6B2F1E" />
                <circle cx="788" cy="590" r="48" fill="#FFFFFF" />
              </g>
            </g>
          </g>

          {/* pico */}
          <g data-depth="beak" className="layer">
            <path
              d="M515 760 C540 710 590 672 625 672 C660 672 710 710 738 760 C725 850 680 930 625 930 C570 930 528 850 515 760 Z"
              fill="#FDB72C"
            />
            <path
              d="M537 775 L625 805 L716 775 C704 850 670 895 625 895 C580 895 548 850 537 775 Z"
              fill="#C8413A"
            />
            <path
              d="M568 848 C582 818 668 818 684 848 C670 882 650 895 625 895 C600 895 582 882 568 848 Z"
              fill="#FF6F6F"
            />
          </g>
        </svg>
      </div>
      </div>
    </div>
  );
}

const CSS = `
  .mascot-pop {
    opacity: 0;
    transform-origin: 50% 100%;
  }
  .mascot-pop.is-popped {
    opacity: 1;
    animation: mascot-pop 0.7s cubic-bezier(.34, 1.56, .64, 1) both;
  }
  .mascot-pop .layer { will-change: transform; }

  /* las orejas "se paran" un instante después del cuerpo */
  .mascot-pop .ear {
    transform-box: view-box;
    transform: scale(0.2);
  }
  .mascot-pop.is-popped .ear {
    animation: mascot-ear 0.55s cubic-bezier(.34, 1.8, .64, 1) var(--d, 0.4s) both;
  }

  /* emoción: nod (asentir) + pupilas dilatadas */
  .mascot-pop .mascot-hop { transform-origin: 50% 75%; }
  .mascot-pop.is-excited .mascot-hop {
    animation: mascot-nod 0.2s ease-out 3;
  }
  .mascot-pop .pupil-scale {
    transform-box: fill-box;
    transform-origin: center;
    transition: transform 0.25s cubic-bezier(.34, 1.56, .64, 1);
  }
  .mascot-pop.is-excited .pupil-scale { transform: scale(1.14); }

  @keyframes mascot-nod {
    0%, 100% { transform: perspective(700px) rotateX(0deg) translateY(0); }
    40%      { transform: perspective(700px) rotateX(-9deg) translateY(1.5%); }
  }

  @keyframes mascot-pop {
    0%   { opacity: 0; transform: translateY(18%) scale(0.2); }
    60%  { opacity: 1; }
    100% { opacity: 1; transform: translateY(0) scale(1); }
  }
  @keyframes mascot-ear {
    0%   { transform: scale(0.2) rotate(-12deg); }
    100% { transform: scale(1) rotate(0deg); }
  }

  @media (prefers-reduced-motion: reduce) {
    .mascot-pop,
    .mascot-pop.is-popped,
    .mascot-pop.is-popped .ear {
      animation: none;
      opacity: 1;
      transform: none;
    }
    .mascot-pop.is-excited .mascot-hop { animation: none; }
  }
`;
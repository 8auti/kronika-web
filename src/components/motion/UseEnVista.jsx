import { useEffect, useRef, useState } from "react";

function useEnVista(umbral = 0.2) {
  const ref = useRef(null);
  const [visto, setVisto] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!("IntersectionObserver" in window)) {
      setVisto(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisto(true);
          io.disconnect();
        }
      },
      { threshold: umbral, rootMargin: "0px 0px -6% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [umbral]);

  return [ref, visto];
}

export default useEnVista;
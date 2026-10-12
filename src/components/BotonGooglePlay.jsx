const GOOGLE_PLAY_URL = "#"; // TODO: link real de la app

import google_play_badge from "/img/google-play-badge.png"

function BotonGooglePlay({ className = "" }) {
  return (
    <a
      href={GOOGLE_PLAY_URL}
      aria-label="Descargar en Google Play"
      className={`inline-block focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-azul ${className}`}
    >
      <img src={google_play_badge} alt="Descargar en Google Play" className="h-11 w-auto" />
    </a>
  );
}

export default BotonGooglePlay;
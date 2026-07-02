import { ImageResponse } from "next/og";

// Imagen de previsualización para redes/WhatsApp (Open Graph + Twitter).
// Generada por código (no requiere asset). 1200×630 es el tamaño recomendado.
//
// ZONA SEGURA: cuando una plataforma muestra el preview como miniatura cuadrada,
// recorta al centro (≈630px de ancho, toda la altura). Por eso todo el contenido
// importante vive en una franja central (~600px) y los laterales son solo fondo.
export const alt = "Pronostico DMO - Disfruta el mundial junto a DMO S.R.L.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background:
            "linear-gradient(135deg, #0a1633 0%, #172554 45%, #1e40af 100%)",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        {/* Franja central segura (~600px) */}
        <div
          style={{
            width: 600,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
          }}
        >
          {/* "Pelota" — círculo blanco (con ⚽ si la fuente lo soporta) */}
          <div
            style={{
              width: 140,
              height: 140,
              borderRadius: 9999,
              background: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 92,
              marginBottom: 30,
            }}
          >
            ⚽
          </div>
          <div
            style={{
              fontSize: 64,
              fontWeight: 800,
              letterSpacing: -2,
              display: "flex",
            }}
          >
            Pronostico DMO
          </div>
          <div
            style={{
              marginTop: 22,
              width: 540,
              fontSize: 34,
              fontWeight: 600,
              lineHeight: 1.3,
              color: "#a7f3d0",
              display: "flex",
              textAlign: "center",
            }}
          >
            Disfruta el mundial junto a DMO S.R.L.
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}

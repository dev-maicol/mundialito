import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Convención de Next.js 16 (reemplaza a middleware.ts).
export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    // Todas las rutas excepto estáticos, imágenes, favicon y las rutas de
    // metadata (opengraph-image/twitter-image), que deben ser públicas para
    // que WhatsApp/Telegram/redes puedan leer la imagen al compartir el link.
    "/((?!_next/static|_next/image|favicon.ico|opengraph-image|twitter-image|icon|apple-icon|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

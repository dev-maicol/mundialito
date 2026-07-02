// Utilidades de formato. Las fechas se muestran en hora de Bolivia (UTC-4).

const BOLIVIA_TZ = "America/La_Paz";

export function formatKickoff(iso: string): string {
  return new Intl.DateTimeFormat("es-BO", {
    timeZone: BOLIVIA_TZ,
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(iso));
}

export function isPastKickoff(iso: string): boolean {
  return new Date(iso).getTime() <= Date.now();
}

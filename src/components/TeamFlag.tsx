// Bandera de un equipo (reutilizable). Usa <img> con un CDN externo.
export default function TeamFlag({
  url,
  name,
  size = 22,
}: {
  url: string | null;
  name: string;
  size?: number;
}) {
  if (!url) return null;
  const h = Math.round(size * 0.66);
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={name}
      width={size}
      height={h}
      loading="lazy"
      decoding="async"
      style={{ width: size, height: h }}
      className="shrink-0 rounded-[3px] object-cover shadow-sm ring-1 ring-slate-500/40"
    />
  );
}

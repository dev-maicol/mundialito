import type { ReactNode } from "react";

export const metadata = { title: "Reglas · Pronostico DMO" };

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="card flex flex-col gap-2 p-4">
      <h2 className="font-bold text-brand">{title}</h2>
      {children}
    </section>
  );
}

function Pts({ children }: { children: ReactNode }) {
  return (
    <span className="badge bg-brandsoft font-semibold text-brand">{children}</span>
  );
}

export default function ReglasPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-extrabold tracking-tight">📋 Cómo participar</h1>
      <p className="text-sm text-muted">
        Estamos en la fase de <strong>eliminatorias</strong>. Pronosticá los partidos,
        sumá puntos y competí en el ranking. Acá está todo lo que necesitás saber.
      </p>

      <Section title="1. Participar">
        <ul className="flex list-disc flex-col gap-1 pl-5 text-sm">
          <li>Creás tu cuenta con el código que te da la organización.</li>
          <li>Un administrador aprueba tu cuenta; recién ahí podés pronosticar.</li>
          <li>
            En <strong>Partidos</strong> vas a ver los que están <strong>abiertos</strong>:
            cargás tu pronóstico y lo confirmás.
          </li>
          <li>
            <strong>Un solo pronóstico por partido</strong> y <strong>no se puede
            modificar</strong> una vez confirmado. ¡Pensalo bien!
          </li>
        </ul>
      </Section>

      <Section title="2. Cuándo se cierra">
        <p className="text-sm text-muted">
          El pronóstico de cada partido se <strong>cierra al iniciar el partido</strong>{" "}
          (hora de Bolivia). Después de esa hora ya no podés pronosticar ni cambiar nada.
          Te conviene cargar tu pronóstico con tiempo.
        </p>
      </Section>

      <Section title="3. Qué se pronostica">
        <ul className="flex list-disc flex-col gap-1 pl-5 text-sm">
          <li>
            El <strong>marcador a los 90 minutos reglamentarios</strong>. No cuentan el
            alargue ni los penales para el marcador.
          </li>
          <li>
            <strong>Qué equipo avanza</strong>. Si tu marcador no es empate, el que
            avanza queda definido por el marcador; si pronosticás <strong>empate</strong>{" "}
            a los 90&apos;, vos elegís quién pasa (porque se definiría en alargue o
            penales).
          </li>
        </ul>
      </Section>

      <Section title="4. Puntos por partido (máximo 5)">
        <ul className="flex flex-col gap-1.5 text-sm">
          <li>
            <Pts>+3</Pts> Acertar <strong>qué equipo avanza</strong>.
          </li>
          <li>
            <Pts>+2</Pts> Acertar el <strong>marcador exacto a los 90&apos;</strong>.
          </li>
        </ul>
        <p className="text-xs text-faint">
          Los puntos se suman: si acertás quién avanza y el marcador exacto, sumás 5.
        </p>
      </Section>

      <Section title="5. Ejemplos">
        <p className="mb-1 text-sm font-medium">
          Resultado real: Brasil 2 – 0 Japón (ganó en los 90&apos;, avanza Brasil)
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-elevated/60 text-left text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-3 py-2">Tu pronóstico</th>
                <th className="px-3 py-2">Qué acertás</th>
                <th className="px-3 py-2 text-center">Puntos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              <tr>
                <td className="px-3 py-2">2 – 0, avanza Brasil</td>
                <td className="px-3 py-2 text-muted">Quién avanza + marcador exacto</td>
                <td className="px-3 py-2 text-center font-bold text-brand">5</td>
              </tr>
              <tr>
                <td className="px-3 py-2">1 – 0, avanza Brasil</td>
                <td className="px-3 py-2 text-muted">Solo quién avanza</td>
                <td className="px-3 py-2 text-center font-bold text-brand">3</td>
              </tr>
              <tr>
                <td className="px-3 py-2">0 – 2, avanza Japón</td>
                <td className="px-3 py-2 text-muted">Nada (ganó Brasil)</td>
                <td className="px-3 py-2 text-center font-bold text-muted">0</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mb-1 mt-4 text-sm font-medium">
          Resultado real: a los 90&apos; quedó 1 – 1 y avanzó Brasil (por penales)
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-elevated/60 text-left text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-3 py-2">Tu pronóstico</th>
                <th className="px-3 py-2">Qué acertás</th>
                <th className="px-3 py-2 text-center">Puntos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              <tr>
                <td className="px-3 py-2">1 – 1, avanza Brasil</td>
                <td className="px-3 py-2 text-muted">Quién avanza + marcador exacto a 90&apos;</td>
                <td className="px-3 py-2 text-center font-bold text-brand">5</td>
              </tr>
              <tr>
                <td className="px-3 py-2">2 – 0, avanza Brasil</td>
                <td className="px-3 py-2 text-muted">Solo quién avanza</td>
                <td className="px-3 py-2 text-center font-bold text-brand">3</td>
              </tr>
              <tr>
                <td className="px-3 py-2">0 – 1, avanza Japón</td>
                <td className="px-3 py-2 text-muted">Nada (avanzó Brasil)</td>
                <td className="px-3 py-2 text-center font-bold text-muted">0</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-faint">
          Ojo: el marcador exacto se cuenta a los 90&apos; reglamentarios, no con el
          resultado de alargue o penales.
        </p>
      </Section>

      <Section title="6. Ranking">
        <p className="text-sm text-muted">
          Todos tus puntos se suman automáticamente al finalizar cada partido. Mirá tu
          posición y la de los demás en la sección <strong>Ranking</strong>. ¡Mucha
          suerte! ⚽
        </p>
        <p className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-sm text-amber-600">
          <strong>En caso de empate</strong> en puntos en el ranking, la organización
          de <strong>DMO S.R.L.</strong> determinará el/los ganador(es).
        </p>
      </Section>
    </div>
  );
}

import ThemeToggle from "@/components/ThemeToggle";
import Footer from "@/components/Footer";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex flex-1 flex-col">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-6 text-center">
            <h1 className="text-3xl font-extrabold tracking-tight">
              <span className="text-xl">⚽</span> <span className="text-gradient">Pronostico DMO</span>
            </h1>
            <p className="mt-1 text-sm text-muted">
              Quiniela deportiva · pronostica y suma puntos
            </p>
          </div>
          <div className="card p-6">{children}</div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

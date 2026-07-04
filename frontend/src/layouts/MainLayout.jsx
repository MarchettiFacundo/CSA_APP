import { useState, useEffect } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { CalendarDays, Wrench, Users, ClipboardCheck, Menu, X, Sun, Moon, Bell, MessageCircle, Lock, Type, HelpCircle } from "lucide-react";
import { cn } from "../lib/utils";
import { useTour } from "../context/TourContext";
import { Tour } from "../components/Tour";

const FONT_SIZES = [
  { label: "A", value: 14, title: "Pequeño" },
  { label: "A", value: 16, title: "Normal" },
  { label: "A", value: 19, title: "Grande" },
];

const NAV_ITEMS = [
  { name: "Turnos", icon: CalendarDays, path: "/turnos" },
  { name: "Órdenes de Trabajo", icon: Wrench, path: "/ordenes" },
  { name: "Clientes/Vehículos", icon: Users, path: "/clientes" },
  { name: "Servicios Periódicos", icon: Bell, path: "/servicios" },
  { name: "Controles Agencia", icon: ClipboardCheck, path: "/agencia" },
  { name: "Recordatorios", icon: MessageCircle, path: "/recordatorios" },
];

export function MainLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  const { startTour } = useTour();

  const [theme, setTheme] = useState(
    localStorage.getItem("theme") || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
  );

  const [fontSize, setFontSize] = useState(
    () => parseInt(localStorage.getItem("fontSize") || "16", 10)
  );

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.style.fontSize = `${fontSize}px`;
    localStorage.setItem("fontSize", String(fontSize));
  }, [fontSize]);

  const toggleTheme = () => setTheme(theme === "light" ? "dark" : "light");

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden print:h-auto print:overflow-visible">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 md:hidden backdrop-blur-sm transition-opacity"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col w-64 bg-card/95 backdrop-blur-xl border-r border-border/50 shadow-2xl transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 print:hidden",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-center h-24 px-4 border-b border-border/50">
          <div className="flex items-center justify-center w-full">
            <img src="/logo.png" alt="CSA Logo" className="w-52 h-auto object-contain drop-shadow-md" />
            {/* Si prefieres que el texto de al lado no aparezca, puedes comentarlo */}
            {/* <span className="text-xl font-black bg-gradient-to-r from-red-600 to-gray-400 dark:from-red-500 dark:to-gray-300 bg-clip-text text-transparent tracking-tight">
              CSA APP
            </span> */}
          </div>
          <button onClick={toggleSidebar} className="md:hidden absolute right-4 p-2 rounded-full hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.name}
                to={item.path}
                onClick={() => setIsSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 group relative overflow-hidden",
                  isActive
                    ? "text-primary bg-primary/10 shadow-sm"
                    : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                )}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full shadow-[0_0_8px_rgba(var(--primary),0.6)]" />
                )}
                <item.icon
                  size={20}
                  className={cn(
                    "transition-all duration-300",
                    isActive ? "text-primary scale-110" : "group-hover:text-foreground group-hover:scale-110"
                  )}
                />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Theme Toggle & Font Size Section */}
        <div className="p-4 border-t border-border/50 bg-card/50 space-y-2">
          {/* Botón de Ayuda Interactiva */}
          <button
            onClick={() => startTour(location.pathname)}
            className="flex items-center justify-between w-full px-4 py-3 text-sm font-bold transition-all duration-300 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 hover:border-primary/40 group shadow-sm"
            title="Iniciar recorrido de ayuda"
          >
            <span className="flex items-center gap-3">
              <HelpCircle size={20} className="text-primary group-hover:scale-110 transition-transform duration-300" />
              Guía de esta Página
            </span>
            <span className="text-[10px] bg-primary text-primary-foreground px-2 py-0.5 rounded-full font-extrabold uppercase animate-pulse">
              Ayuda
            </span>
          </button>

          <button
            onClick={toggleTheme}
            className="flex items-center justify-between w-full px-4 py-3 text-sm font-medium transition-all duration-300 rounded-xl bg-muted/30 hover:bg-muted/80 text-muted-foreground hover:text-foreground border border-transparent hover:border-border/50 group"
          >
            <span className="flex items-center gap-3">
              {theme === "light" ? (
                <>
                  <Sun size={20} className="text-amber-500 group-hover:rotate-45 transition-transform duration-500" /> Modo Claro
                </>
              ) : (
                <>
                  <Moon size={20} className="text-blue-400 group-hover:-rotate-12 transition-transform duration-500" /> Modo Oscuro
                </>
              )}
            </span>
            <div className={cn("w-9 h-5 rounded-full relative transition-colors duration-300", theme === 'dark' ? 'bg-primary/40' : 'bg-border')}>
              <div className={cn("absolute top-0.5 left-0.5 w-4 h-4 rounded-full transition-transform duration-300 shadow-sm", theme === 'dark' ? 'bg-primary translate-x-4' : 'bg-background')} />
            </div>
          </button>

          {/* Font Size Selector */}
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-muted/30 border border-transparent">
            <Type size={15} className="text-muted-foreground shrink-0" />
            <span className="text-xs font-medium text-muted-foreground flex-1">Tamaño fuente</span>
            <div className="flex items-center gap-1">
              {FONT_SIZES.map((fs) => (
                <button
                  key={fs.value}
                  title={fs.title}
                  onClick={() => setFontSize(fs.value)}
                  className={cn(
                    "flex items-center justify-center rounded-lg transition-all duration-200 font-bold leading-none select-none",
                    fontSize === fs.value
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                  )}
                  style={{
                    fontSize: `${fs.value - 4}px`,
                    width: `${fs.value + 8}px`,
                    height: `${fs.value + 8}px`,
                  }}
                >
                  A
                </button>
              ))}
            </div>
          </div>

          {/* Acceso discreto a Finanzas (Admin) */}
          <a
            href="/finanzas"
            target="_blank"
            rel="noopener noreferrer"
            title="Panel Financiero"
            className="flex items-center justify-center gap-2 w-full px-4 py-2 rounded-xl text-xs font-medium text-muted-foreground/40 hover:text-muted-foreground hover:bg-muted/30 transition-all duration-300 group/admin"
          >
            <Lock size={12} className="group-hover/admin:scale-110 transition-transform duration-300" />
            <span className="opacity-0 group-hover/admin:opacity-100 transition-opacity duration-300">
              Panel Financiero
            </span>
          </a>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-background print:overflow-visible print:bg-white">
        {/* Mobile Header */}
        <header className="flex md:hidden items-center justify-between h-20 px-4 border-b border-border/50 bg-card/80 backdrop-blur-xl z-30 sticky top-0 print:hidden">
          <button onClick={toggleSidebar} className="p-2 -ml-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
            <Menu size={24} />
          </button>
          <div className="flex items-center justify-center flex-1">
            <img src="/logo.png" alt="CSA Logo" className="h-14 w-auto object-contain drop-shadow-md" />
          </div>
          <div className="flex items-center gap-2">
            {/* Ayuda en Móvil */}
            <button
              onClick={() => startTour(location.pathname)}
              className="p-2 rounded-full text-primary hover:bg-muted/50 transition-colors"
              title="Guía de esta Página"
            >
              <HelpCircle size={20} />
            </button>
            <button onClick={toggleTheme} className="p-2 rounded-full text-muted-foreground hover:bg-muted/50 transition-colors">
              {theme === 'light' ? <Sun size={20} className="text-amber-500" /> : <Moon size={20} className="text-blue-400" />}
            </button>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto p-4 md:p-8 print:overflow-visible print:p-0">
          <div className="max-w-7xl mx-auto h-full animate-in fade-in slide-in-from-bottom-4 duration-500 print:max-w-none print:h-auto">
            <Outlet />
          </div>
        </div>
      </main>
      <Tour />
    </div>
  );
}

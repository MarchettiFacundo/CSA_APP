import { useState, useEffect } from "react";
import { MessageCircle, Clock, Car, User, Calendar, AlertCircle, EyeOff, ExternalLink, RefreshCw, Undo2 } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

// Generar una clave única para el almacenamiento local basada en el día actual
const getTodayKey = () => {
  const today = new Date();
  return `csa_reminders_processed_${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
};

export function Recordatorios() {
  const [turnos, setTurnos] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Estado local para los turnos procesados (recordados u obviados) en el día de hoy
  const [processedIds, setProcessedIds] = useState(() => {
    try {
      const key = getTodayKey();
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // Guardar cambios de procesados en localStorage
  useEffect(() => {
    try {
      const key = getTodayKey();
      localStorage.setItem(key, JSON.stringify(processedIds));
    } catch (e) {
      console.error("Error al guardar en localStorage:", e);
    }
  }, [processedIds]);

  useEffect(() => {
    fetchTurnosManana();
  }, []);

  const fetchTurnosManana = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/turnos/manana`);
      if (res.ok) {
        const data = await res.json();
        setTurnos(data);
      }
    } catch (error) {
      console.error("Error al cargar turnos de mañana:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendWhatsApp = (turno) => {
    const cliente = turno.vehiculo.propietario;
    const vehiculo = turno.vehiculo;
    const fechaHora = new Date(turno.fecha_hora);
    
    const hora = fechaHora.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const fecha = fechaHora.toLocaleDateString([], { day: '2-digit', month: '2-digit' });

    const nombreCliente = `${cliente.nombre} ${cliente.apellido || ""}`.trim();
    const vehiculoInfo = `${vehiculo.marca} ${vehiculo.modelo}`;

    // Mensaje súper profesional y personalizado
    const mensaje = `Hola ${nombreCliente}! Te recordamos que mañana ${fecha} tenés un turno programado para tu ${vehiculoInfo} (Patente: ${vehiculo.patente}) a las ${hora} hs en el taller CSA. Por favor, confírmanos tu asistencia. ¡Te esperamos!`;

    // Formatear teléfono (remover no-dígitos)
    let cleanPhone = cliente.telefono.replace(/\D/g, "");
    
    // Auto-formateo básico para números de Argentina si tienen longitud estándar de celular
    if (cleanPhone.length === 10) {
      cleanPhone = "549" + cleanPhone;
    } else if (cleanPhone.length === 11 && cleanPhone.startsWith("15")) {
      // Eliminar el 15 si es local de 11 dígitos con prefijo local
      cleanPhone = "549" + cleanPhone.substring(2);
    }

    const waLink = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(mensaje)}`;
    window.open(waLink, "_blank");

    // Marcar como procesado automáticamente al recordar
    handleObviar(turno.id);
  };

  const handleObviar = (id) => {
    setProcessedIds(prev => {
      if (prev.includes(id)) return prev;
      return [...prev, id];
    });
  };

  const handleRestaurar = () => {
    setProcessedIds([]);
  };

  // Filtrar los turnos para no mostrar los que ya han sido procesados (recordados u obviados)
  const turnosVisibles = turnos.filter(t => !processedIds.includes(t.id));

  return (
    <div className="space-y-6">
      {/* Encabezado Principal */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight bg-gradient-to-br from-foreground via-foreground/90 to-muted-foreground bg-clip-text text-transparent drop-shadow-sm">
            Recordatorio de Turnos
          </h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">
            Notificá a los clientes que tienen turno programado para mañana o descartá los recordatorios procesados.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {processedIds.length > 0 && (
            <button
              onClick={handleRestaurar}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border hover:bg-muted text-xs font-bold text-muted-foreground hover:text-foreground transition-all duration-300"
              title="Restaurar recordatorios obviados o enviados hoy"
            >
              <Undo2 size={14} />
              Recomenzar Lista ({processedIds.length})
            </button>
          )}
          <button
            onClick={fetchTurnosManana}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-card hover:bg-muted text-foreground transition-all duration-300 font-medium text-sm disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Actualizar
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
        </div>
      ) : turnosVisibles.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-border rounded-3xl bg-card/20 backdrop-blur-sm max-w-2xl mx-auto my-8">
          <div className="p-4 bg-primary/10 rounded-full text-primary mb-4 animate-bounce">
            <Calendar size={36} />
          </div>
          <h3 className="text-2xl font-bold text-foreground mb-2">
            {turnos.length === 0 ? "No hay turnos para mañana" : "Lista completada"}
          </h3>
          <p className="text-muted-foreground text-sm max-w-sm">
            {turnos.length === 0 
              ? "No hay ingresos programados pendientes para el día de mañana." 
              : "Has procesado (recordado u obviado) todos los recordatorios para los turnos de mañana."}
          </p>
          {processedIds.length > 0 && (
            <button
              onClick={handleRestaurar}
              className="mt-6 flex items-center gap-1.5 px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary font-bold rounded-xl text-sm transition-all duration-200"
            >
              <Undo2 size={16} />
              Restaurar recordatorios procesados
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {turnosVisibles.map((turno) => {
            const cliente = turno.vehiculo?.propietario;
            const vehiculo = turno.vehiculo;
            const horaTurno = new Date(turno.fecha_hora).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            
            return (
              <div
                key={turno.id}
                className="group relative flex flex-col justify-between p-6 rounded-2xl border border-border/60 bg-card/85 hover:bg-card backdrop-blur-md shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden"
              >
                {/* Indicador superior estético */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500/80 to-amber-600/40" />

                <div>
                  {/* Encabezado de Tarjeta (Hora) */}
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-xs font-bold shadow-sm">
                      <Clock size={13} />
                      <span>{horaTurno} hs</span>
                    </div>
                    <span className="text-[10px] uppercase font-black tracking-wider text-muted-foreground/80">
                      Pendiente
                    </span>
                  </div>

                  {/* Motivo */}
                  <h3 className="text-lg font-black text-foreground mb-4 leading-tight group-hover:text-primary transition-colors">
                    {turno.motivo}
                  </h3>

                  {/* Detalles de Cliente y Vehículo */}
                  <div className="space-y-3.5 border-t border-border/50 pt-4 mb-6">
                    {/* Cliente */}
                    {cliente ? (
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-primary/5 text-primary border border-primary/10 mt-0.5">
                          <User size={15} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Cliente</p>
                          <p className="text-sm font-extrabold text-foreground truncate">
                            {cliente.nombre} {cliente.apellido}
                          </p>
                          {cliente.telefono && (
                            <p className="text-xs text-muted-foreground font-mono mt-0.5">
                              Tel: {cliente.telefono}
                            </p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-xs text-rose-500 font-semibold p-2 bg-rose-500/5 rounded-lg border border-rose-500/10">
                        <AlertCircle size={14} />
                        <span>Sin datos del dueño</span>
                      </div>
                    )}

                    {/* Vehículo */}
                    {vehiculo ? (
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-primary/5 text-primary border border-primary/10 mt-0.5">
                          <Car size={15} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Vehículo</p>
                          <p className="text-sm font-extrabold text-foreground truncate">
                            {vehiculo.marca} {vehiculo.modelo}
                          </p>
                          <span className="inline-block bg-muted px-2 py-0.5 rounded text-[11px] font-black font-mono tracking-wider border border-border mt-1">
                            {vehiculo.patente}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-xs text-rose-500 font-semibold p-2 bg-rose-500/5 rounded-lg border border-rose-500/10">
                        <AlertCircle size={14} />
                        <span>Patente: {turno.vehiculo_patente} (No registrado)</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Acciones del Turno */}
                <div className="flex flex-col gap-2 mt-auto">
                  {/* Botón WhatsApp */}
                  <button
                    onClick={() => handleSendWhatsApp(turno)}
                    disabled={!cliente || !cliente.telefono}
                    className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-all duration-300 shadow-[0_4px_12px_rgba(16,185,129,0.2)] hover:shadow-[0_6px_20px_rgba(16,185,129,0.35)] hover:-translate-y-0.5 disabled:opacity-50 disabled:pointer-events-none text-sm group/btn"
                  >
                    <MessageCircle size={18} className="group-hover/btn:scale-110 transition-transform" />
                    Recordar por WhatsApp
                    <ExternalLink size={12} className="opacity-70 ml-0.5" />
                  </button>

                  {/* Botón Obviar */}
                  <button
                    onClick={() => handleObviar(turno.id)}
                    className="flex items-center justify-center gap-1.5 w-full py-2 px-3 border border-border hover:border-muted hover:bg-muted text-muted-foreground hover:text-foreground font-semibold rounded-xl text-xs transition-colors duration-200"
                  >
                    <EyeOff size={14} />
                    Obviar recordatorio
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

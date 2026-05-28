import { useState, useEffect } from "react";
import { CalendarDays, Wrench, Clock, Check, X } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

export function VehiculoHistorial({ patente }) {
  const [turnos, setTurnos] = useState([]);
  const [ordenes, setOrdenes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (patente) {
      fetchHistorial();
    }
  }, [patente]);

  const fetchHistorial = async () => {
    setLoading(true);
    try {
      const [resTurnos, resOrdenes] = await Promise.all([
        fetch(`${API_URL}/turnos/`),
        fetch(`${API_URL}/ordenes/`)
      ]);

      if (resTurnos.ok && resOrdenes.ok) {
        const allTurnos = await resTurnos.json();
        const allOrdenes = await resOrdenes.json();

        const vTurnos = allTurnos.filter(t => t.vehiculo_patente === patente);
        vTurnos.sort((a, b) => new Date(b.fecha_hora) - new Date(a.fecha_hora));
        
        const vOrdenes = allOrdenes.filter(o => o.vehiculo_patente === patente);
        vOrdenes.sort((a, b) => new Date(b.fecha_ingreso) - new Date(a.fecha_ingreso));

        setTurnos(vTurnos);
        setOrdenes(vOrdenes);
      }
    } catch (error) {
      console.error("Error fetching historial:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Cargando historial...</div>;
  }

  return (
    <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
      <div>
        <h3 className="text-lg font-bold flex items-center gap-2 mb-3">
          <Wrench size={20} className="text-primary" /> Órdenes de Trabajo ({ordenes.length})
        </h3>
        {ordenes.length === 0 ? (
          <p className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg border border-border">No hay órdenes registradas.</p>
        ) : (
          <div className="space-y-3">
            {ordenes.map(o => (
              <div key={o.id} className="p-4 rounded-xl border border-border bg-card shadow-sm">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-bold text-muted-foreground">#{o.id}</span>
                  <span className="text-xs font-medium bg-secondary/50 px-2 py-1 rounded text-secondary-foreground flex items-center gap-1">
                    <Clock size={12}/> {new Date(o.fecha_ingreso).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm font-bold text-foreground mb-2">{o.descripcion}</p>
                {o.servicios && o.servicios.length > 0 && (
                  <div className="mt-3 space-y-1.5 border-t border-border pt-2">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1">Servicios Realizados</p>
                    {o.servicios.map(s => (
                      <div key={s.id} className="text-xs text-foreground bg-background p-2 rounded border border-border/50">
                        <span className="font-bold block">{s.servicio}</span>
                        {s.observaciones && <span className="text-muted-foreground block mt-0.5">{s.observaciones}</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h3 className="text-lg font-bold flex items-center gap-2 mb-3">
          <CalendarDays size={20} className="text-primary" /> Turnos ({turnos.length})
        </h3>
        {turnos.length === 0 ? (
          <p className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg border border-border">No hay turnos registrados.</p>
        ) : (
          <div className="space-y-3">
            {turnos.map(t => (
              <div key={t.id} className="p-3 rounded-xl border border-border bg-card shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-foreground">{t.motivo}</p>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <Clock size={12}/> {new Date(t.fecha_hora).toLocaleString()}
                  </p>
                </div>
                <div>
                  <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded ${
                    t.estado === 'Cumplido' ? 'bg-emerald-500/10 text-emerald-500' :
                    t.estado === 'Cancelado' ? 'bg-rose-500/10 text-rose-500 line-through opacity-70' :
                    'bg-amber-500/10 text-amber-500'
                  }`}>
                    {t.estado}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

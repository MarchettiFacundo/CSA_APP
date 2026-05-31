import { useState, useEffect } from "react";
import { Plus, CalendarDays, Clock, Car, Check, X, List, Calendar as CalendarIcon } from "lucide-react";
import { Modal } from "../components/Modal";
import { TurnoForm } from "../components/forms/TurnoForm";
import { CustomDateTimePicker } from "../components/CustomDateTimePicker";
import { api } from "../lib/api";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

export function Turnos() {
  const [turnos, setTurnos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'calendar'
  const [listFilter, setListFilter] = useState('Pendientes'); // 'Pendientes' | 'Todos'
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDayTurnos, setSelectedDayTurnos] = useState({ date: null, turnos: [] });
  const [selectedTurnoDetail, setSelectedTurnoDetail] = useState(null);
  const [reschedulingTurno, setReschedulingTurno] = useState(null);
  const [newFechaHora, setNewFechaHora] = useState("");

  const startRescheduling = (turno) => {
    setReschedulingTurno(turno);
    setNewFechaHora(turno.fecha_hora);
  };

  const reprogramarTurno = async (id, nuevaFecha) => {
    try {
      const res = await fetch(`${API_URL}/turnos/${id}/estado`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fecha_hora: nuevaFecha })
      });
      if (res.ok) {
        fetchTurnos();
      }
    } catch (error) {
      console.error("Error al reprogramar turno:", error);
    }
  };

  useEffect(() => {
    fetchTurnos();
    fetch(`${API_URL}/clientes/`).then(r=>r.json()).then(setClientes).catch(e => console.error(e));
    fetch(`${API_URL}/vehiculos/`).then(r=>r.json()).then(setVehiculos).catch(e => console.error(e));
  }, []);

  const fetchTurnos = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/turnos/`);
      if (res.ok) {
        const data = await res.json();
        // Sort by date ascending
        data.sort((a, b) => new Date(a.fecha_hora) - new Date(b.fecha_hora));
        setTurnos(data);
      }
    } catch (error) {
      console.error("Error al cargar turnos:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateEstado = async (id, nuevoEstado) => {
    try {
      const res = await fetch(`${API_URL}/turnos/${id}/estado`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: nuevoEstado })
      });
      if (res.ok) {
        fetchTurnos();
      }
    } catch (error) {
      console.error("Error updating estado", error);
    }
  };

  const handleCreated = () => {
    setIsModalOpen(false);
    fetchTurnos();
  };

  // --- CALENDAR LOGIC ---
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay(); // 0 is Sunday
  
  const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
  const dayNames = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

  const changeMonth = (offset) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1));
  };

  const getTurnosForDate = (day) => {
    return turnos.filter(t => {
      const d = new Date(t.fecha_hora);
      return d.getDate() === day && d.getMonth() === currentDate.getMonth() && d.getFullYear() === currentDate.getFullYear();
    });
  };

  // --- RENDER HELPERS ---
  const getStatusColor = (estado) => {
    switch(estado) {
      case 'Pendiente': return 'bg-amber-50/50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-500 border-amber-200/50 dark:border-amber-900/50';
      case 'Cumplido': return 'bg-emerald-50/50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-500 border-emerald-200/50 dark:border-emerald-900/50';
      case 'Cancelado': return 'bg-rose-50/50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-500 border-rose-200/50 dark:border-rose-900/50 line-through opacity-75 grayscale-[0.5]';
      default: return 'bg-primary/5 dark:bg-primary/10 text-primary border-primary/20';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight bg-gradient-to-br from-foreground via-foreground/90 to-muted-foreground bg-clip-text text-transparent drop-shadow-sm">Turnero</h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">Gestiona los próximos ingresos al taller.</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          
          <div className="flex p-1 bg-muted/50 rounded-lg border border-border">
            <button 
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${viewMode === 'list' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <List size={16} /> Lista
            </button>
            <button 
              onClick={() => setViewMode('calendar')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${viewMode === 'calendar' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <CalendarIcon size={16} /> Mes
            </button>
          </div>

          <button 
            onClick={() => setIsModalOpen(true)}
            className="group flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl hover:bg-primary/90 transition-all duration-300 font-medium shadow-[0_4px_14px_0_rgba(var(--primary),0.39)] hover:shadow-[0_6px_20px_rgba(var(--primary),0.23)] hover:-translate-y-0.5 active:translate-y-0 whitespace-nowrap"
          >
            <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
            Nuevo
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : viewMode === 'list' ? (
        <div className="space-y-4">
          <div className="flex justify-end mb-2">
            <div className="flex p-1 bg-muted/30 rounded-lg border border-border inline-flex">
              <button 
                onClick={() => setListFilter('Pendientes')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${listFilter === 'Pendientes' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Solo Pendientes
              </button>
              <button 
                onClick={() => setListFilter('Todos')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${listFilter === 'Todos' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Mostrar Historial Completo
              </button>
            </div>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {turnos.filter(t => listFilter === 'Todos' || t.estado === 'Pendiente').length === 0 ? (
              <div className="col-span-full p-12 text-center border-2 border-dashed border-border rounded-2xl bg-card/30">
                <CalendarDays className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium text-foreground">
                  {listFilter === 'Pendientes' ? "No hay turnos pendientes" : "No hay turnos programados"}
                </h3>
              </div>
            ) : (
              turnos.filter(t => listFilter === 'Todos' || t.estado === 'Pendiente').map((turno) => (
              <div key={turno.id} onClick={() => setSelectedTurnoDetail(turno)} className={`group flex flex-col p-6 rounded-2xl border bg-card/80 backdrop-blur-sm shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer ${getStatusColor(turno.estado)}`}>
                <div className="flex justify-between items-start mb-3">
                  <span className="px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase bg-background/60 dark:bg-background/40 backdrop-blur-md border border-current/20 shadow-sm">
                    {turno.estado}
                  </span>
                  
                  {turno.estado === 'Pendiente' && (
                    <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <button onClick={(e) => { e.stopPropagation(); updateEstado(turno.id, 'Cumplido'); }} className="p-1.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all duration-200 hover:scale-110" title="Marcar como cumplido">
                        <Check size={16} />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); startRescheduling(turno); }} className="p-1.5 rounded-full bg-blue-500/20 text-blue-700 dark:text-blue-400 hover:bg-blue-500 hover:text-white transition-all duration-200 hover:scale-110" title="Reprogramar turno">
                        <CalendarDays size={16} />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); updateEstado(turno.id, 'Cancelado'); }} className="p-1.5 rounded-full bg-rose-500/20 text-rose-700 dark:text-rose-400 hover:bg-rose-500 hover:text-white transition-all duration-200 hover:scale-110" title="Cancelar turno">
                        <X size={16} />
                      </button>
                    </div>
                  )}
                </div>
                
                <h3 className="text-xl font-black text-foreground mb-4 leading-tight">{turno.motivo}</h3>
                
                <div className="flex-grow space-y-3 mt-auto">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-background/80 dark:bg-background/40 backdrop-blur-md border border-current/10 group-hover:border-current/20 transition-colors">
                    <div className="flex items-center gap-2 text-sm text-foreground font-medium">
                      <CalendarDays size={18} className="opacity-70" />
                      <span>{new Date(turno.fecha_hora).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-foreground font-bold">
                      <Clock size={18} className="opacity-70" />
                      <span>{new Date(turno.fecha_hora).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-foreground p-3 rounded-xl bg-background/80 dark:bg-background/40 backdrop-blur-md border border-current/10 group-hover:border-current/20 transition-colors">
                    <Car size={18} className="opacity-70" />
                    <span className="font-bold tracking-wide">Patente: {turno.vehiculo_patente}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
          {/* Calendar Header */}
          <div className="flex items-center justify-between p-4 border-b border-border bg-muted/20">
            <h2 className="text-xl font-bold text-foreground">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <div className="flex gap-2">
              <button onClick={() => changeMonth(-1)} className="px-3 py-1 rounded bg-background border border-border hover:bg-muted text-sm font-medium transition-colors">Anterior</button>
              <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1 rounded bg-background border border-border hover:bg-muted text-sm font-medium transition-colors">Hoy</button>
              <button onClick={() => changeMonth(1)} className="px-3 py-1 rounded bg-background border border-border hover:bg-muted text-sm font-medium transition-colors">Siguiente</button>
            </div>
          </div>
          
          {/* Days Header */}
          <div className="grid grid-cols-7 border-b border-border bg-muted/40">
            {dayNames.map(day => (
              <div key={day} className="py-2 text-center text-xs font-bold text-muted-foreground uppercase tracking-wider border-r border-border last:border-0">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 auto-rows-fr">
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`empty-${i}`} className="min-h-[120px] p-2 border-r border-b border-border bg-muted/10"></div>
            ))}
            
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dayTurnos = getTurnosForDate(day);
              const isToday = new Date().getDate() === day && new Date().getMonth() === currentDate.getMonth() && new Date().getFullYear() === currentDate.getFullYear();
              
              return (
                <div 
                  key={day} 
                  onClick={() => setSelectedDayTurnos({ date: new Date(currentDate.getFullYear(), currentDate.getMonth(), day), turnos: dayTurnos })}
                  className={`min-h-[120px] p-2 border-r border-b border-border hover:bg-muted/20 transition-colors cursor-pointer ${isToday ? 'bg-primary/5' : ''}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className={`w-7 h-7 flex items-center justify-center rounded-full text-sm font-bold ${isToday ? 'bg-primary text-primary-foreground' : 'text-foreground'}`}>
                      {day}
                    </span>
                    {dayTurnos.length > 0 && <span className="text-[10px] font-bold bg-muted px-1.5 py-0.5 rounded-full">{dayTurnos.length}</span>}
                  </div>
                  <div className="space-y-1 overflow-y-auto max-h-[80px] pr-1 scrollbar-thin">
                    {dayTurnos.map(t => (
                      <div key={t.id} className={`text-[10px] p-1 rounded font-medium truncate ${getStatusColor(t.estado).split(' ')[0]} ${getStatusColor(t.estado).split(' ')[1]}`}>
                        <span className="font-bold">{new Date(t.fecha_hora).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span> {t.vehiculo_patente}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Nuevo Turno"
      >
        <TurnoForm 
          onSuccess={handleCreated} 
          onCancel={() => setIsModalOpen(false)} 
        />
      </Modal>

      {/* Modal Detalles del Día */}
      <Modal 
        isOpen={!!selectedDayTurnos.date}
        onClose={() => setSelectedDayTurnos({ date: null, turnos: [] })}
        title={selectedDayTurnos.date ? `Turnos del ${selectedDayTurnos.date.toLocaleDateString()}` : "Detalles del Día"}
      >
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
          {selectedDayTurnos.turnos.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No hay turnos programados para este día.</p>
          ) : (
            selectedDayTurnos.turnos.map((turno) => (
              <div 
                key={turno.id} 
                onClick={() => {
                  setSelectedDayTurnos({ date: null, turnos: [] });
                  setSelectedTurnoDetail(turno);
                }}
                className={`flex flex-col p-4 rounded-xl border bg-card shadow-sm cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 ${getStatusColor(turno.estado)}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase bg-background/50 border border-current/20">
                    {turno.estado}
                  </span>
                  
                  {turno.estado === 'Pendiente' && (
                    <div className="flex items-center gap-1">
                      <button onClick={(e) => { e.stopPropagation(); updateEstado(turno.id, 'Cumplido'); }} className="p-1 rounded bg-emerald-500/20 text-emerald-600 hover:bg-emerald-500 hover:text-white transition-colors" title="Marcar como cumplido">
                        <Check size={12} />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); setSelectedDayTurnos({ date: null, turnos: [] }); startRescheduling(turno); }} className="p-1 rounded bg-blue-500/20 text-blue-600 hover:bg-blue-500 hover:text-white transition-colors" title="Reprogramar turno">
                        <CalendarDays size={12} />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); updateEstado(turno.id, 'Cancelado'); }} className="p-1 rounded bg-rose-500/20 text-rose-600 hover:bg-rose-500 hover:text-white transition-colors" title="Cancelar turno">
                        <X size={12} />
                      </button>
                    </div>
                  )}
                </div>
                
                <h3 className="text-base font-bold text-foreground mb-3">{turno.motivo}</h3>
                
                <div className="space-y-2 mt-auto">
                  <div className="flex items-center justify-between p-2 rounded bg-background/50 border border-current/10">
                    <div className="flex items-center gap-2 text-xs text-foreground font-bold">
                      <Clock size={14} className="opacity-70" />
                      <span>{new Date(turno.fecha_hora).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs text-foreground p-2 rounded bg-background/50 border border-current/10">
                    <Car size={14} className="opacity-70" />
                    <span className="font-bold">Patente: {turno.vehiculo_patente}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Modal>

      {/* Modal Detalles de UN Turno */}
      <Modal
        isOpen={!!selectedTurnoDetail}
        onClose={() => setSelectedTurnoDetail(null)}
        title="Detalles del Turno"
      >
        {selectedTurnoDetail && (() => {
          const v = vehiculos.find(veh => veh.patente === selectedTurnoDetail.vehiculo_patente);
          const c = v ? clientes.find(cli => cli.dni === v.cliente_dni) : null;
          
          return (
            <div className="space-y-4">
              <div className={`p-5 rounded-2xl border ${getStatusColor(selectedTurnoDetail.estado)}`}>
                <div className="flex justify-between items-center mb-4">
                  <span className="px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase bg-background/60 backdrop-blur-md border border-current/20 shadow-sm">{selectedTurnoDetail.estado}</span>
                  <span className="text-sm font-bold flex items-center gap-1"><Clock size={16} className="opacity-70"/> {new Date(selectedTurnoDetail.fecha_hora).toLocaleDateString()} {new Date(selectedTurnoDetail.fecha_hora).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                </div>
                <h3 className="text-2xl font-black mb-6">{selectedTurnoDetail.motivo}</h3>
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div className="flex flex-col p-3 bg-background/50 rounded-xl border border-current/10">
                    <span className="text-xs font-bold opacity-70 uppercase tracking-wider mb-1 flex items-center gap-1"><Car size={14}/> Vehículo</span>
                    <span className="font-mono text-lg font-bold">{selectedTurnoDetail.vehiculo_patente}</span>
                    {v && <span className="text-sm font-medium mt-1">{v.marca} {v.modelo}</span>}
                  </div>
                  <div className="flex flex-col p-3 bg-background/50 rounded-xl border border-current/10">
                    <span className="text-xs font-bold opacity-70 uppercase tracking-wider mb-1">Dueño</span>
                    {c ? (
                      <>
                        <span className="font-bold text-base">{c.nombre} {c.apellido}</span>
                        {c.telefono && <span className="text-sm font-medium mt-1">Tel: {c.telefono}</span>}
                      </>
                    ) : (
                      <span className="text-sm font-medium italic opacity-70 mt-1">No encontrado</span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2 justify-end mt-6">
                {selectedTurnoDetail.estado === 'Pendiente' && (
                  <>
                    <button onClick={() => { updateEstado(selectedTurnoDetail.id, 'Cancelado'); setSelectedTurnoDetail(null); }} className="px-4 py-2 bg-rose-500/10 text-rose-600 font-bold rounded-lg hover:bg-rose-500 hover:text-white transition-colors flex items-center gap-2"><X size={18}/> Cancelar Turno</button>
                    <button onClick={() => { startRescheduling(selectedTurnoDetail); setSelectedTurnoDetail(null); }} className="px-4 py-2 bg-blue-500/10 text-blue-600 font-bold rounded-lg hover:bg-blue-500 hover:text-white transition-colors flex items-center gap-2"><CalendarDays size={18}/> Reprogramar Turno</button>
                    <button onClick={() => { updateEstado(selectedTurnoDetail.id, 'Cumplido'); setSelectedTurnoDetail(null); }} className="px-4 py-2 bg-emerald-500/10 text-emerald-600 font-bold rounded-lg hover:bg-emerald-500 hover:text-white transition-colors flex items-center gap-2"><Check size={18}/> Marcar Cumplido</button>
                  </>
                )}
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* Modal de Reprogramación */}
      <Modal
        isOpen={!!reschedulingTurno}
        onClose={() => setReschedulingTurno(null)}
        title="Reprogramar Turno"
      >
        {reschedulingTurno && (
          <div className="space-y-4">
            <div className="p-4 bg-primary/5 border border-primary/20 rounded-2xl">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Turno a reprogramar</p>
              <h4 className="text-lg font-black text-foreground">{reschedulingTurno.motivo}</h4>
              <p className="text-xs text-muted-foreground mt-1">Patente: <span className="font-mono text-xs font-normal ml-2 bg-background px-1.5 py-0.5 rounded border border-border">{reschedulingTurno.vehiculo_patente}</span></p>
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-bold text-foreground">Selecciona Nueva Fecha y Hora</label>
              <CustomDateTimePicker
                value={newFechaHora}
                onChange={e => setNewFechaHora(e.target.value)}
              />
            </div>
            
            <div className="flex gap-2 justify-end mt-6 pt-4 border-t border-border">
              <button 
                onClick={() => setReschedulingTurno(null)} 
                className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-muted transition-colors text-foreground"
              >
                Cancelar
              </button>
              <button 
                onClick={async () => {
                  await reprogramarTurno(reschedulingTurno.id, newFechaHora);
                  setReschedulingTurno(null);
                }} 
                className="px-4 py-2 bg-primary text-primary-foreground font-bold rounded-lg hover:opacity-90 transition-colors"
              >
                Confirmar Reprogramación
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

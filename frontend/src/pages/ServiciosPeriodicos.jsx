import { useState, useEffect } from "react";
import { api } from "../lib/api";
import { Bell, Calendar, Car, Wrench, Settings, Plus, Trash2, Check, User, Clock } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

export function ServiciosPeriodicos() {
  const [activeTab, setActiveTab] = useState("vencimientos"); // vencimientos, configuracion
  const [servicios, setServicios] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [configuraciones, setConfiguraciones] = useState([]);
  const [loading, setLoading] = useState(true);

  // New config state
  const [newConfig, setNewConfig] = useState({
    palabra_clave: "",
    meses_vencimiento: 12,
    km_vencimiento: 10000
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resServicios, resConfig, resVehiculos, resClientes] = await Promise.all([
        fetch(`${API_URL}/servicios-periodicos/`),
        fetch(`${API_URL}/configuracion-servicios/`),
        fetch(`${API_URL}/vehiculos/`),
        fetch(`${API_URL}/clientes/`)
      ]);

      if (resServicios.ok) setServicios(await resServicios.json());
      if (resConfig.ok) setConfiguraciones(await resConfig.json());
      if (resVehiculos.ok) setVehiculos(await resVehiculos.json());
      if (resClientes.ok) setClientes(await resClientes.json());
    } catch (err) {
      console.error("Error fetching data", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateConfig = async (e) => {
    e.preventDefault();
    if (!newConfig.palabra_clave) return;
    try {
      const res = await fetch(`${API_URL}/configuracion-servicios/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newConfig)
      });
      if (res.ok) {
        setConfiguraciones([...configuraciones, await res.json()]);
        setNewConfig({ palabra_clave: "", meses_vencimiento: 12, km_vencimiento: 10000 });
      }
    } catch (err) {
      console.error("Error creando config", err);
    }
  };

  const handleDeleteConfig = async (id) => {
    try {
      await fetch(`${API_URL}/configuracion-servicios/${id}`, {
        method: "DELETE"
      });
      setConfiguraciones(configuraciones.filter(c => c.id !== id));
    } catch (err) {
      console.error("Error eliminando config", err);
    }
  };

  const handleUpdateEstado = async (id, estado) => {
    try {
      const res = await fetch(`${API_URL}/servicios-periodicos/${id}/estado`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado })
      });
      if (res.ok) {
        const updated = await res.json();
        setServicios(servicios.map(s => s.id === id ? updated : s));
      }
    } catch (err) {
      console.error("Error actualizando estado", err);
    }
  };

  const sendWhatsApp = (servicio, cliente, vehiculo) => {
    if (!cliente.telefono) {
      alert("El cliente no tiene teléfono registrado.");
      return;
    }
    
    // Marcar como recordado en la BD
    handleUpdateEstado(servicio.id, "Recordado");

    const message = `Hola ${cliente.nombre}, somos del Centro de Servicios Automotor. Te escribimos para recordarte que es probable que tu ${vehiculo.marca} ${vehiculo.modelo} (${vehiculo.patente}) ya requiera un servicio de *${servicio.tipo_servicio}*. ¡Contáctanos para agendar un turno!`;
    const encoded = encodeURIComponent(message);
    
    // Limpiar el telefono
    let phone = cliente.telefono.replace(/[^0-9]/g, '');
    if (!phone.startsWith('549')) {
       // Asumiendo formato de argentina, idealmente esto debería validarse en el input
       if (phone.startsWith('0')) phone = phone.substring(1);
       if (!phone.startsWith('54')) phone = '549' + phone;
    }

    window.open(`https://wa.me/${phone}?text=${encoded}`, '_blank');
  };

  // Helper function to determine if a service is expired or near expiration
  const getEstadoVencimiento = (s) => {
    const vehiculo = vehiculos.find(v => v.patente === s.vehiculo_patente);
    if (!vehiculo) return { status: 'desconocido', reason: '' };

    const hoy = new Date();
    const fechaProx = s.fecha_proximo ? new Date(s.fecha_proximo) : null;
    const kmActual = vehiculo.kilometraje || 0;
    const kmProx = s.kilometraje_proximo || 0;

    let expired = false;
    let near = false;
    let reason = [];

    if (kmProx > 0) {
      if (kmActual >= kmProx) {
        expired = true;
        reason.push(`Por KM (Actual: ${kmActual} - Límite: ${kmProx})`);
      } else if (kmProx - kmActual <= 1000) {
        near = true;
        reason.push(`Próximo por KM (Faltan ${kmProx - kmActual} km)`);
      }
    }

    if (fechaProx) {
      if (hoy >= fechaProx) {
        expired = true;
        reason.push(`Por Fecha (Venció ${fechaProx.toLocaleDateString()})`);
      } else {
        const diffDays = Math.ceil((fechaProx - hoy) / (1000 * 60 * 60 * 24));
        if (diffDays <= 30) {
          near = true;
          reason.push(`Próximo por Fecha (En ${diffDays} días)`);
        }
      }
    }

    if (expired) return { status: 'vencido', reason: reason.join(' y ') };
    if (near) return { status: 'proximo', reason: reason.join(' y ') };
    return { status: 'al_dia', reason: 'Al día' };
  };

  if (loading) {
    return <div className="flex justify-center items-center h-full text-muted-foreground"><Clock className="animate-spin mr-2" /> Cargando datos...</div>;
  }

  // Filtrar servicios relevantes (ignoramos los 'Realizado' o los que no estén al menos 'proximos' si no queremos spam, pero los mostramos todos por ahora y los ordenamos)
  const serviciosConEstado = servicios.map(s => ({
    ...s,
    vencimiento: getEstadoVencimiento(s),
    vehiculo: vehiculos.find(v => v.patente === s.vehiculo_patente),
    cliente: clientes.find(c => c.dni === vehiculos.find(v => v.patente === s.vehiculo_patente)?.cliente_dni)
  })).sort((a, b) => {
    // Sort logic: Vencidos first, then proximos, then others
    const order = { 'vencido': 1, 'proximo': 2, 'al_dia': 3, 'desconocido': 4 };
    return order[a.vencimiento.status] - order[b.vencimiento.status];
  });

  return (
    <div className="h-full flex flex-col space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground mb-1">Servicios Periódicos</h1>
        <p className="text-muted-foreground">Gestiona recordatorios de mantenimiento preventivo para tus clientes.</p>
      </div>

      {/* TABS */}
      <div className="flex border-b border-border">
        <button 
          onClick={() => setActiveTab('vencimientos')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm transition-colors ${activeTab === 'vencimientos' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
        >
          <Bell size={16} /> Próximos Vencimientos
        </button>
        <button 
          onClick={() => setActiveTab('configuracion')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm transition-colors ${activeTab === 'configuracion' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
        >
          <Settings size={16} /> Configuración de Alertas
        </button>
      </div>

      {/* CONTENT */}
      <div className="flex-1 overflow-auto">
        {activeTab === 'configuracion' && (
          <div className="max-w-3xl space-y-6">
            <div className="bg-card border border-border rounded-xl p-5">
              <h2 className="text-lg font-bold text-foreground mb-2">Crear nueva regla de auto-generación</h2>
              <p className="text-sm text-muted-foreground mb-4">
                El sistema leerá las órdenes de trabajo. Si una tarea contiene la "Palabra Clave", programará automáticamente un recordatorio.
              </p>
              
              <form onSubmit={handleCreateConfig} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-foreground mb-1">Palabra Clave</label>
                  <input 
                    type="text" 
                    required
                    value={newConfig.palabra_clave}
                    onChange={e => setNewConfig({...newConfig, palabra_clave: e.target.value})}
                    placeholder="ej: distribucion"
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">Avisar a los (Meses)</label>
                  <input 
                    type="number" 
                    required min="1"
                    value={newConfig.meses_vencimiento}
                    onChange={e => setNewConfig({...newConfig, meses_vencimiento: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">O a los (Km)</label>
                  <input 
                    type="number" 
                    required min="1000" step="1000"
                    value={newConfig.km_vencimiento}
                    onChange={e => setNewConfig({...newConfig, km_vencimiento: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
                  />
                </div>
                <div className="md:col-span-4 flex justify-end">
                  <button type="submit" className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90">
                    <Plus size={16} /> Agregar Regla
                  </button>
                </div>
              </form>
            </div>

            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    <th className="px-4 py-3 font-semibold text-foreground">Palabra Clave</th>
                    <th className="px-4 py-3 font-semibold text-foreground">Vence por Tiempo</th>
                    <th className="px-4 py-3 font-semibold text-foreground">Vence por KM</th>
                    <th className="px-4 py-3 font-semibold text-foreground text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {configuraciones.map(conf => (
                    <tr key={conf.id} className="hover:bg-muted/20">
                      <td className="px-4 py-3 font-medium text-primary">"{conf.palabra_clave}"</td>
                      <td className="px-4 py-3 text-muted-foreground">{conf.meses_vencimiento} Meses</td>
                      <td className="px-4 py-3 text-muted-foreground">{conf.km_vencimiento.toLocaleString()} KM</td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => handleDeleteConfig(conf.id)} className="text-rose-500 hover:text-rose-600 p-1">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {configuraciones.length === 0 && (
                    <tr>
                      <td colSpan="4" className="px-4 py-8 text-center text-muted-foreground">No hay reglas configuradas</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'vencimientos' && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {serviciosConEstado.filter(s => s.estado !== 'Desestimado' && s.estado !== 'Realizado').map(servicio => {
              const { vencimiento, vehiculo, cliente } = servicio;
              
              let badgeColor = "bg-green-500/10 text-green-500 border-green-500/20";
              if (vencimiento.status === 'vencido') badgeColor = "bg-rose-500/10 text-rose-500 border-rose-500/20 animate-pulse";
              if (vencimiento.status === 'proximo') badgeColor = "bg-amber-500/10 text-amber-500 border-amber-500/20";
              
              return (
                <div key={servicio.id} className="bg-card border border-border rounded-xl p-4 flex flex-col justify-between hover:border-primary/30 transition-colors shadow-sm">
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-bold text-foreground flex items-center gap-2">
                        <Wrench size={16} className="text-primary" /> {servicio.tipo_servicio}
                      </h3>
                      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${badgeColor}`}>
                        {vencimiento.status.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-start gap-2 text-sm text-muted-foreground">
                        <User size={14} className="mt-0.5 shrink-0" />
                        <span>{cliente ? `${cliente.nombre} ${cliente.apellido}` : 'Cliente Desconocido'} <br/><span className="text-xs">{cliente?.telefono || 'Sin teléfono'}</span></span>
                      </div>
                      <div className="flex items-start gap-2 text-sm text-muted-foreground">
                        <Car size={14} className="mt-0.5 shrink-0" />
                        <span>{vehiculo ? `${vehiculo.marca} ${vehiculo.modelo} (${vehiculo.patente})` : 'Vehículo Desconocido'} <br/>
                        <span className="text-xs font-mono bg-muted px-1 rounded">Km actual: {vehiculo?.kilometraje || 0}</span>
                        </span>
                      </div>
                      
                      <div className="bg-muted/50 p-2 rounded border border-border text-xs text-foreground mt-2">
                        <strong>Motivo: </strong> {vencimiento.reason || 'Esperando datos...'}
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-border flex items-center justify-between">
                    <span className={`text-xs font-medium ${servicio.estado === 'Recordado' ? 'text-green-500 flex items-center gap-1' : 'text-muted-foreground'}`}>
                      {servicio.estado === 'Recordado' ? <><Check size={12}/> Avisado</> : servicio.estado}
                    </span>
                    
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleUpdateEstado(servicio.id, 'Desestimado')}
                        className="p-1.5 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 rounded transition-colors"
                        title="Desestimar"
                      >
                        <Trash2 size={16} />
                      </button>
                      <button 
                        onClick={() => sendWhatsApp(servicio, cliente, vehiculo)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-green-500 text-white rounded hover:bg-green-600 transition-colors text-xs font-medium"
                      >
                        Recordar por WP
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {serviciosConEstado.filter(s => s.estado !== 'Desestimado' && s.estado !== 'Realizado').length === 0 && (
              <div className="col-span-full py-12 text-center text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border">
                <Bell className="mx-auto mb-2 opacity-50" size={32} />
                <p>No hay servicios periódicos pendientes o próximos a vencer.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

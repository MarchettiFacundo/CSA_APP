import { useState, useEffect } from "react";
import { Users, User, Car, Phone, Mail, Search, Info, Plus, ArrowRight, Clock } from "lucide-react";
import { api } from "../lib/api";
import { Modal } from "../components/Modal";
import { ClienteForm } from "../components/forms/ClienteForm";
import { VehiculoForm } from "../components/forms/VehiculoForm";
import { VehiculoHistorial } from "../components/VehiculoHistorial";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

export function ClientesVehiculos() {
  const [clientes, setClientes] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [modalType, setModalType] = useState(null); // 'cliente' | 'vehiculo' | null
  const [viewMode, setViewMode] = useState("clientes"); // 'clientes' | 'vehiculos'
  const [historialPatente, setHistorialPatente] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resClientes, resVehiculos] = await Promise.all([
        fetch(`${API_URL}/clientes/`),
        fetch(`${API_URL}/vehiculos/`)
      ]);
      
      if (resClientes.ok && resVehiculos.ok) {
        setClientes(await resClientes.json());
        setVehiculos(await resVehiculos.json());
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreated = () => {
    setModalType(null);
    fetchData();
  };

  const term = searchTerm.toLowerCase();

  const filteredClientes = clientes.filter(c => 
    c.nombre.toLowerCase().includes(term) || 
    (c.apellido && c.apellido.toLowerCase().includes(term)) ||
    (c.dni && c.dni.toLowerCase().includes(term)) ||
    (c.email && c.email.toLowerCase().includes(term))
  );

  const filteredVehiculos = vehiculos.filter(v =>
    v.patente.toLowerCase().includes(term) ||
    v.marca.toLowerCase().includes(term) ||
    v.modelo.toLowerCase().includes(term)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">Directorio</h1>
          <p className="text-muted-foreground mt-1">Gestión de Clientes y Vehículos.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <input 
              type="text" 
              placeholder={viewMode === 'clientes' ? "Buscar clientes (Nombre, DNI)..." : "Buscar vehículos (Patente, Marca)..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 w-full md:w-64"
            />
          </div>
          <div className="flex gap-2 w-full sm:w-auto shrink-0">
            <button 
              onClick={() => setModalType('cliente')}
              className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:opacity-90 transition-all font-medium shadow-sm whitespace-nowrap"
            >
              <Plus size={18} /> Cliente
            </button>
            <button 
              onClick={() => setModalType('vehiculo')}
              className="flex-1 flex items-center justify-center gap-2 bg-secondary text-secondary-foreground px-4 py-2 rounded-lg hover:opacity-90 transition-all font-medium shadow-sm whitespace-nowrap border border-border"
            >
              <Plus size={18} /> Vehículo
            </button>
          </div>
        </div>
      </div>

      {/* Tabs / Toggle View */}
      <div className="flex p-1 bg-muted/50 rounded-lg w-full max-w-sm mx-auto md:mx-0 border border-border">
        <button 
          onClick={() => setViewMode('clientes')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-colors ${viewMode === 'clientes' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
        >
          <User size={16} /> Ver Clientes
        </button>
        <button 
          onClick={() => setViewMode('vehiculos')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-colors ${viewMode === 'vehiculos' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
        >
          <Car size={16} /> Ver Vehículos
        </button>
      </div>

      {/* CLIENTES VIEW */}
      {viewMode === 'clientes' && (
        <div className="grid gap-6 lg:grid-cols-2">
          {loading ? (
            <div className="col-span-full flex justify-center p-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredClientes.length === 0 ? (
            <div className="col-span-full p-12 text-center border-2 border-dashed border-border rounded-2xl bg-card/30">
              <Users className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium text-foreground">No se encontraron clientes</h3>
            </div>
          ) : (
            filteredClientes.map((cliente) => {
              const clienteVehiculos = vehiculos.filter(v => v.cliente_dni === cliente.dni);
              return (
                <div key={cliente.dni} className="p-6 bg-card rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow group flex flex-col h-full">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 p-3 rounded-full text-primary group-hover:scale-110 transition-transform">
                        <User size={24} />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                          {cliente.nombre} {cliente.apellido}
                          {cliente.es_agencia && <span className="text-[10px] uppercase font-bold bg-blue-500/10 text-blue-500 px-2 py-0.5 rounded-full tracking-wider">Agencia</span>}
                        </h3>
                        <p className="text-sm text-muted-foreground font-medium">DNI: {cliente.dni}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 mb-6 text-sm text-muted-foreground border-b border-border pb-4">
                    <div className="flex items-center gap-2">
                      <Phone size={16} />
                      <span>{cliente.telefono || 'Sin teléfono'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail size={16} />
                      <span>{cliente.email || 'Sin email'}</span>
                    </div>
                  </div>

                  <div className="mt-auto">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                      <Car size={14} /> Vehículos Registrados ({clienteVehiculos.length})
                    </h4>
                    
                    {clienteVehiculos.length > 0 ? (
                      <div className="space-y-2">
                        {clienteVehiculos.map(vehiculo => (
                          <div 
                            key={vehiculo.patente} 
                            onClick={() => setHistorialPatente(vehiculo.patente)}
                            className="group/veh cursor-pointer flex items-center justify-between p-3 rounded-xl bg-background border border-border hover:border-primary transition-all duration-300 hover:shadow-md"
                          >
                            <div className="flex items-center gap-3">
                              <div className="bg-secondary/50 p-2 rounded-full text-secondary-foreground group-hover/veh:bg-primary group-hover/veh:text-primary-foreground transition-colors">
                                <Car size={16} />
                              </div>
                              <div>
                                <p className="text-sm font-bold text-foreground group-hover/veh:text-primary transition-colors">{vehiculo.marca} {vehiculo.modelo}</p>
                                <p className="text-xs text-muted-foreground font-medium">{vehiculo.anio} • {vehiculo.color}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="font-mono text-xs font-bold bg-muted px-2.5 py-1 rounded-md text-foreground border border-border">
                                {vehiculo.patente}
                              </span>
                              <div className="opacity-0 group-hover/veh:opacity-100 transition-opacity text-primary bg-primary/10 p-1.5 rounded-md" title="Ver Historial">
                                <Clock size={14} />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground italic flex items-center gap-2 p-3 bg-muted/20 rounded-lg">
                        <Info size={14} /> Este cliente no tiene vehículos registrados.
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* VEHICULOS VIEW */}
      {viewMode === 'vehiculos' && (
        <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
          {loading ? (
            <div className="col-span-full flex justify-center p-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredVehiculos.length === 0 ? (
            <div className="col-span-full p-12 text-center border-2 border-dashed border-border rounded-2xl bg-card/30">
              <Car className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium text-foreground">No se encontraron vehículos</h3>
            </div>
          ) : (
            filteredVehiculos.map((vehiculo) => {
              const dueño = clientes.find(c => c.dni === vehiculo.cliente_dni);
              return (
                <div key={vehiculo.patente} className="p-5 bg-card rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow group flex flex-col h-full">
                  
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-secondary/20 p-3 rounded-full text-secondary-foreground group-hover:scale-110 transition-transform">
                        <Car size={24} />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-foreground leading-tight">
                          {vehiculo.marca}
                        </h3>
                        <p className="text-sm font-medium text-foreground/80">{vehiculo.modelo}</p>
                      </div>
                    </div>
                    <span className="font-mono text-sm font-bold bg-primary/10 text-primary px-3 py-1.5 rounded-lg border border-primary/20">
                      {vehiculo.patente}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mb-4 p-3 bg-background rounded-xl border border-border/50">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Año</p>
                      <p className="font-medium text-foreground text-sm">{vehiculo.anio || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Color</p>
                      <p className="font-medium text-foreground text-sm">{vehiculo.color || '-'}</p>
                    </div>
                  </div>

                  <div className="mt-auto pt-4 border-t border-border">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <User size={14} /> Información del Dueño
                    </h4>
                    
                    {dueño ? (
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-transparent hover:border-border transition-colors mb-4">
                        <div className="bg-background p-2 rounded-full border border-border shadow-sm">
                          <User size={16} className="text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-foreground flex items-center gap-1">
                            {dueño.nombre} {dueño.apellido}
                            {dueño.es_agencia && <span className="text-[10px] uppercase font-bold bg-blue-500/10 text-blue-500 px-1.5 rounded-full">Agencia</span>}
                          </p>
                          <p className="text-xs text-muted-foreground font-medium flex items-center gap-3 mt-0.5">
                            <span>DNI: {dueño.dni}</span>
                            {dueño.telefono && <span className="flex items-center gap-1"><Phone size={10}/> {dueño.telefono}</span>}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground italic flex items-center gap-2 p-3 bg-rose-500/5 text-rose-500 rounded-lg mb-4">
                        <Info size={14} /> Propietario no encontrado (DNI: {vehiculo.cliente_dni})
                      </div>
                    )}
                    
                    <button 
                      onClick={() => setHistorialPatente(vehiculo.patente)}
                      className="w-full mt-auto flex items-center justify-center gap-2 py-2 bg-primary/10 text-primary font-bold rounded-lg hover:bg-primary hover:text-primary-foreground transition-all duration-300"
                    >
                      <Clock size={16} /> Ver Historial
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Modales */}
      <Modal 
        isOpen={modalType === 'cliente'} 
        onClose={() => setModalType(null)} 
        title="Nuevo Cliente / Agencia"
      >
        <ClienteForm 
          onSuccess={handleCreated} 
          onCancel={() => setModalType(null)} 
        />
      </Modal>

      <Modal 
        isOpen={modalType === 'vehiculo'} 
        onClose={() => setModalType(null)} 
        title="Registrar Vehículo"
      >
        <VehiculoForm 
          onSuccess={handleCreated} 
          onCancel={() => setModalType(null)} 
        />
      </Modal>

      <Modal
        isOpen={!!historialPatente}
        onClose={() => setHistorialPatente(null)}
        title={`Historial de ${historialPatente}`}
      >
        <VehiculoHistorial patente={historialPatente} />
      </Modal>
    </div>
  );
}

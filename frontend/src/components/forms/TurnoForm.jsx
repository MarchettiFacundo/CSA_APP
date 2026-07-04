import { useState, useEffect } from "react";
import { InputWithHistory } from "../InputWithHistory";
import { api, translateError } from "../../lib/api";
import { Search, User, Car, Plus, ArrowLeft } from "lucide-react";
import { ClienteForm } from "./ClienteForm";
import { VehiculoForm } from "./VehiculoForm";
import { CustomDateTimePicker } from "../CustomDateTimePicker";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

export function TurnoForm({ onSuccess, onCancel, initialCliente = null, initialVehiculo = null }) {
  const [selectedCliente, setSelectedCliente] = useState(initialCliente || null);
  const [selectedVehiculo, setSelectedVehiculo] = useState(initialVehiculo || null);
  const [step, setStep] = useState(() => {
    if (initialVehiculo) return 3;
    if (initialCliente) return 2;
    return 1;
  }); // 1: Search, 2: Select Vehicle (if client selected), 3: Fill Turno Details, 'new_cliente', 'new_vehiculo'
  const [searchTerm, setSearchTerm] = useState("");
  
  // Data from backend
  const [clientes, setClientes] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [loadingSearch, setLoadingSearch] = useState(false);

  // Turno Form Data
  const [turnoData, setTurnoData] = useState({
    motivo: "",
    fecha_hora: "",
  });
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch all for search (ideally this should be a backend search endpoint, 
    // but for this scale we fetch all and filter client-side)
    const fetchAll = async () => {
      setLoadingSearch(true);
      try {
        const [resC, resV] = await Promise.all([
          fetch(`${API_URL}/clientes/`),
          fetch(`${API_URL}/vehiculos/`)
        ]);
        
        let fetchedClientes = [];
        let fetchedVehiculos = [];
        
        if (resC.ok) {
          fetchedClientes = await resC.json();
          setClientes(fetchedClientes);
        }
        if (resV.ok) {
          fetchedVehiculos = await resV.json();
          setVehiculos(fetchedVehiculos);
        }

        // Procesar preselecciones solo al cargar inicialmente
        if (initialVehiculo) {
          const owner = fetchedClientes.find(c => c.id === initialVehiculo.cliente_id);
          if (owner) {
            setSelectedCliente(owner);
          }
        } else if (initialCliente) {
          const clientVehicles = fetchedVehiculos.filter(v => v.cliente_id === initialCliente.id);
          if (clientVehicles.length === 1) {
            setSelectedVehiculo(clientVehicles[0]);
            setStep(3);
          }
        }
      } catch (err) {
        console.error("Search fetch error", err);
      } finally {
        setLoadingSearch(false);
      }
    };
    fetchAll();
  }, [initialCliente, initialVehiculo]);

  const handleSearchSelectCliente = (cliente) => {
    setSelectedCliente(cliente);
    const clientVehicles = vehiculos.filter(v => v.cliente_id === cliente.id);
    if (clientVehicles.length === 1) {
      setSelectedVehiculo(clientVehicles[0]);
      setStep(3); // Go straight to turno form
    } else {
      setStep(2); // Ask to pick a vehicle or create one
    }
  };

  const handleSearchSelectVehiculo = (vehiculo) => {
    setSelectedVehiculo(vehiculo);
    const owner = clientes.find(c => c.id === vehiculo.cliente_id);
    setSelectedCliente(owner || null);
    setStep(3);
  };

  const handleBackToSearch = () => {
    setSelectedCliente(null);
    setSelectedVehiculo(null);
    setStep(1);
  };

  const submitTurno = async (e) => {
    e.preventDefault();
    setLoadingSubmit(true);
    setError(null);
    try {
      const dataToSubmit = {
        ...turnoData,
        vehiculo_patente: selectedVehiculo.patente,
        fecha_hora: turnoData.fecha_hora
      };
      await api.createTurno(dataToSubmit);
      onSuccess();
    } catch (err) {
      setError(translateError(err.message || err.toString()));
    } finally {
      setLoadingSubmit(false);
    }
  };

  // -------------------- RENDER STEPS --------------------

  if (step === 'new_cliente') {
    return (
      <div>
        <button onClick={() => setStep(1)} className="flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft size={16} className="mr-1" /> Volver a búsqueda
        </button>
        <ClienteForm 
          onSuccess={() => {
            // After creating, we should ideally fetch the new client and select it.
            // For simplicity, we just reload search data and go back to step 1.
            setStep(1);
          }} 
          onCancel={() => setStep(1)} 
        />
      </div>
    );
  }

  if (step === 'new_vehiculo') {
    return (
      <div>
        <button onClick={() => setStep(selectedCliente ? 2 : 1)} className="flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft size={16} className="mr-1" /> Volver
        </button>
        <VehiculoForm 
          initialClienteId={selectedCliente ? selectedCliente.id : ""}
          onSuccess={() => setStep(1)} 
          onCancel={() => setStep(selectedCliente ? 2 : 1)} 
        />
      </div>
    );
  }

  if (step === 1) {
    const term = searchTerm.toLowerCase();
    const filteredClientes = clientes.filter(c => 
      c.nombre.toLowerCase().includes(term) || 
      (c.apellido && c.apellido.toLowerCase().includes(term))
    );
    const filteredVehiculos = vehiculos.filter(v => 
      v.patente.toLowerCase().includes(term) || 
      v.marca.toLowerCase().includes(term)
    );

    return (
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por cliente (Nombre) o patente..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        {loadingSearch ? (
          <p className="text-sm text-muted-foreground text-center py-4">Cargando base de datos...</p>
        ) : (
          <div className="max-h-64 overflow-y-auto space-y-2 pr-2">
            {searchTerm && filteredClientes.length === 0 && filteredVehiculos.length === 0 && (
              <div className="text-center py-6 text-muted-foreground text-sm">
                No se encontraron resultados para "{searchTerm}"
              </div>
            )}

            {filteredClientes.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-muted-foreground uppercase mb-2 mt-2">Clientes</h4>
                {filteredClientes.map(c => (
                  <button 
                    key={`c-${c.id}`} 
                    onClick={() => handleSearchSelectCliente(c)}
                    className="w-full text-left p-3 mb-2 rounded-lg border border-border bg-card hover:border-primary/50 transition-colors flex items-center gap-3"
                  >
                    <div className="bg-primary/10 p-2 rounded-full text-primary"><User size={16}/></div>
                    <div>
                      <div className="font-medium text-sm text-foreground">{c.nombre} {c.apellido}</div>
                      {c.telefono && <div className="text-xs text-muted-foreground">Tel: {c.telefono}</div>}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {filteredVehiculos.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-muted-foreground uppercase mb-2 mt-4">Vehículos</h4>
                {filteredVehiculos.map(v => {
                  const dueño = clientes.find(c => c.id === v.cliente_id);
                  return (
                    <button 
                      key={`v-${v.patente}`} 
                      onClick={() => handleSearchSelectVehiculo(v)}
                      className="w-full text-left p-3 mb-2 rounded-lg border border-border bg-card hover:border-primary/50 transition-colors flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="bg-secondary p-2 rounded-full text-secondary-foreground"><Car size={16}/></div>
                        <div>
                          <div className="font-medium text-sm text-foreground">{v.marca} {v.modelo}</div>
                          <div className="text-xs text-muted-foreground">
                            Dueño: {dueño ? `${dueño.nombre} ${dueño.apellido || ""}` : `ID: ${v.cliente_id}`}
                          </div>
                        </div>
                      </div>
                      <span className="text-xs font-mono font-bold bg-muted px-2 py-1 rounded">{v.patente}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <div className="flex gap-2 pt-4 border-t border-border mt-4">
          <button 
            onClick={() => setStep('new_cliente')}
            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium border border-border hover:bg-muted transition-colors text-foreground"
          >
            <Plus size={16} /> Nuevo Cliente
          </button>
          <button 
            onClick={() => setStep('new_vehiculo')}
            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium border border-border hover:bg-muted transition-colors text-foreground"
          >
            <Plus size={16} /> Nuevo Vehículo
          </button>
        </div>
      </div>
    );
  }

  if (step === 2) {
    const clientVehicles = vehiculos.filter(v => v.cliente_id === selectedCliente.id);
    return (
      <div className="space-y-4">
        <button onClick={handleBackToSearch} className="flex items-center text-sm text-muted-foreground hover:text-foreground mb-2">
          <ArrowLeft size={16} className="mr-1" /> Atrás
        </button>
        
        <div className="p-4 bg-muted/30 rounded-lg border border-border">
          <p className="text-sm font-medium text-foreground">Selecciona un vehículo de:</p>
          <p className="text-lg font-bold text-primary">{selectedCliente.nombre} {selectedCliente.apellido}</p>
        </div>

        {clientVehicles.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">Este cliente no tiene vehículos registrados.</p>
        ) : (
          <div className="space-y-2 mt-4">
            {clientVehicles.map(v => (
              <button 
                key={v.patente} 
                onClick={() => handleSearchSelectVehiculo(v)}
                className="w-full text-left p-3 rounded-lg border border-border bg-card hover:border-primary/50 transition-colors flex items-center justify-between"
              >
                <div>
                  <div className="font-medium text-sm text-foreground">{v.marca} {v.modelo}</div>
                  <div className="text-xs text-muted-foreground">Color: {v.color || 'N/A'}</div>
                </div>
                <span className="text-xs font-mono font-bold bg-muted px-2 py-1 rounded">{v.patente}</span>
              </button>
            ))}
          </div>
        )}

        <button 
          onClick={() => setStep('new_vehiculo')}
          className="w-full flex items-center justify-center gap-2 py-3 mt-4 rounded-lg text-sm font-medium border border-dashed border-primary/50 text-primary hover:bg-primary/5 transition-colors"
        >
          <Plus size={16} /> Registrar Vehículo para este Cliente
        </button>
      </div>
    );
  }

  if (step === 3) {
    return (
      <form onSubmit={submitTurno} className="space-y-4">
        <button type="button" onClick={handleBackToSearch} className="flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft size={16} className="mr-1" /> Cambiar Cliente/Vehículo
        </button>

        {error && <div className="p-3 text-sm bg-rose-500/10 text-rose-600 rounded-lg">{error}</div>}
        
        <div className="p-3 bg-primary/5 rounded-lg border border-primary/20 flex items-start gap-3">
          <div className="mt-1 text-primary"><Car size={20}/></div>
          <div>
            <p className="text-xs text-muted-foreground">Vehículo Seleccionado</p>
            <p className="font-bold text-sm text-foreground">{selectedVehiculo?.marca} {selectedVehiculo?.modelo} <span className="font-mono text-xs font-normal ml-2 bg-background px-1 rounded border border-border">{selectedVehiculo?.patente}</span></p>
            {selectedCliente && <p className="text-xs text-muted-foreground mt-0.5">Cliente: {selectedCliente.nombre} {selectedCliente.apellido}</p>}
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-foreground mb-1 mt-4">Motivo / Descripción</label>
          <InputWithHistory 
            type="text" 
            required
            historyKey="turno_motivo"
            value={turnoData.motivo}
            onChange={e => setTurnoData({...turnoData, motivo: e.target.value})}
            className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
            placeholder="Ej: Cambio de aceite y filtros"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Fecha y Hora</label>
          <CustomDateTimePicker 
            value={turnoData.fecha_hora}
            onChange={e => setTurnoData({...turnoData, fecha_hora: e.target.value})}
          />
        </div>
        
        <div className="flex justify-end gap-3 pt-4 border-t border-border mt-6">
          <button 
            type="button" 
            onClick={onCancel}
            className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-muted transition-colors text-foreground"
          >
            Cancelar
          </button>
          <button 
            type="submit" 
            disabled={loadingSubmit}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-colors"
          >
            {loadingSubmit ? "Guardando..." : "Confirmar Turno"}
          </button>
        </div>
      </form>
    );
  }

  return null;
}

import { useState, useEffect } from "react";
import { InputWithHistory } from "../InputWithHistory";
import { api } from "../../lib/api";
import { Search, User, Car, Plus, ArrowLeft, Trash2 } from "lucide-react";
import { ClienteForm } from "./ClienteForm";
import { VehiculoForm } from "./VehiculoForm";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

export function OrdenForm({ onSuccess, onCancel }) {
  const [step, setStep] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [clientes, setClientes] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [loadingSearch, setLoadingSearch] = useState(false);

  const [selectedCliente, setSelectedCliente] = useState(null);
  const [selectedVehiculo, setSelectedVehiculo] = useState(null);

  const [ordenData, setOrdenData] = useState({
    descripcion: "",
    kilometraje: "",
    servicios: []
  });
  
  // State for the new service input row
  const [newServicio, setNewServicio] = useState({
    servicio: "",
    observaciones: "",
    repuestos: ""
  });

  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAll = async () => {
      setLoadingSearch(true);
      try {
        const [resC, resV] = await Promise.all([
          fetch(`${API_URL}/clientes/`),
          fetch(`${API_URL}/vehiculos/`)
        ]);
        if (resC.ok) setClientes(await resC.json());
        if (resV.ok) setVehiculos(await resV.json());
      } catch (err) {
        console.error("Search fetch error", err);
      } finally {
        setLoadingSearch(false);
      }
    };
    fetchAll();
  }, []);

  const handleSearchSelectCliente = (cliente) => {
    setSelectedCliente(cliente);
    const clientVehicles = vehiculos.filter(v => v.cliente_dni === cliente.dni);
    if (clientVehicles.length === 1) {
      setSelectedVehiculo(clientVehicles[0]);
      setStep(3);
    } else {
      setStep(2);
    }
  };

  const handleSearchSelectVehiculo = (vehiculo) => {
    setSelectedVehiculo(vehiculo);
    const owner = clientes.find(c => c.dni === vehiculo.cliente_dni);
    setSelectedCliente(owner || null);
    setStep(3);
  };

  const addServicio = () => {
    if (!newServicio.servicio) return;
    setOrdenData({
      ...ordenData,
      servicios: [...ordenData.servicios, newServicio]
    });
    setNewServicio({ servicio: "", observaciones: "", repuestos: "" });
  };

  const removeServicio = (index) => {
    const updated = [...ordenData.servicios];
    updated.splice(index, 1);
    setOrdenData({ ...ordenData, servicios: updated });
  };

  const submitOrden = async (e) => {
    e.preventDefault();
    setLoadingSubmit(true);
    setError(null);
    try {
      const dataToSubmit = {
        ...ordenData,
        vehiculo_patente: selectedVehiculo.patente
      };
      
      const res = await fetch(`${API_URL}/ordenes/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSubmit),
      });
      
      if (!res.ok) throw new Error("Error al crear la orden de trabajo");
      onSuccess();
    } catch (err) {
      setError(err.message || "Error al crear la orden de trabajo");
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
        <ClienteForm onSuccess={() => setStep(1)} onCancel={() => setStep(1)} />
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
          initialClienteDni={selectedCliente ? selectedCliente.dni : ""}
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
      (c.apellido && c.apellido.toLowerCase().includes(term)) ||
      (c.dni && c.dni.toLowerCase().includes(term))
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
            placeholder="Buscar cliente (DNI, Nombre) o patente..." 
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
                    key={`c-${c.dni}`} onClick={() => handleSearchSelectCliente(c)}
                    className="w-full text-left p-3 mb-2 rounded-lg border border-border bg-card hover:border-primary/50 transition-colors flex items-center gap-3"
                  >
                    <div className="bg-primary/10 p-2 rounded-full text-primary"><User size={16}/></div>
                    <div>
                      <div className="font-medium text-sm text-foreground">{c.nombre} {c.apellido}</div>
                      <div className="text-xs text-muted-foreground">DNI: {c.dni || 'S/N'}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
            {filteredVehiculos.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-muted-foreground uppercase mb-2 mt-4">Vehículos</h4>
                {filteredVehiculos.map(v => (
                  <button 
                    key={`v-${v.patente}`} onClick={() => handleSearchSelectVehiculo(v)}
                    className="w-full text-left p-3 mb-2 rounded-lg border border-border bg-card hover:border-primary/50 transition-colors flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="bg-secondary p-2 rounded-full text-secondary-foreground"><Car size={16}/></div>
                      <div>
                        <div className="font-medium text-sm text-foreground">{v.marca} {v.modelo}</div>
                        <div className="text-xs text-muted-foreground">Dueño DNI: {v.cliente_dni}</div>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold bg-muted px-2 py-1 rounded">{v.patente}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex gap-2 pt-4 border-t border-border mt-4">
          <button onClick={() => setStep('new_cliente')} className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium border border-border hover:bg-muted transition-colors text-foreground">
            <Plus size={16} /> Nuevo Cliente
          </button>
          <button onClick={() => setStep('new_vehiculo')} className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium border border-border hover:bg-muted transition-colors text-foreground">
            <Plus size={16} /> Nuevo Vehículo
          </button>
        </div>
      </div>
    );
  }

  if (step === 2) {
    const clientVehicles = vehiculos.filter(v => v.cliente_dni === selectedCliente.dni);
    return (
      <div className="space-y-4">
        <button onClick={() => setStep(1)} className="flex items-center text-sm text-muted-foreground hover:text-foreground mb-2">
          <ArrowLeft size={16} className="mr-1" /> Atrás
        </button>
        <div className="p-4 bg-muted/30 rounded-lg border border-border">
          <p className="text-sm font-medium text-foreground">Selecciona un vehículo de:</p>
          <p className="text-lg font-bold text-primary">{selectedCliente.nombre} {selectedCliente.apellido}</p>
        </div>
        {clientVehicles.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">Este cliente no tiene vehículos.</p>
        ) : (
          <div className="space-y-2 mt-4">
            {clientVehicles.map(v => (
              <button 
                key={v.patente} onClick={() => handleSearchSelectVehiculo(v)}
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
        <button onClick={() => setStep('new_vehiculo')} className="w-full flex items-center justify-center gap-2 py-3 mt-4 rounded-lg text-sm font-medium border border-dashed border-primary/50 text-primary hover:bg-primary/5 transition-colors">
          <Plus size={16} /> Registrar Vehículo para este Cliente
        </button>
      </div>
    );
  }

  if (step === 3) {
    return (
      <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-2">
        <button type="button" onClick={() => setStep(1)} className="flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft size={16} className="mr-1" /> Cambiar Vehículo
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

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-foreground mb-1">Descripción General (Problema reportado)</label>
              <textarea 
                required
                rows="2"
                value={ordenData.descripcion}
                onChange={e => setOrdenData({...ordenData, descripcion: e.target.value})}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                placeholder="Falla al arrancar en frío..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Kilometraje Actual</label>
              <input 
                type="number"
                min="0"
                value={ordenData.kilometraje}
                onChange={e => setOrdenData({...ordenData, kilometraje: e.target.value ? parseInt(e.target.value) : ""})}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="Ej: 54000"
              />
            </div>
          </div>
        </div>

        <div className="pt-4 mt-4 border-t border-border">
          <h3 className="text-sm font-bold text-foreground mb-3 uppercase tracking-wider">Servicios y Tareas a Realizar</h3>
          
          {/* Table / List of services */}
          {ordenData.servicios.length > 0 && (
            <div className="space-y-3 mb-4">
              {ordenData.servicios.map((s, idx) => (
                <div key={idx} className="p-3 bg-muted/50 border border-border rounded-lg relative group">
                  <button type="button" onClick={() => removeServicio(idx)} className="absolute top-2 right-2 p-1 text-muted-foreground hover:text-rose-500 bg-background rounded-full border border-border opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 size={14} />
                  </button>
                  <p className="font-bold text-sm text-foreground">{s.servicio}</p>
                  {s.observaciones && <p className="text-xs text-muted-foreground mt-1">Obs: {s.observaciones}</p>}
                  {s.repuestos && <p className="text-xs text-muted-foreground mt-1">Repuestos: {s.repuestos}</p>}
                </div>
              ))}
            </div>
          )}

          {/* Add Service Row */}
          <div className="p-3 bg-card border border-primary/30 rounded-lg border-dashed">
            <div className="grid gap-2">
              <InputWithHistory 
                type="text" 
                historyKey="orden_servicio"
                placeholder="Nombre del servicio (Ej: Alineación, Cambio Filtro)" 
                value={newServicio.servicio}
                onChange={e => setNewServicio({...newServicio, servicio: e.target.value})}
                className="w-full px-3 py-1.5 text-sm bg-background border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <div className="grid grid-cols-2 gap-2">
                <input 
                  type="text" 
                  placeholder="Observaciones..." 
                  value={newServicio.observaciones}
                  onChange={e => setNewServicio({...newServicio, observaciones: e.target.value})}
                  className="w-full px-3 py-1.5 text-sm bg-background border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <input 
                  type="text" 
                  placeholder="Repuestos..." 
                  value={newServicio.repuestos}
                  onChange={e => setNewServicio({...newServicio, repuestos: e.target.value})}
                  className="w-full px-3 py-1.5 text-sm bg-background border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <button type="button" onClick={addServicio} disabled={!newServicio.servicio} className="w-full flex justify-center items-center gap-1 py-1.5 bg-primary/10 text-primary font-medium text-xs rounded hover:bg-primary/20 disabled:opacity-50 transition-colors mt-1">
                <Plus size={14} /> Agregar a la Orden
              </button>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end gap-3 pt-4 border-t border-border mt-6">
          <button type="button" onClick={onCancel} className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-muted transition-colors text-foreground">
            Cancelar
          </button>
          <button type="button" onClick={submitOrden} disabled={loadingSubmit} className="px-4 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-colors">
            {loadingSubmit ? "Guardando..." : "Crear Orden"}
          </button>
        </div>
      </div>
    );
  }

  return null;
}

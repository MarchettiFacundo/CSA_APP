import { useState, useEffect } from "react";
import { Plus, Wrench, Calendar, Car, ClipboardList, Search, User, Printer } from "lucide-react";
import { Modal } from "../components/Modal";
import { OrdenForm } from "../components/forms/OrdenForm";
import { api } from "../lib/api";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

// Temporalmente llamamos directo a fetch hasta añadir getOrdenes a api.js
export function Ordenes() {
  const [ordenes, setOrdenes] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrden, setSelectedOrden] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchOrdenes();
    fetch(`${API_URL}/clientes/`).then(r=>r.json()).then(setClientes).catch(e => console.error(e));
    fetch(`${API_URL}/vehiculos/`).then(r=>r.json()).then(setVehiculos).catch(e => console.error(e));
  }, []);

  const fetchOrdenes = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/ordenes/`);
      if (res.ok) {
        const data = await res.json();
        setOrdenes(data);
      }
    } catch (error) {
      console.error("Error al cargar ordenes:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreated = () => {
    setIsModalOpen(false);
    fetchOrdenes();
  };

  const filteredOrdenes = ordenes.filter(orden => {
    if (!searchTerm) return true;
    
    const v = vehiculos.find(veh => veh.patente === orden.vehiculo_patente);
    const c = v ? clientes.find(cli => cli.id === v.cliente_id) : null;
    
    const search = searchTerm.toLowerCase();
    const patenteMatch = orden.vehiculo_patente.toLowerCase().includes(search);
    const descMatch = orden.descripcion.toLowerCase().includes(search);
    const servMatch = orden.servicios && orden.servicios.some(s => s.servicio.toLowerCase().includes(search));
    const vehMatch = v && (`${v.marca} ${v.modelo}`.toLowerCase().includes(search));
    const cliMatch = c && (`${c.nombre} ${c.apellido}`.toLowerCase().includes(search));
    
    return patenteMatch || descMatch || servMatch || vehMatch || cliMatch;
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="relative w-full">
      {/* VISTA NORMAL (SE OCULTA AL IMPRIMIR) */}
      <div className="space-y-6 print:hidden">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">Órdenes de Trabajo</h1>
            <p className="text-muted-foreground mt-1">Supervisa y actualiza el estado de las reparaciones activas e historial.</p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="tour-btn-new-orden flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-lg hover:opacity-90 transition-all font-medium shadow-md hover:shadow-lg active:scale-95"
          >
            <Plus size={20} />
            Nueva Orden
          </button>
        </div>

      <div className="tour-search-orden relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
        <input 
          type="text" 
          placeholder="Buscar por auto, patente, cliente, descripción o servicio..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-card border border-border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {loading ? (
          <div className="col-span-full flex justify-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filteredOrdenes.length === 0 ? (
          <div className="col-span-full p-12 text-center border-2 border-dashed border-border rounded-2xl bg-card/30 backdrop-blur-sm">
            <ClipboardList className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium text-foreground">No se encontraron órdenes</h3>
            <p className="text-muted-foreground mt-1">Prueba con otra búsqueda.</p>
          </div>
        ) : (
          filteredOrdenes.map((orden) => (
            <div key={orden.id} onClick={() => setSelectedOrden(orden)} className="cursor-pointer flex flex-col p-6 rounded-2xl border border-border bg-card shadow-sm hover:shadow-md transition-all duration-300 group hover:-translate-y-1">
              <div className="flex justify-between items-start mb-4">
                <span className="px-3 py-1 bg-primary/10 text-primary font-bold rounded-full text-xs tracking-wide">
                  OT-#{orden.id}
                </span>
                <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
                  <Calendar size={14} />
                  <span>{new Date(orden.fecha_ingreso).toLocaleDateString()}</span>
                </div>
              </div>
              
              <div className="flex-grow space-y-4">
                <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1 uppercase tracking-wider">Descripción / Problema</h4>
                    <p className="text-foreground font-medium text-sm leading-relaxed">{orden.descripcion}</p>
                </div>
                
                {orden.servicios && orden.servicios.length > 0 && (
                  <div className="pt-3 border-t border-border">
                    <h4 className="text-xs font-bold text-muted-foreground uppercase mb-2">Servicios Realizados ({orden.servicios.length})</h4>
                    <div className="space-y-2">
                      {orden.servicios.map((srv) => (
                        <div key={srv.id} className="p-3 bg-muted/50 rounded-lg text-sm border border-border/50">
                          <p className="font-bold text-foreground">{srv.servicio}</p>
                          {srv.repuestos && <p className="text-xs text-muted-foreground mt-1"><span className="font-semibold text-foreground">Repuestos:</span> {srv.repuestos}</p>}
                          {srv.observaciones && <p className="text-xs text-muted-foreground mt-1"><span className="font-semibold text-foreground">Obs:</span> {srv.observaciones}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="pt-4 border-t border-border flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Car size={14} />
                      <span className="text-sm font-bold text-foreground ml-1 bg-muted px-2 py-0.5 rounded border border-border">{orden.vehiculo_patente}</span>
                  </div>
                  <span className="text-xs text-primary font-bold opacity-0 group-hover:opacity-100 transition-opacity">Ver Detalles &rarr;</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

        <Modal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          title="Crear Orden de Trabajo"
        >
          <OrdenForm 
            onSuccess={handleCreated} 
            onCancel={() => setIsModalOpen(false)} 
          />
        </Modal>

        {/* Modal Detalle de Orden */}
        <Modal 
          isOpen={!!selectedOrden} 
          onClose={() => setSelectedOrden(null)} 
          title="Detalles de la Orden"
        >
          {selectedOrden && (() => {
            const v = vehiculos.find(veh => veh.patente === selectedOrden.vehiculo_patente);
            const c = v ? clientes.find(cli => cli.id === v.cliente_id) : null;
            
            return (
              <div className="space-y-6">
                <div className="space-y-6">
                  <div className="flex justify-between items-start pb-4 border-b border-border">
                    <div>
                      <h2 className="text-2xl font-black">Orden de Trabajo #{selectedOrden.id}</h2>
                      <p className="text-muted-foreground mt-1 flex items-center gap-2"><Calendar size={16}/> Ingreso: {new Date(selectedOrden.fecha_ingreso).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <h3 className="text-xl font-black bg-muted px-3 py-1 rounded-lg border border-border">{selectedOrden.vehiculo_patente}</h3>
                      {v && <p className="font-bold text-foreground mt-2">{v.marca} {v.modelo}</p>}
                      {v && v.color && <p className="text-sm text-muted-foreground capitalize">Color: {v.color}</p>}
                    </div>
                  </div>
 
                  <div className="grid grid-cols-1 gap-4 bg-muted/30 p-4 rounded-xl border border-border">
                    <h4 className="text-sm font-bold text-muted-foreground uppercase flex items-center gap-2"><User size={16}/> Información del Cliente</h4>
                    {c ? (
                      <div className="grid grid-cols-2 gap-2">
                        <p><span className="text-muted-foreground">Nombre:</span> <span className="font-bold">{c.nombre} {c.apellido}</span></p>
                        {c.telefono && <p><span className="text-muted-foreground">Teléfono:</span> <span className="font-bold">{c.telefono}</span></p>}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">Cliente no encontrado en la base de datos.</p>
                    )}
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-muted-foreground uppercase mb-2">Descripción del Problema</h4>
                    <p className="text-lg font-medium text-foreground bg-primary/5 p-4 rounded-xl border border-primary/20">{selectedOrden.descripcion}</p>
                  </div>

                  {selectedOrden.servicios && selectedOrden.servicios.length > 0 && (
                    <div>
                      <h4 className="text-sm font-bold text-muted-foreground uppercase mb-3 flex items-center gap-2"><Wrench size={16}/> Servicios Realizados</h4>
                      <div className="space-y-3">
                        {selectedOrden.servicios.map((srv) => (
                          <div key={srv.id} className="p-4 bg-card rounded-xl border border-border shadow-sm">
                            <p className="font-black text-lg text-foreground mb-2">{srv.servicio}</p>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              {srv.repuestos && (
                                <div>
                                  <span className="text-muted-foreground block text-xs uppercase font-bold mb-1">Repuestos Utilizados</span>
                                  <span className="font-medium">{srv.repuestos}</span>
                                </div>
                              )}
                              {srv.observaciones && (
                                <div>
                                  <span className="text-muted-foreground block text-xs uppercase font-bold mb-1">Observaciones</span>
                                  <span className="font-medium">{srv.observaciones}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex gap-2 justify-end pt-4 border-t border-border mt-6">
                  <button onClick={handlePrint} className="px-5 py-2.5 bg-secondary text-secondary-foreground font-bold rounded-lg hover:opacity-90 transition-colors flex items-center gap-2 shadow-sm">
                    <Printer size={18}/> Exportar PDF / Imprimir
                  </button>
                </div>
              </div>
            );
          })()}
        </Modal>
      </div>
      {/* VISTA SOLO PARA IMPRESIÓN (FUERA DEL MODAL Y UI NORMAL) */}
      {selectedOrden && (() => {
        const v = vehiculos.find(veh => veh.patente === selectedOrden.vehiculo_patente);
        const c = v ? clientes.find(cli => cli.id === v.cliente_id) : null;
        
        return (
          <div className="hidden print:block absolute top-0 left-0 w-full min-h-screen bg-white text-black p-8 z-[9999]" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
            <style type="text/css" media="print">
              {`
                @page { margin: 1cm; }
                body { background-color: white !important; overflow: visible !important; }
              `}
            </style>
            
            <div className="border-b-2 border-gray-800 pb-6 mb-8 flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-black text-gray-900 m-0">Orden de Trabajo #{selectedOrden.id}</h1>
                <p className="text-gray-600 mt-2 text-lg">Fecha de Ingreso: {new Date(selectedOrden.fecha_ingreso).toLocaleDateString()}</p>
              </div>
              <div className="text-right">
                <h2 className="text-2xl font-black text-gray-900 border-2 border-gray-800 px-4 py-2 inline-block rounded-xl m-0">{selectedOrden.vehiculo_patente}</h2>
                {v && <p className="font-bold text-gray-800 mt-2 text-lg">{v.marca} {v.modelo}</p>}
                {v && v.color && <p className="text-gray-600 capitalize">Color: {v.color}</p>}
              </div>
            </div>
 
            <div className="mb-8">
              <h3 className="text-lg font-bold text-gray-800 border-b border-gray-300 pb-2 mb-4 uppercase tracking-wider">Información del Cliente</h3>
              {c ? (
                <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-base">
                  <p><span className="text-gray-500 block text-xs uppercase font-bold">Nombre Completo</span> <span className="font-bold text-gray-900">{c.nombre} {c.apellido}</span></p>
                  {c.telefono && <p><span className="text-gray-500 block text-xs uppercase font-bold">Teléfono</span> <span className="font-bold text-gray-900">{c.telefono}</span></p>}
                </div>
              ) : (
                <p className="text-gray-500 italic">Cliente no encontrado en la base de datos.</p>
              )}
            </div>

            <div className="mb-8">
              <h3 className="text-lg font-bold text-gray-800 border-b border-gray-300 pb-2 mb-4 uppercase tracking-wider">Descripción del Problema</h3>
              <p className="text-xl font-medium text-gray-900 bg-gray-50 p-6 rounded-xl border border-gray-200">{selectedOrden.descripcion}</p>
            </div>

            {selectedOrden.servicios && selectedOrden.servicios.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-bold text-gray-800 border-b border-gray-300 pb-2 mb-4 uppercase tracking-wider">Servicios Realizados</h3>
                <div className="space-y-4">
                  {selectedOrden.servicios.map((srv) => (
                    <div key={srv.id} className="p-5 bg-white rounded-xl border-2 border-gray-200">
                      <p className="font-black text-xl text-gray-900 mb-3">{srv.servicio}</p>
                      <div className="grid grid-cols-2 gap-6">
                        {srv.repuestos && (
                          <div>
                            <span className="text-gray-500 block text-xs uppercase font-bold mb-1">Repuestos Utilizados</span>
                            <span className="font-medium text-gray-800 text-lg">{srv.repuestos}</span>
                          </div>
                        )}
                        {srv.observaciones && (
                          <div>
                            <span className="text-gray-500 block text-xs uppercase font-bold mb-1">Observaciones</span>
                            <span className="font-medium text-gray-800 text-lg">{srv.observaciones}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-16 pt-8 border-t-2 border-gray-800 text-center">
              <h4 className="font-black text-2xl text-gray-900 tracking-tight">Centro de Servicios Automotor (CSA)</h4>
              <p className="text-gray-600 mt-2 text-lg">Ariza 3559, X5006BYE Córdoba - Tel: 0351-15643-7396</p>
              <p className="text-sm text-gray-400 mt-4 font-medium uppercase tracking-wider">Documento comprobante de orden de trabajo</p>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

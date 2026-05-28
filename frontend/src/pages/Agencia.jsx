import { useState, useEffect } from "react";
import { Plus, ClipboardCheck, ShieldAlert, CheckCircle2, Car } from "lucide-react";
import { Modal } from "../components/Modal";
import { ChecklistForm } from "../components/forms/ChecklistForm";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

export function Agencia() {
  const [checklists, setChecklists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchChecklists();
  }, []);

  const fetchChecklists = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/checklists/`);
      if (res.ok) {
        setChecklists(await res.json());
      }
    } catch (error) {
      console.error("Error fetching checklists:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreated = () => {
    setIsModalOpen(false);
    fetchChecklists();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">Controles de Agencia</h1>
          <p className="text-muted-foreground mt-1">Formularios de inspección estandarizados para compra-venta y flotas.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-lg hover:bg-indigo-700 transition-all font-medium shadow-md hover:shadow-lg active:scale-95"
        >
          <Plus size={20} />
          Nuevo Control
        </button>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {loading ? (
           <div className="col-span-full flex justify-center p-12">
             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
           </div>
        ) : checklists.length === 0 ? (
          <div className="col-span-full p-12 text-center border-2 border-dashed border-border rounded-2xl bg-card/30">
            <ClipboardCheck className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium text-foreground">No hay controles registrados</h3>
            <p className="text-muted-foreground mt-1">Realiza el primer checklist de inspección.</p>
          </div>
        ) : (
          checklists.map((check) => (
            <div key={check.id} className="p-6 rounded-2xl border border-border bg-card shadow-sm hover:shadow-md transition-all duration-300">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-2">
                   <div className="p-2 bg-indigo-500/10 text-indigo-600 rounded-lg">
                      <ClipboardCheck size={20} />
                   </div>
                   <div>
                     <span className="text-sm font-bold text-foreground">Reporte #{check.id}</span>
                     <p className="text-xs text-muted-foreground">{new Date(check.fecha).toLocaleDateString()}</p>
                   </div>
                </div>
                <span className="text-xs font-semibold tracking-wide bg-background px-2 py-1 rounded border border-border flex items-center gap-1.5 shadow-sm">
                  <Car size={14} /> Patente: {check.vehiculo_patente}
                </span>
              </div>
              
              <div className="space-y-3">
                <CheckItem label="Estado del Motor" isOk={check.motor_ok} />
                <CheckItem label="Chapa y Estructura" isOk={check.chapa_ok} />
                <CheckItem label="Pintura General" isOk={check.pintura_ok} />
                <CheckItem label="Interiores y Tapizados" isOk={check.interiores_ok} />
              </div>

              {check.observaciones && (
                 <div className="mt-5 pt-4 border-t border-border">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-1">Observaciones</h4>
                    <p className="text-sm text-foreground italic">"{check.observaciones}"</p>
                 </div>
              )}
            </div>
          ))
        )}
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Crear Checklist de Inspección"
      >
        <ChecklistForm 
          onSuccess={handleCreated} 
          onCancel={() => setIsModalOpen(false)} 
        />
      </Modal>
    </div>
  );
}

function CheckItem({ label, isOk }) {
  return (
    <div className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-background/50">
      <span className="text-sm font-medium text-foreground">{label}</span>
      {isOk ? (
        <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 size={18} />
          <span className="text-xs font-bold uppercase">Aprobado</span>
        </div>
      ) : (
        <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
          <ShieldAlert size={18} />
          <span className="text-xs font-bold uppercase">Revisar</span>
        </div>
      )}
    </div>
  );
}

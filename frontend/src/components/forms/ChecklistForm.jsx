import { useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

export function ChecklistForm({ onSuccess, onCancel }) {
  const [formData, setFormData] = useState({
    motor_ok: false,
    chapa_ok: false,
    pintura_ok: false,
    interiores_ok: false,
    observaciones: "",
    vehiculo_patente: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const dataToSubmit = {
        ...formData,
        vehiculo_patente: formData.vehiculo_patente
      };
      
      const res = await fetch(`${API_URL}/checklists/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSubmit),
      });
      
      if (!res.ok) throw new Error("Error al crear el checklist de inspección");
      onSuccess();
    } catch (err) {
      setError(err.message || "Error al crear el checklist");
    } finally {
      setLoading(false);
    }
  };

  const toggleCheck = (field) => {
    setFormData(prev => ({...prev, [field]: !prev[field]}));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 text-sm bg-rose-500/10 text-rose-600 rounded-lg">
          {error}
        </div>
      )}
      
      <div>
        <label className="block text-sm font-medium text-foreground mb-1 mt-4">Patente del Vehículo</label>
        <input 
          type="text" 
          required
          value={formData.vehiculo_patente}
          onChange={e => setFormData({...formData, vehiculo_patente: e.target.value})}
          className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
          placeholder="Ej: AB123CD"
        />
      </div>

      <div className="space-y-3 pt-2">
        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Estado de los Puntos de Control</h4>
        
        <div className="grid grid-cols-2 gap-3">
          <label className="flex items-center gap-2 p-3 border border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
            <input 
              type="checkbox" 
              checked={formData.motor_ok}
              onChange={() => toggleCheck('motor_ok')}
              className="rounded border-border text-indigo-600 focus:ring-indigo-500 h-4 w-4"
            />
            <span className="text-sm font-medium">Motor Aprobado</span>
          </label>
          <label className="flex items-center gap-2 p-3 border border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
            <input 
              type="checkbox" 
              checked={formData.chapa_ok}
              onChange={() => toggleCheck('chapa_ok')}
              className="rounded border-border text-indigo-600 focus:ring-indigo-500 h-4 w-4"
            />
            <span className="text-sm font-medium">Chapa Aprobada</span>
          </label>
          <label className="flex items-center gap-2 p-3 border border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
            <input 
              type="checkbox" 
              checked={formData.pintura_ok}
              onChange={() => toggleCheck('pintura_ok')}
              className="rounded border-border text-indigo-600 focus:ring-indigo-500 h-4 w-4"
            />
            <span className="text-sm font-medium">Pintura Aprobada</span>
          </label>
          <label className="flex items-center gap-2 p-3 border border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
            <input 
              type="checkbox" 
              checked={formData.interiores_ok}
              onChange={() => toggleCheck('interiores_ok')}
              className="rounded border-border text-indigo-600 focus:ring-indigo-500 h-4 w-4"
            />
            <span className="text-sm font-medium">Interiores Aprobado</span>
          </label>
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-foreground mb-1 mt-2">Observaciones Generales</label>
        <textarea 
          rows="3"
          value={formData.observaciones}
          onChange={e => setFormData({...formData, observaciones: e.target.value})}
          className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none"
          placeholder="Anotaciones sobre fallas o detalles estéticos..."
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
          disabled={loading}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {loading ? "Guardando..." : "Guardar Control"}
        </button>
      </div>
    </form>
  );
}

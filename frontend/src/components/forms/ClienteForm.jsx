import { useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

export function ClienteForm({ onSuccess, onCancel }) {
  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    dni: "",
    telefono: "",
    email: "",
    es_agencia: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch(`${API_URL}/clientes/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      
      if (!res.ok) throw new Error("Error al crear el cliente");
      onSuccess();
    } catch (err) {
      setError(err.message || "Error al crear el cliente");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 text-sm bg-rose-500/10 text-rose-600 rounded-lg">
          {error}
        </div>
      )}
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Nombre</label>
          <input 
            type="text" 
            required
            value={formData.nombre}
            onChange={e => setFormData({...formData, nombre: e.target.value})}
            className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
            placeholder="Juan"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Apellido</label>
          <input 
            type="text" 
            required
            value={formData.apellido}
            onChange={e => setFormData({...formData, apellido: e.target.value})}
            className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
            placeholder="Pérez"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">DNI</label>
          <input 
            type="text" 
            required
            value={formData.dni}
            onChange={e => setFormData({...formData, dni: e.target.value})}
            className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Teléfono</label>
          <input 
            type="tel" 
            required
            value={formData.telefono}
            onChange={e => setFormData({...formData, telefono: e.target.value})}
            className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">Email <span className="text-muted-foreground font-normal">(Opcional)</span></label>
        <input 
          type="email" 
          value={formData.email}
          onChange={e => setFormData({...formData, email: e.target.value})}
          className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>
      
      <div className="flex items-center gap-2 mt-2">
        <input 
          type="checkbox" 
          id="es_agencia"
          checked={formData.es_agencia}
          onChange={e => setFormData({...formData, es_agencia: e.target.checked})}
          className="rounded border-border text-primary focus:ring-primary h-4 w-4"
        />
        <label htmlFor="es_agencia" className="text-sm font-medium text-foreground cursor-pointer">
          Es una Agencia de Autos
        </label>
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
          className="px-4 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-colors"
        >
          {loading ? "Guardando..." : "Guardar Cliente"}
        </button>
      </div>
    </form>
  );
}

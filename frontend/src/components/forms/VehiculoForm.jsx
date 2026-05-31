import { useState, useEffect } from "react";
import { InputWithHistory } from "../InputWithHistory";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

export function VehiculoForm({ onSuccess, onCancel, initialClienteDni = "", initialData = null }) {
  const [formData, setFormData] = useState({
    patente: initialData?.patente || "",
    marca: initialData?.marca || "",
    modelo: initialData?.modelo || "",
    anio: initialData?.anio || "",
    color: initialData?.color || "",
    kilometraje: initialData?.kilometraje || "",
    cliente_dni: initialData?.cliente_dni || initialClienteDni,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [clientes, setClientes] = useState([]);
  const [fipeMarcas, setFipeMarcas] = useState([]);
  const [fipeModelos, setFipeModelos] = useState([]);
  const [loadingFipe, setLoadingFipe] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/clientes/`)
      .then(res => res.json())
      .then(data => setClientes(data))
      .catch(err => console.error("Error cargando clientes", err));
      
    // Cargar marcas FIPE iniciales
    fetch("https://parallelum.com.br/fipe/api/v1/carros/marcas")
      .then(res => res.json())
      .then(data => setFipeMarcas(data))
      .catch(err => console.error("Error cargando marcas FIPE", err));
  }, []);

  useEffect(() => {
    const marcaSeleccionada = fipeMarcas.find(m => m.nome.toUpperCase() === formData.marca.toUpperCase());
    
    if (marcaSeleccionada) {
      setLoadingFipe(true);
      fetch(`https://parallelum.com.br/fipe/api/v1/carros/marcas/${marcaSeleccionada.codigo}/modelos`)
        .then(res => res.json())
        .then(data => {
          setFipeModelos(data.modelos || []);
          setLoadingFipe(false);
        })
        .catch(err => {
          console.error("Error cargando modelos FIPE", err);
          setLoadingFipe(false);
        });
    } else {
      setFipeModelos([]);
    }
  }, [formData.marca, fipeMarcas]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const isEdit = !!initialData;
      const url = isEdit ? `${API_URL}/vehiculos/${initialData.patente}` : `${API_URL}/vehiculos/`;
      const method = isEdit ? "PUT" : "POST";
      
      const dataToSubmit = {
        ...formData,
        cliente_dni: formData.cliente_dni,
        anio: parseInt(formData.anio, 10),
        kilometraje: formData.kilometraje ? parseInt(formData.kilometraje, 10) : null
      };
      
      const res = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSubmit),
      });
      
      if (!res.ok) throw new Error(isEdit ? "Error al actualizar el vehículo" : "Error al registrar el vehículo");
      onSuccess();
    } catch (err) {
      setError(err.message || "Error al procesar la solicitud");
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
      
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">Patente / Matrícula</label>
        <input 
          type="text" 
          required
          disabled={!!initialData}
          value={formData.patente}
          onChange={e => setFormData({...formData, patente: e.target.value.toUpperCase()})}
          className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 disabled:bg-muted"
          placeholder="AB123CD"
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Marca</label>
          <input 
            type="text" 
            required
            list="fipe-marcas-list"
            value={formData.marca}
            onChange={e => setFormData({...formData, marca: e.target.value})}
            className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
            placeholder="Ej: Fiat, Volkswagen..."
          />
          <datalist id="fipe-marcas-list">
            {fipeMarcas.map(m => (
              <option key={m.codigo} value={m.nome} />
            ))}
          </datalist>
        </div>
        <div>
          <label className="flex items-center justify-between text-sm font-medium text-foreground mb-1">
            Modelo
            {loadingFipe && <span className="text-[10px] text-primary animate-pulse uppercase tracking-wider">Cargando...</span>}
          </label>
          <input 
            type="text" 
            required
            list="fipe-modelos-list"
            value={formData.modelo}
            onChange={e => setFormData({...formData, modelo: e.target.value})}
            className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
            placeholder="Seleccione o escriba el modelo"
          />
          <datalist id="fipe-modelos-list">
            {fipeModelos.map(m => (
              <option key={m.codigo} value={m.nome} />
            ))}
          </datalist>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Año</label>
          <input 
            type="number" 
            required
            min="1950"
            max={new Date().getFullYear() + 1}
            value={formData.anio}
            onChange={e => setFormData({...formData, anio: e.target.value})}
            className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Color</label>
          <InputWithHistory 
            type="text" 
            required
            historyKey="vehiculo_color"
            value={formData.color}
            onChange={e => setFormData({...formData, color: e.target.value})}
            className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
            placeholder="Ej: Rojo, Azul..."
          />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mt-2">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">DNI del Cliente Dueño</label>
          <input 
            type="text" 
            required
            list="clientes-list"
            value={formData.cliente_dni}
            onChange={e => setFormData({...formData, cliente_dni: e.target.value})}
            className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
            placeholder="Busca por nombre o DNI"
          />
          <datalist id="clientes-list">
            {clientes.map(c => (
              <option key={c.dni} value={c.dni}>
                {c.nombre} {c.apellido} (DNI: {c.dni})
              </option>
            ))}
          </datalist>
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Kilometraje Inicial</label>
          <input 
            type="number" 
            min="0"
            value={formData.kilometraje}
            onChange={e => setFormData({...formData, kilometraje: e.target.value})}
            className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
            placeholder="Ej: 45000"
          />
        </div>
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
          {loading ? "Guardando..." : (initialData ? "Actualizar Vehículo" : "Guardar Vehículo")}
        </button>
      </div>
    </form>
  );
}

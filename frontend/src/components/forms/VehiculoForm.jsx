import { useState, useEffect } from "react";
import { InputWithHistory } from "../InputWithHistory";
import { Search, User, ChevronDown } from "lucide-react";
import { extractErrorMessage, translateError } from "../../lib/api";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

export function VehiculoForm({ onSuccess, onCancel, initialClienteId = "", initialData = null }) {
  const [formData, setFormData] = useState({
    patente: initialData?.patente || "",
    marca: initialData?.marca || "",
    modelo: initialData?.modelo || "",
    anio: initialData?.anio || "",
    color: initialData?.color || "",
    kilometraje: initialData?.kilometraje || "",
    cliente_id: initialData?.cliente_id || initialClienteId,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [clientes, setClientes] = useState([]);
  const [fipeMarcas, setFipeMarcas] = useState([]);
  const [fipeModelos, setFipeModelos] = useState([]);
  const [loadingFipe, setLoadingFipe] = useState(false);

  // Estados para el selector de propietario personalizado
  const [searchPropietario, setSearchPropietario] = useState("");
  const [propietarioDropdownOpen, setPropietarioDropdownOpen] = useState(false);

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

  // Cerrar dropdown al hacer clic afuera
  useEffect(() => {
    if (!propietarioDropdownOpen) return;
    const handleOutsideClick = (e) => {
      if (!e.target.closest(".propietario-select-container")) {
        setPropietarioDropdownOpen(false);
      }
    };
    document.addEventListener("click", handleOutsideClick);
    return () => document.removeEventListener("click", handleOutsideClick);
  }, [propietarioDropdownOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const isEdit = !!initialData;
      const url = isEdit ? `${API_URL}/vehiculos/${initialData.patente}` : `${API_URL}/vehiculos/`;
      const method = isEdit ? "PUT" : "POST";
      
      if (!formData.cliente_id) {
        throw new Error("Debe seleccionar un propietario para el vehículo.");
      }

      const dataToSubmit = {
        patente: formData.patente.trim().toUpperCase(),
        marca: formData.marca.trim(),
        modelo: formData.modelo.trim() === "" ? null : formData.modelo.trim(),
        color: formData.color.trim() === "" ? null : formData.color.trim(),
        cliente_id: parseInt(formData.cliente_id, 10),
        anio: formData.anio ? parseInt(formData.anio, 10) : null,
        kilometraje: formData.kilometraje ? parseInt(formData.kilometraje, 10) : null
      };
      
      const res = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSubmit),
      });
      
      if (!res.ok) {
        const errorMsg = await extractErrorMessage(res);
        throw new Error(errorMsg);
      }
      onSuccess();
    } catch (err) {
      setError(translateError(err.message || err.toString()));
    } finally {
      setLoading(false);
    }
  };

  const dueñoSeleccionado = clientes.find(c => c.id === parseInt(formData.cliente_id, 10));

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
            Modelo <span className="text-muted-foreground font-normal text-xs">(Opcional)</span>
            {loadingFipe && <span className="text-[10px] text-primary animate-pulse uppercase tracking-wider">Cargando...</span>}
          </label>
          <input 
            type="text" 
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
          <label className="block text-sm font-medium text-foreground mb-1">Año <span className="text-muted-foreground font-normal text-xs">(Opcional)</span></label>
          <input 
            type="number" 
            min="1950"
            max={new Date().getFullYear() + 1}
            value={formData.anio}
            onChange={e => setFormData({...formData, anio: e.target.value})}
            className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Color <span className="text-muted-foreground font-normal text-xs">(Opcional)</span></label>
          <InputWithHistory 
            type="text" 
            historyKey="vehiculo_color"
            value={formData.color}
            onChange={e => setFormData({...formData, color: e.target.value})}
            className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
            placeholder="Ej: Rojo, Azul..."
          />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mt-2">
        <div className="propietario-select-container relative">
          <label className="block text-sm font-medium text-foreground mb-1">Propietario / Cliente</label>
          {dueñoSeleccionado ? (
            <div className="flex items-center justify-between p-2 px-3 bg-muted/40 border border-border rounded-lg h-[42px]">
              <div className="flex items-center gap-2 overflow-hidden truncate">
                <User size={14} className="text-primary shrink-0" />
                <span className="font-bold text-sm text-foreground truncate">
                  {dueñoSeleccionado.nombre} {dueñoSeleccionado.apellido || ""}
                </span>
              </div>
              <button 
                type="button" 
                onClick={() => setFormData({...formData, cliente_id: ""})}
                className="text-xs text-rose-500 hover:text-rose-600 font-bold px-2 py-1 bg-rose-500/10 rounded transition-colors shrink-0"
              >
                Cambiar
              </button>
            </div>
          ) : (
            <div className="relative">
              <button
                type="button"
                onClick={() => setPropietarioDropdownOpen(!propietarioDropdownOpen)}
                className="w-full text-left px-3 py-2.5 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm text-muted-foreground flex justify-between items-center h-[42px] hover:border-primary/50 transition-colors"
              >
                <span>Seleccionar Propietario...</span>
                <ChevronDown size={16} className="text-muted-foreground" />
              </button>
              
              {propietarioDropdownOpen && (
                <div className="absolute z-50 left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-xl max-h-60 overflow-y-auto p-2 space-y-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={12} />
                    <input 
                      type="text"
                      placeholder="Buscar cliente..."
                      value={searchPropietario}
                      onChange={e => setSearchPropietario(e.target.value)}
                      className="w-full pl-7 pr-3 py-1.5 text-xs bg-background border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary"
                      autoFocus
                    />
                  </div>
                  <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
                    {clientes
                      .filter(c => `${c.nombre} ${c.apellido || ""}`.toLowerCase().includes(searchPropietario.toLowerCase()))
                      .map(c => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => {
                            setFormData({...formData, cliente_id: c.id});
                            setPropietarioDropdownOpen(false);
                            setSearchPropietario("");
                          }}
                          className="w-full text-left px-3 py-2 rounded text-xs text-foreground hover:bg-primary hover:text-primary-foreground transition-colors flex items-center gap-2"
                        >
                          <User size={12} className="text-muted-foreground shrink-0" />
                          <span className="truncate">{c.nombre} {c.apellido || ""}</span>
                        </button>
                      ))
                    }
                    {clientes.filter(c => `${c.nombre} ${c.apellido || ""}`.toLowerCase().includes(searchPropietario.toLowerCase())).length === 0 && (
                      <p className="text-[10px] text-muted-foreground text-center py-2">No se encontraron clientes</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Kilometraje Inicial <span className="text-muted-foreground font-normal text-xs">(Opcional)</span></label>
          <input 
            type="number" 
            min="0"
            value={formData.kilometraje}
            onChange={e => setFormData({...formData, kilometraje: e.target.value})}
            className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 h-[42px]"
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

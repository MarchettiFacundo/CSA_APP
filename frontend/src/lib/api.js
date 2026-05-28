const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

export const api = {
  getTurnos: async () => {
    const res = await fetch(`${API_URL}/turnos/`);
    if (!res.ok) throw new Error("Error fetching turnos");
    return res.json();
  },
  createTurno: async (data) => {
    const res = await fetch(`${API_URL}/turnos/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Error creating turno");
    return res.json();
  },
  
  // Vehiculos
  getVehiculos: async () => {
    const res = await fetch(`${API_URL}/vehiculos/`);
    if (!res.ok) throw new Error("Error fetching vehiculos");
    return res.json();
  },
  
  // Clientes
  getClientes: async () => {
    const res = await fetch(`${API_URL}/clientes/`);
    if (!res.ok) throw new Error("Error fetching clientes");
    return res.json();
  }
};

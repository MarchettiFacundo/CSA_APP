const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

export const translateError = (message) => {
  if (!message) return "Ocurrió un error inesperado.";
  if (typeof message !== "string") {
    try {
      message = JSON.stringify(message);
    } catch {
      return "Ocurrió un error inesperado.";
    }
  }

  // Si el backend ya envió un mensaje amigable y claro en español, respetarlo
  if (
    message.startsWith("Ya existe ") ||
    message.startsWith("No se encontró ") ||
    message.startsWith("El cliente ") ||
    message.startsWith("El vehículo ") ||
    message.startsWith("La patente ") ||
    message.startsWith("El nombre ") ||
    message.startsWith("El teléfono ") ||
    message.startsWith("El monto ") ||
    message.startsWith("El tipo ") ||
    message.startsWith("La palabra ") ||
    message.startsWith("No se puede ") ||
    message.startsWith("Ocurrió un problema ") ||
    message.startsWith("Cliente ") ||
    message.startsWith("Vehículo ")
  ) {
    return message;
  }

  const msg = message.toLowerCase();
  
  // Errores de red y conexión
  if (msg.includes("failed to fetch") || msg.includes("network error") || msg.includes("load failed") || msg.includes("connection refused")) {
    return "No se pudo conectar con el servidor. Comprueba tu conexión a internet o si el backend está en funcionamiento.";
  }
  
  // Restricciones de Base de Datos / SQL
  if (msg.includes("unique constraint") || msg.includes("duplicate key") || msg.includes("already exists")) {
    if (msg.includes("vehiculos.patente") || msg.includes("patente")) {
      return "Ya existe un vehículo registrado con esta patente.";
    }
    if (msg.includes("configuracion_servicios")) {
      return "Ya existe una configuración de servicio con esta palabra clave.";
    }
    return "Ya existe un registro con estos datos únicos en el sistema.";
  }
  if (msg.includes("foreign key constraint") || msg.includes("violates foreign key")) {
    return "No se puede realizar la acción debido a dependencias con otros datos del sistema.";
  }

  // Validaciones comunes de Pydantic
  if (msg.includes("field required") || msg.includes("missing")) {
    return "Falta completar algún campo obligatorio.";
  }
  if (msg.includes("value is not a valid integer") || msg.includes("integer_parsing")) {
    return "El valor ingresado debe ser un número entero válido.";
  }
  if (msg.includes("value is not a valid float") || msg.includes("float_parsing")) {
    return "El valor ingresado debe ser un número decimal válido.";
  }
  if (msg.includes("value is not a valid boolean") || msg.includes("bool_parsing")) {
    return "El valor ingresado debe ser verdadero o falso.";
  }
  if (msg.includes("value is not a valid date") || msg.includes("date_parsing")) {
    return "La fecha ingresada no es válida.";
  }
  if (msg.includes("value is not a valid email") || msg.includes("value_error.email")) {
    return "El correo electrónico ingresado no tiene un formato válido.";
  }

  // Errores HTTP típicos
  if (msg.includes("404") || msg.includes("not found")) {
    return "El recurso solicitado no fue encontrado.";
  }
  if (msg.includes("401") || msg.includes("unauthorized")) {
    return "No tienes autorización para realizar esta acción.";
  }
  if (msg.includes("403") || msg.includes("forbidden")) {
    return "Acceso denegado.";
  }

  return message;
};

export const extractErrorMessage = async (res) => {
  let rawMessage = `Error del servidor (Código ${res.status})`;
  try {
    const errorData = await res.json();
    if (errorData.detail) {
      if (Array.isArray(errorData.detail)) {
        rawMessage = errorData.detail.map(err => {
          const field = err.loc ? err.loc[err.loc.length - 1] : "";
          const msg = translateError(err.msg);
          return `${field ? `Campo '${field}': ` : ""}${msg}`;
        }).join(". ");
      } else {
        rawMessage = errorData.detail;
      }
    }
  } catch (e) {
    // Si no es JSON, mantenemos el valor por defecto
  }
  return translateError(rawMessage);
};

const request = async (url, options = {}) => {
  try {
    const res = await fetch(url, options);
    if (!res.ok) {
      const errorMsg = await extractErrorMessage(res);
      throw new Error(errorMsg);
    }
    return await res.json();
  } catch (err) {
    if (err.message && (
      err.message.startsWith("Ya existe ") ||
      err.message.startsWith("No se encontró ") ||
      err.message.startsWith("El cliente ") ||
      err.message.startsWith("El vehículo ") ||
      err.message.startsWith("La patente ") ||
      err.message.startsWith("No se pudo conectar") || 
      err.message.startsWith("Falta completar") ||
      err.message.startsWith("El valor ingresado") ||
      err.message.startsWith("La fecha") ||
      err.message.startsWith("No se puede") ||
      err.message.startsWith("El recurso") ||
      err.message.startsWith("No tienes") ||
      err.message.startsWith("Acceso")
    )) {
      throw err;
    }
    throw new Error(translateError(err.message || err.toString()));
  }
};

// Caché en memoria para evitar peticiones repetitivas a la base de datos
const cache = {
  clientes: { data: null, timestamp: 0 },
  vehiculos: { data: null, timestamp: 0 }
};

const CACHE_TTL = 60 * 1000; // 60 segundos de vigencia

export const invalidateCache = (key) => {
  if (key && cache[key]) {
    cache[key] = { data: null, timestamp: 0 };
  } else {
    cache.clientes = { data: null, timestamp: 0 };
    cache.vehiculos = { data: null, timestamp: 0 };
  }
};

export const api = {
  // Health check / Keep-Alive
  checkHealth: () => request(`${API_URL}/health`),

  // Turnos
  getTurnos: () => request(`${API_URL}/turnos/`),
  createTurno: (data) => request(`${API_URL}/turnos/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }),
  
  // Vehiculos (con caché)
  getVehiculos: async (forceRefresh = false) => {
    const now = Date.now();
    if (!forceRefresh && cache.vehiculos.data && (now - cache.vehiculos.timestamp < CACHE_TTL)) {
      return cache.vehiculos.data;
    }
    const data = await request(`${API_URL}/vehiculos/`);
    cache.vehiculos = { data, timestamp: now };
    return data;
  },
  deleteVehiculo: async (patente) => {
    const res = await request(`${API_URL}/vehiculos/${patente}`, {
      method: "DELETE"
    });
    invalidateCache('vehiculos');
    return res;
  },
  
  // Clientes (con caché)
  getClientes: async (forceRefresh = false) => {
    const now = Date.now();
    if (!forceRefresh && cache.clientes.data && (now - cache.clientes.timestamp < CACHE_TTL)) {
      return cache.clientes.data;
    }
    const data = await request(`${API_URL}/clientes/`);
    cache.clientes = { data, timestamp: now };
    return data;
  },
  deleteCliente: async (id) => {
    const res = await request(`${API_URL}/clientes/${id}`, {
      method: "DELETE"
    });
    invalidateCache('clientes');
    return res;
  },

  // Órdenes
  getOrdenes: () => request(`${API_URL}/ordenes/`),
  
  // Servicios Periódicos
  getServiciosPeriodicos: () => request(`${API_URL}/servicios-periodicos/`),
  getConfiguracionServicios: () => request(`${API_URL}/configuracion-servicios/`),

  // Invalidación manual
  invalidateCache
};

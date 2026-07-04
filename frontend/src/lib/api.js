const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

export const translateError = (message) => {
  if (!message) return "Ocurrió un error inesperado.";
  const msg = message.toLowerCase();
  
  // Errores de red
  if (msg.includes("failed to fetch") || msg.includes("network error") || msg.includes("load failed") || msg.includes("connection refused")) {
    return "No se pudo conectar con el servidor. Comprueba tu conexión a internet o si el backend está en funcionamiento.";
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
  
  // Restricciones de Base de Datos / SQL
  if (msg.includes("unique constraint") || msg.includes("duplicate key") || msg.includes("already exists")) {
    return "Ya existe un registro con estos datos únicos en el sistema.";
  }
  if (msg.includes("foreign key constraint") || msg.includes("violates foreign key")) {
    return "No se puede realizar la acción debido a dependencias con otros datos del sistema.";
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
      err.message.includes("No se pudo conectar") || 
      err.message.includes("Falta completar") ||
      err.message.includes("El valor ingresado") ||
      err.message.includes("La fecha") ||
      err.message.includes("Ya existe") ||
      err.message.includes("No se puede") ||
      err.message.includes("El recurso") ||
      err.message.includes("No tienes") ||
      err.message.includes("Acceso")
    )) {
      throw err;
    }
    throw new Error(translateError(err.message || err.toString()));
  }
};

export const api = {
  getTurnos: () => request(`${API_URL}/turnos/`),
  createTurno: (data) => request(`${API_URL}/turnos/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }),
  
  // Vehiculos
  getVehiculos: () => request(`${API_URL}/vehiculos/`),
  deleteVehiculo: (patente) => request(`${API_URL}/vehiculos/${patente}`, {
    method: "DELETE"
  }),
  
  // Clientes
  getClientes: () => request(`${API_URL}/clientes/`),
  deleteCliente: (id) => request(`${API_URL}/clientes/${id}`, {
    method: "DELETE"
  })
};

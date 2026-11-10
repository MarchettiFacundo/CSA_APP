import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatWhatsAppPhone(phone) {
  if (!phone) return "";
  let clean = phone.replace(/\D/g, "");
  // Auto-formateo estándar para celulares en Argentina
  if (clean.length === 10) {
    clean = "549" + clean;
  } else if (clean.length === 11 && clean.startsWith("15")) {
    clean = "549" + clean.substring(2);
  } else if (clean.length === 12 && clean.startsWith("54") && !clean.startsWith("549")) {
    clean = "549" + clean.substring(2);
  }
  return clean;
}

export function buildWhatsAppLink(phone, message) {
  const cleanPhone = formatWhatsAppPhone(phone);
  return `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`;
}

export function generateTurnoConfirmationMessage({ cliente, vehiculo, fechaHora, motivo }) {
  const dt = new Date(fechaHora);
  const diasSemana = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
  const diaNombre = diasSemana[dt.getDay()];
  const fecha = dt.toLocaleDateString([], { day: "2-digit", month: "2-digit" });
  const hora = dt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const nombreCliente = cliente ? `${cliente.nombre} ${cliente.apellido || ""}`.trim() : "Estimado/a";
  const vehiculoInfo = vehiculo ? `${vehiculo.marca} ${vehiculo.modelo}` : "tu vehículo";
  const patente = vehiculo?.patente ? `(Patente: ${vehiculo.patente}) ` : "";
  const detalleMotivo = motivo ? ` Motivo: ${motivo}.` : "";

  return `Hola ${nombreCliente}! Te confirmamos que tu turno para ${vehiculoInfo} ${patente}quedó agendado para el ${diaNombre} ${fecha} a las ${hora} hs ${detalleMotivo} ¡Te esperamos!`;
}

export function generateTurnoReminderMessage({ cliente, vehiculo, fechaHora, motivo }) {
  const dt = new Date(fechaHora);
  const diasSemana = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
  const diaNombre = diasSemana[dt.getDay()];
  const fecha = dt.toLocaleDateString([], { day: "2-digit", month: "2-digit" });
  const hora = dt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);

  const esManana = dt.getDate() === tomorrow.getDate() && 
                   dt.getMonth() === tomorrow.getMonth() && 
                   dt.getFullYear() === tomorrow.getFullYear();

  const cuando = esManana ? `mañana ${diaNombre} ${fecha}` : `el próximo ${diaNombre} ${fecha}`;

  const nombreCliente = cliente ? `${cliente.nombre} ${cliente.apellido || ""}`.trim() : "Estimado/a";
  const vehiculoInfo = vehiculo ? `${vehiculo.marca} ${vehiculo.modelo}` : "tu vehículo";
  const patente = vehiculo?.patente ? `(Patente: ${vehiculo.patente}) ` : "";
  const detalleMotivo = motivo ? ` Motivo: ${motivo}.` : "";

  return `Hola ${nombreCliente}! Te recordamos que ${cuando} tenés un turno programado para tu ${vehiculoInfo} ${patente}a las ${hora} hs ${detalleMotivo} Por favor, confirmanos tu asistencia respondiendo a este mensaje. ¡Muchas gracias!`;
}

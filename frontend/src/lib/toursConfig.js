export const toursConfig = {
  "/turnos": [
    {
      target: "body",
      title: "📅 ¡Bienvenido al Turnero!",
      content: "Esta es tu agenda. Aquí puedes organizar qué días y a qué horas vendrán los clientes al taller. ¡Vamos a ver cómo usarla!"
    },
    {
      target: ".tour-btn-new",
      title: "Agendar un nuevo turno",
      content: "Haz clic en este botón de 'Nuevo' cuando necesites programar un ingreso. El sistema te guiará para seleccionar al cliente y su vehículo de manera sencilla."
    },
    {
      target: ".tour-view-tabs",
      title: "Cambiar la forma de ver la agenda",
      content: "Puedes ver los turnos en forma de 'Lista' (las tarjetas de cada día) o ver el 'Mes' completo en un calendario tradicional para planificar a largo plazo."
    },
    {
      target: ".tour-list-filters",
      title: "Filtros de búsqueda",
      content: "Usa estos botones para ver solo los turnos que están 'Pendientes' hoy o revisar el 'Historial Completo' de turnos pasados."
    },
    {
      target: "body",
      title: "💡 Consejos de uso rápido",
      content: "En cada tarjeta de turno verás opciones rápidas al pasar el mouse por encima: puedes reprogramarlo, cancelarlo o marcarlo como cumplido cuando el cliente llegue al taller."
    }
  ],
  "/ordenes": [
    {
      target: "body",
      title: "🛠️ Órdenes de Trabajo",
      content: "Aquí controlas las reparaciones activas en el taller. Una Orden de Trabajo (OT) sirve para anotar qué le pasa al vehículo, qué repuestos se usan y el detalle del servicio."
    },
    {
      target: ".tour-btn-new-orden",
      title: "Crear una nueva Orden",
      content: "Cuando ingrese un vehículo para ser reparado, presiona este botón para abrir la ficha de trabajo y empezar a cargar sus datos."
    },
    {
      target: ".tour-search-orden",
      title: "Buscador de trabajos",
      content: "Si tienes muchos trabajos, escribe aquí la patente, la marca del auto o el nombre del cliente para encontrar su ficha de inmediato."
    },
    {
      target: "body",
      title: "📄 Detalle e Impresión",
      content: "Haciendo clic en cualquier tarjeta de orden podrás abrir la ficha completa para agregar repuestos y tareas realizadas, o para imprimir/exportar en PDF un comprobante para el cliente."
    }
  ],
  "/clientes": [
    {
      target: "body",
      title: "👥 Directorio de Clientes y Vehículos",
      content: "Esta es tu base de datos centralizada. Aquí registras la información de contacto de los clientes y las fichas de sus vehículos."
    },
    {
      target: ".tour-clientes-tabs",
      title: "Alternar la vista",
      content: "Usa estas pestañas para ver tus 'Clientes' registrados o para ver la lista completa de 'Vehículos' que han ingresado al taller."
    },
    {
      target: ".tour-clientes-search-btn",
      title: "Registrar datos y buscar",
      content: "Puedes buscar escribiendo en la lupa, o registrar un nuevo cliente o vehículo de forma independiente con los botones de 'Cliente' o 'Vehículo'."
    },
    {
      target: "body",
      title: "⏳ Historial del Vehículo",
      content: "En la ficha de cada cliente o vehículo puedes hacer clic en 'Ver Historial' para conocer todas las visitas previas, qué arreglos se le hicieron y qué repuestos se usaron en el pasado."
    }
  ],
  "/servicios": [
    {
      target: "body",
      title: "🔔 Servicios Periódicos",
      content: "Esta sección es de mantenimiento preventivo. Te ayuda a anticiparte y recordarles a tus clientes cuándo les toca hacer un servicio repetitivo como cambio de aceite, filtros o distribución."
    },
    {
      target: ".tour-servicios-tabs",
      title: "Vencimientos y Reglas",
      content: "En 'Próximos Vencimientos' verás alertas automáticas de autos que ya requieren mantenimiento. En 'Configuración de Alertas' puedes agregar palabras clave para que el sistema aprenda cuándo programar un aviso."
    },
    {
      target: "body",
      title: "📲 Recordatorio por WhatsApp",
      content: "Cuando veas un servicio vencido o próximo a vencer, puedes presionar 'Recordar por WP' y el sistema abrirá un chat de WhatsApp con un mensaje preestablecido para avisarle a tu cliente con un solo clic."
    }
  ],
  "/agencia": [
    {
      target: "body",
      title: "📋 Controles de Agencia",
      content: "Esta herramienta sirve para realizar inspecciones rápidas y estandarizadas (checklists) del estado del motor, chapa, pintura e interiores. Es ideal al recibir flotas o vehículos de agencias."
    }
  ],
  "/recordatorios": [
    {
      target: "body",
      title: "💬 Recordatorio de Turnos",
      content: "Esta pantalla escanea los turnos programados para el día de mañana y te permite enviarles un recordatorio amistoso a los clientes por WhatsApp para confirmar su asistencia."
    }
  ]
};

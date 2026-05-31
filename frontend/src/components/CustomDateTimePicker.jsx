import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight, Check } from "lucide-react";
import { cn } from "../lib/utils";

export function CustomDateTimePicker({ value, onChange, className }) {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef(null);
  const popoverRef = useRef(null);
  
  // Coordenadas para posicionar el portal flotante
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0, placement: "bottom" });

  // Inicializar fecha local basada en el valor provisto o la actual
  const [selectedDate, setSelectedDate] = useState(() => {
    return value ? new Date(value) : new Date();
  });

  const [currentMonth, setCurrentMonth] = useState(() => {
    return value ? new Date(value) : new Date();
  });

  // Sincronizar fecha seleccionada con prop externa
  useEffect(() => {
    if (value) {
      const d = new Date(value);
      if (!isNaN(d.getTime())) {
        setSelectedDate(d);
      }
    }
  }, [value]);

  // Función para calcular la posición del botón y el popover flotante
  const updateCoords = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;
      
      const popoverWidth = 440; // Ancho máximo aproximado del popover
      const popoverHeight = 360; // Altura máxima aproximada del popover con margen de seguridad
      
      let left = rect.left + window.scrollX;
      
      // Ajustar posición horizontal si desborda por la derecha
      if (left + popoverWidth > screenWidth) {
        left = screenWidth - popoverWidth - 20;
      }
      
      // Asegurar que no desborde por la izquierda en pantallas pequeñas
      if (left < 16) {
        left = 16;
      }

      // Lógica de volteo vertical (Vertical Flip)
      const spaceBelow = screenHeight - rect.bottom;
      const spaceAbove = rect.top;
      
      let top = rect.bottom + window.scrollY;
      let placement = "bottom";
      
      // Si no hay suficiente espacio abajo y sí lo hay arriba, volteamos el selector hacia arriba
      if (spaceBelow < popoverHeight && spaceAbove > popoverHeight) {
        top = rect.top + window.scrollY - popoverHeight - 8; // 8px de margen de separación
        placement = "top";
      } else if (spaceBelow < popoverHeight && spaceBelow < spaceAbove) {
        // En caso extremo que no quepa en ninguno, pero haya más espacio arriba
        top = Math.max(10, rect.top + window.scrollY - popoverHeight - 8);
        placement = "top";
      }

      setCoords({
        top: top,
        left: left,
        width: rect.width,
        placement: placement
      });
    }
  };

  // Recalcular posición al abrirse y ante scroll/resize
  useEffect(() => {
    if (isOpen) {
      updateCoords();
      // Pequeño retardo para asegurar que los estilos de render se apliquen
      const timer = setTimeout(updateCoords, 50);

      window.addEventListener("scroll", updateCoords, true);
      window.addEventListener("resize", updateCoords);
      
      return () => {
        clearTimeout(timer);
        window.removeEventListener("scroll", updateCoords, true);
        window.removeEventListener("resize", updateCoords);
      };
    }
  }, [isOpen]);

  // Manejar el cierre al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event) {
      const clickedInsideButton = buttonRef.current && buttonRef.current.contains(event.target);
      const clickedInsidePopover = popoverRef.current && popoverRef.current.contains(event.target);
      
      if (isOpen && !clickedInsideButton && !clickedInsidePopover) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // --- Lógica del Calendario ---
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday

  // Lunes: 0, Martes: 1, ..., Domingo: 6
  const adjustedFirstDayIndex = firstDayIndex === 0 ? 6 : firstDayIndex - 1;

  const monthNames = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];
  const dayNames = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sá", "Do"];

  const handlePrevMonth = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentMonth(new Date(year, month - 1, 1));
  };

  const handleNextMonth = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentMonth(new Date(year, month + 1, 1));
  };

  const handleSelectDay = (day) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(1); // Previene desbordamiento si el día actual es 31 y el nuevo mes tiene menos días
    newDate.setFullYear(year);
    newDate.setMonth(month);
    newDate.setDate(day);
    setSelectedDate(newDate);
    updateOutput(newDate);
  };

  // --- Lógica de la Hora ---
  const hour = selectedDate.getHours();
  const minute = selectedDate.getMinutes();

  const handleHourChange = (newHour) => {
    const val = Math.min(23, Math.max(0, parseInt(newHour) || 0));
    const newDate = new Date(selectedDate);
    newDate.setHours(val);
    setSelectedDate(newDate);
    updateOutput(newDate);
  };

  const handleMinuteChange = (newMinute) => {
    const val = Math.min(59, Math.max(0, parseInt(newMinute) || 0));
    const newDate = new Date(selectedDate);
    newDate.setMinutes(val);
    setSelectedDate(newDate);
    updateOutput(newDate);
  };

  const incrementHour = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const newDate = new Date(selectedDate);
    newDate.setHours((hour + 1) % 24);
    setSelectedDate(newDate);
    updateOutput(newDate);
  };

  const decrementHour = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const newDate = new Date(selectedDate);
    newDate.setHours((hour - 1 + 24) % 24);
    setSelectedDate(newDate);
    updateOutput(newDate);
  };

  const incrementMinute = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const newDate = new Date(selectedDate);
    const currentMin = selectedDate.getMinutes();
    const nextMin = (Math.floor(currentMin / 5) * 5 + 5) % 60;
    newDate.setMinutes(nextMin);
    setSelectedDate(newDate);
    updateOutput(newDate);
  };

  const decrementMinute = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const newDate = new Date(selectedDate);
    const currentMin = selectedDate.getMinutes();
    const prevMin = (Math.ceil(currentMin / 5) * 5 - 5 + 60) % 60;
    newDate.setMinutes(prevMin);
    setSelectedDate(newDate);
    updateOutput(newDate);
  };

  // Convertir objeto Date al formato YYYY-MM-DDTHH:MM
  const updateOutput = (dateObj) => {
    const yyyy = dateObj.getFullYear();
    const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
    const dd = String(dateObj.getDate()).padStart(2, "0");
    const hh = String(dateObj.getHours()).padStart(2, "0");
    const min = String(dateObj.getMinutes()).padStart(2, "0");
    
    const formatted = `${yyyy}-${mm}-${dd}T${hh}:${min}`;
    onChange({ target: { value: formatted } });
  };

  // Formateadores amigables
  const formatReadableDate = () => {
    if (!value) return "Selecciona fecha y hora...";
    const dateObj = new Date(value);
    if (isNaN(dateObj.getTime())) return "Fecha inválida";
    
    const options = { weekday: 'long', day: 'numeric', month: 'long' };
    const dateStr = dateObj.toLocaleDateString('es-AR', options);
    
    let hh = String(dateObj.getHours()).padStart(2, "0");
    let min = String(dateObj.getMinutes()).padStart(2, "0");
    
    const capitalizedDateStr = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);
    return `${capitalizedDateStr} - ${hh}:${min} hs`;
  };

  const isToday = (day) => {
    const today = new Date();
    return today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
  };

  const isSelected = (day) => {
    return selectedDate.getDate() === day && selectedDate.getMonth() === month && selectedDate.getFullYear() === year;
  };

  return (
    <div className="relative w-full">
      {/* Botón / Campo Desencadenador */}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center justify-between px-4 py-3 bg-background border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-left transition-all duration-300",
          isOpen ? "border-primary ring-2 ring-primary/20 shadow-lg" : "border-border hover:border-primary/40",
          value ? "text-foreground font-bold" : "text-muted-foreground font-medium",
          className
        )}
      >
        <div className="flex items-center gap-3">
          <CalendarIcon size={18} className="text-primary" />
          <span className="text-sm truncate">{formatReadableDate()}</span>
        </div>
        <Clock size={16} className="opacity-60" />
      </button>

      {/* Popover Flotante (React Portal inyectado al body) */}
      {isOpen && createPortal(
        <div
          ref={popoverRef}
          className={cn(
            "fixed z-[9999] bg-card/95 backdrop-blur-xl border border-border/80 shadow-2xl rounded-2xl p-5 flex flex-col gap-4 w-[90vw] max-w-[440px]",
            coords.placement === "top" 
              ? "animate-in fade-in slide-in-from-bottom-2 duration-300" 
              : "animate-in fade-in slide-in-from-top-2 duration-300"
          )}
          style={{
            top: `${coords.top}px`,
            left: `${coords.left}px`,
          }}
        >
          {/* Indicador estético superior o inferior según la posición de apertura */}
          <div 
            className={cn(
              "absolute left-0 right-0 h-1 bg-gradient-to-r from-primary to-primary/40",
              coords.placement === "top" ? "bottom-0 rounded-b-2xl" : "top-0 rounded-t-2xl"
            )} 
          />
          
          <div className="flex flex-col sm:flex-row gap-5 divide-y sm:divide-y-0 sm:divide-x divide-border/60">
            
            {/* Sección Calendario */}
            <div className="flex-1 pb-4 sm:pb-0">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-black text-foreground tracking-tight">
                  {monthNames[month]} {year}
                </span>
                <div className="flex gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={handlePrevMonth}
                    className="p-1.5 rounded-lg border border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ChevronLeft size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={handleNextMonth}
                    className="p-1.5 rounded-lg border border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ChevronRight size={15} />
                  </button>
                </div>
              </div>

              {/* Días de la semana */}
              <div className="grid grid-cols-7 gap-1.5 mb-2">
                {dayNames.map((day) => (
                  <div key={day} className="text-[10px] font-black text-muted-foreground uppercase text-center py-1">
                    {day}
                  </div>
                ))}
              </div>

              {/* Días del mes */}
              <div className="grid grid-cols-7 gap-1.5">
                {/* Días vacíos iniciales */}
                {Array.from({ length: adjustedFirstDayIndex }).map((_, i) => (
                  <div key={`empty-${i}`} className="aspect-square"></div>
                ))}

                {/* Días activos */}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const active = isSelected(day);
                  const current = isToday(day);

                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => handleSelectDay(day)}
                      className={cn(
                        "aspect-square flex items-center justify-center rounded-lg text-xs font-bold transition-all duration-200 border border-transparent",
                        active
                          ? "bg-primary text-primary-foreground shadow-md scale-105"
                          : current
                          ? "bg-primary/15 text-primary border-primary/30"
                          : "hover:bg-muted text-foreground"
                      )}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sección Hora */}
            <div className="flex flex-col items-center justify-center sm:pl-5 pt-4 sm:pt-0 sm:w-44 gap-3.5">
              <div className="flex items-center gap-1.5 text-[10px] font-black text-muted-foreground uppercase tracking-wider">
                <Clock size={12} className="text-primary" />
                <span>Configurar Hora</span>
              </div>
              
              <div className="flex items-center gap-2">
                {/* Horas */}
                <div className="flex flex-col items-center">
                  <button
                    type="button"
                    onClick={incrementHour}
                    className="p-1 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ChevronRight size={13} className="-rotate-90" />
                  </button>
                  <input
                    type="text"
                    maxLength={2}
                    value={String(hour).padStart(2, "0")}
                    onChange={(e) => handleHourChange(e.target.value)}
                    className="w-12 h-12 text-center text-xl font-black bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
                  />
                  <button
                    type="button"
                    onClick={decrementHour}
                    className="p-1 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ChevronRight size={13} className="rotate-90" />
                  </button>
                </div>

                <span className="text-xl font-black text-muted-foreground/80">:</span>

                {/* Minutos */}
                <div className="flex flex-col items-center">
                  <button
                    type="button"
                    onClick={incrementMinute}
                    className="p-1 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ChevronRight size={13} className="-rotate-90" />
                  </button>
                  <input
                    type="text"
                    maxLength={2}
                    value={String(minute).padStart(2, "0")}
                    onChange={(e) => handleMinuteChange(e.target.value)}
                    className="w-12 h-12 text-center text-xl font-black bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
                  />
                  <button
                    type="button"
                    onClick={decrementMinute}
                    className="p-1 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ChevronRight size={13} className="rotate-90" />
                  </button>
                </div>
              </div>

              {/* Botón Confirmar */}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 mt-2 bg-primary text-primary-foreground font-bold rounded-xl hover:opacity-95 text-xs shadow-md transition-all active:scale-95"
              >
                <Check size={14} />
                Confirmar
              </button>
            </div>

          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

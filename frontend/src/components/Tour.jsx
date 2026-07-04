import { useState, useEffect, useRef } from "react";
import { useTour } from "../context/TourContext";
import { ArrowLeft, ArrowRight, X } from "lucide-react";
import { cn } from "../lib/utils";

export function Tour() {
  const {
    activeTour,
    currentStep,
    tourSteps,
    nextStep,
    prevStep,
    endTour,
    isTourActive,
    currentStepData,
    isFirstStep,
    isLastStep
  } = useTour();

  const [coords, setCoords] = useState(null);
  const [popoverPos, setPopoverPos] = useState({ top: 0, left: 0, placement: "bottom" });
  const popoverRef = useRef(null);

  // Escuchar redimensionamiento, scroll y cambios de paso para actualizar coordenadas
  useEffect(() => {
    if (!isTourActive || !currentStepData) {
      setCoords(null);
      return;
    }

    const updateCoords = () => {
      const target = currentStepData.target;
      if (!target || target === "body") {
        setCoords(null);
        return;
      }

      const element = document.querySelector(target);
      if (element) {
        // Asegurar que el elemento esté a la vista antes de calcular
        element.scrollIntoView({ block: "center", behavior: "smooth" });
        
        // Esperar brevemente a que termine el scroll para calcular la posición real
        setTimeout(() => {
          const rect = element.getBoundingClientRect();
          setCoords({
            x: rect.left + window.scrollX,
            y: rect.top + window.scrollY,
            width: rect.width,
            height: rect.height,
            clientLeft: rect.left,
            clientTop: rect.top
          });
        }, 150);
      } else {
        // Si el elemento no existe (ej. modal cerrado), se comporta como pantalla completa
        setCoords(null);
      }
    };

    updateCoords();

    // Re-calcular en eventos comunes
    window.addEventListener("resize", updateCoords);
    window.addEventListener("scroll", updateCoords);

    // Un timer corto por si hay animaciones o carga diferida en la UI
    const timer = setTimeout(updateCoords, 400);

    return () => {
      window.removeEventListener("resize", updateCoords);
      window.removeEventListener("scroll", updateCoords);
      clearTimeout(timer);
    };
  }, [isTourActive, currentStep, currentStepData]);

  // Posicionar el popover
  useEffect(() => {
    if (!isTourActive || !popoverRef.current) return;

    const popover = popoverRef.current;
    const popoverWidth = popover.offsetWidth || 340;
    const popoverHeight = popover.offsetHeight || 180;
    const padding = 12;

    if (!coords) {
      // Centrado en pantalla
      setPopoverPos({
        top: (window.innerHeight - popoverHeight) / 2,
        left: (window.innerWidth - popoverWidth) / 2,
        placement: "center"
      });
      return;
    }

    // Calcular posición óptima: por defecto abajo, si no cabe arriba
    let top = coords.clientTop + coords.height + padding;
    let left = coords.clientLeft + coords.width / 2 - popoverWidth / 2;
    let placement = "bottom";

    // Si desborda por abajo, colocar arriba
    if (top + popoverHeight > window.innerHeight) {
      top = coords.clientTop - popoverHeight - padding;
      placement = "top";
    }

    // Si desborda por arriba también, centrar horizontalmente al lado
    if (top < 0) {
      top = Math.max(padding, coords.clientTop + coords.height / 2 - popoverHeight / 2);
      placement = "bottom";
    }

    // Ajustar límites de los costados
    left = Math.max(padding, Math.min(window.innerWidth - popoverWidth - padding, left));

    setPopoverPos({ top, left, placement });
  }, [coords, isTourActive, currentStep]);

  if (!isTourActive || !currentStepData) return null;

  const hasTarget = coords !== null;
  const padding = 8; // Espaciado del foco sobre el elemento

  return (
    <div className="fixed inset-0 z-[9999] overflow-hidden pointer-events-none select-none">
      {/* SVG Mask Overlay */}
      <svg className="absolute inset-0 w-full h-full pointer-events-auto">
        <defs>
          <mask id="tour-mask-cutout">
            {/* Fondo blanco: todo es visible/oscurecido */}
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {/* Rectángulo negro: área de corte (transparente) */}
            {hasTarget && (
              <rect
                x={coords.clientLeft - padding}
                y={coords.clientTop - padding}
                width={coords.width + padding * 2}
                height={coords.height + padding * 2}
                rx="12"
                ry="12"
                fill="black"
                className="transition-all duration-300 ease-in-out"
              />
            )}
          </mask>
        </defs>
        
        {/* Fondo semi-transparente que usa la máscara */}
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(15, 23, 42, 0.7)"
          mask="url(#tour-mask-cutout)"
          className="backdrop-blur-[1px] transition-all duration-300"
          onClick={endTour}
        />
      </svg>

      {/* Popover */}
      <div
        ref={popoverRef}
        className={cn(
          "absolute pointer-events-auto w-[90vw] sm:w-[340px] p-6 rounded-2xl bg-card border border-border shadow-2xl transition-all duration-300 ease-in-out flex flex-col justify-between select-text animate-in fade-in zoom-in-95 duration-200",
          popoverPos.placement === "center" ? "fixed" : "absolute"
        )}
        style={{
          top: `${popoverPos.top}px`,
          left: `${popoverPos.left}px`,
        }}
      >
        {/* Header del Popover */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <h3 className="text-base font-extrabold text-foreground flex items-center gap-1.5 leading-snug">
            {currentStepData.title}
          </h3>
          <button
            onClick={endTour}
            className="p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
            title="Cerrar guía"
          >
            <X size={16} />
          </button>
        </div>

        {/* Contenido descriptivo */}
        <p className="text-sm font-medium text-muted-foreground mb-5 leading-relaxed">
          {currentStepData.content}
        </p>

        {/* Footer del Popover (Acciones) */}
        <div className="flex items-center justify-between border-t border-border/50 pt-4 mt-auto">
          {/* Indicador de pasos */}
          <span className="text-xs font-bold text-muted-foreground/80">
            Paso {currentStep + 1} de {tourSteps.length}
          </span>

          <div className="flex items-center gap-2">
            {!isFirstStep && (
              <button
                onClick={prevStep}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-border bg-background hover:bg-muted text-xs font-bold text-foreground transition-all duration-200"
              >
                <ArrowLeft size={14} />
                Atrás
              </button>
            )}

            <button
              onClick={nextStep}
              className="flex items-center gap-1 px-4 py-1.5 rounded-xl bg-primary hover:opacity-95 text-primary-foreground text-xs font-extrabold shadow-[0_4px_10px_rgba(var(--primary),0.3)] transition-all duration-200"
            >
              {isLastStep ? (
                "Entendido"
              ) : (
                <>
                  Siguiente
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

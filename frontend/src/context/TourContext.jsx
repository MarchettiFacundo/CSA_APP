import { createContext, useContext, useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { toursConfig } from "../lib/toursConfig";

const TourContext = createContext(null);

export function TourProvider({ children }) {
  const [activeTour, setActiveTour] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [tourSteps, setTourSteps] = useState([]);
  const location = useLocation();

  // Detener el tour si el usuario cambia de página manualmente
  useEffect(() => {
    endTour();
  }, [location.pathname]);

  const startTour = (path) => {
    // Si hay un tour configurado para la ruta dada
    const steps = toursConfig[path];
    if (steps && steps.length > 0) {
      setActiveTour(path);
      setCurrentStep(0);
      setTourSteps(steps);
    } else {
      console.warn(`No hay tour configurado para la ruta: ${path}`);
    }
  };

  const nextStep = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      endTour();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const endTour = () => {
    setActiveTour(null);
    setCurrentStep(0);
    setTourSteps([]);
  };

  const isTourActive = activeTour !== null;

  return (
    <TourContext.Provider
      value={{
        activeTour,
        currentStep,
        tourSteps,
        startTour,
        nextStep,
        prevStep,
        endTour,
        isTourActive,
        currentStepData: tourSteps[currentStep] || null,
        isFirstStep: currentStep === 0,
        isLastStep: currentStep === tourSteps.length - 1
      }}
    >
      {children}
    </TourContext.Provider>
  );
}

export function useTour() {
  const context = useContext(TourContext);
  if (!context) {
    throw new Error("useTour debe usarse dentro de un TourProvider");
  }
  return context;
}

import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { MainLayout } from "./layouts/MainLayout";
import { Turnos } from "./pages/Turnos";
import { Ordenes } from "./pages/Ordenes";
import { ClientesVehiculos } from "./pages/ClientesVehiculos";
import { ServiciosPeriodicos } from "./pages/ServiciosPeriodicos";
import { Agencia } from "./pages/Agencia";

// Temporary placeholder pages
const Placeholder = ({ title }) => (
  <div className="flex flex-col items-center justify-center h-full space-y-4">
    <h1 className="text-4xl font-bold text-foreground">{title}</h1>
    <p className="text-muted-foreground text-lg">Módulo en construcción...</p>
  </div>
);

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Navigate to="/turnos" replace />} />
          <Route path="turnos" element={<Turnos />} />
          <Route path="ordenes" element={<Ordenes />} />
          <Route path="clientes" element={<ClientesVehiculos />} />
          <Route path="vehiculos" element={<Navigate to="/clientes" replace />} />
          <Route path="servicios" element={<ServiciosPeriodicos />} />
          <Route path="agencia" element={<Agencia />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;

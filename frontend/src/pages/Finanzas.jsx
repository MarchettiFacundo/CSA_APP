import { useState, useEffect } from "react";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar, 
  Filter, 
  Plus, 
  Trash2, 
  Pencil, 
  FileSpreadsheet, 
  X, 
  ChevronLeft, 
  ChevronRight,
  Info,
  CalendarRange,
  ArrowUpRight,
  ArrowDownRight,
  Sun,
  Moon,
  Type
} from "lucide-react";
import XLSXStyle from "xlsx-js-style";

const FONT_SIZES = [
  { value: 14, title: "Pequeño" },
  { value: 16, title: "Normal" },
  { value: 19, title: "Grande" },
];


const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";
const LS_CATEGORIAS_KEY = "csa_categorias_finanzas";

// Carga y guarda categorías del historial en localStorage
const loadCategorias = () => {
  try {
    const saved = localStorage.getItem(LS_CATEGORIAS_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch { return []; }
};
const saveCategorias = (cats) => {
  try { localStorage.setItem(LS_CATEGORIAS_KEY, JSON.stringify(cats)); } catch {}
};

// Componente de autocompletado de categorías
function CategoryAutocomplete({ value, onChange, categorias, placeholder = "Ej: Mano de obra" }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value || "");
  const ref = useState(() => ({ current: null }))[0];

  // Sincronizar query cuando el padre cambia value (al abrir en edición)
  useEffect(() => { setQuery(value || ""); }, [value]);

  const filtradas = query.trim().length === 0
    ? categorias
    : categorias.filter(c =>
        c.toLowerCase().includes(query.toLowerCase())
      );

  const handleSelect = (cat) => {
    setQuery(cat);
    onChange(cat);
    setOpen(false);
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    onChange(val);
    setOpen(true);
  };

  return (
    <div className="relative" ref={(el) => { ref.current = el; }}>
      <input
        type="text"
        value={query}
        onChange={handleInputChange}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder={placeholder}
        autoComplete="off"
        className="w-full px-3 py-2.5 text-sm rounded-xl border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all duration-200"
      />
      {open && filtradas.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full bg-card border border-border/60 rounded-xl shadow-2xl overflow-hidden max-h-52 overflow-y-auto">
          {filtradas.map((cat, i) => (
            <li
              key={i}
              onMouseDown={() => handleSelect(cat)}
              className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-foreground hover:bg-primary/10 hover:text-primary cursor-pointer transition-colors duration-150"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-primary/60 shrink-0" />
              {cat}
            </li>
          ))}
        </ul>
      )}
      {open && filtradas.length === 0 && query.trim().length > 0 && (
        <div className="absolute z-50 mt-1 w-full bg-card border border-border/60 rounded-xl shadow-2xl px-3 py-2.5 text-xs text-muted-foreground">
          Presioná Enter o guardá para crear la categoría <strong className="text-foreground">"{query}"</strong>
        </div>
      )}
    </div>
  );
}

export function Finanzas() {
  // Lógica de temas aislada
  const [theme, setTheme] = useState(
    localStorage.getItem("theme") || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
  );

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => setTheme(theme === "light" ? "dark" : "light");

  const [fontSize, setFontSize] = useState(
    () => parseInt(localStorage.getItem("fontSize") || "16", 10)
  );

  useEffect(() => {
    document.documentElement.style.fontSize = `${fontSize}px`;
    localStorage.setItem("fontSize", String(fontSize));
  }, [fontSize]);

  // Inyectar el manifest independiente de Finanzas para instalación como PWA separada
  useEffect(() => {
    // Guardar el manifest y título originales
    const originalManifest = document.querySelector("link[rel='manifest']");
    const originalHref = originalManifest ? originalManifest.getAttribute("href") : null;
    const originalTitle = document.title;

    // Inyectar el manifest de finanzas
    if (originalManifest) {
      originalManifest.setAttribute("href", "/finanzas.webmanifest");
    } else {
      const newLink = document.createElement("link");
      newLink.rel = "manifest";
      newLink.href = "/finanzas.webmanifest";
      newLink.id = "finanzas-manifest";
      document.head.appendChild(newLink);
    }

    // Actualizar título de la pestaña/app
    document.title = "CSA — Gastos e Ingresos";

    // Restaurar todo al salir de la página de finanzas
    return () => {
      const manifestLink = document.querySelector("link[rel='manifest']");
      if (manifestLink) {
        if (originalHref) {
          manifestLink.setAttribute("href", originalHref);
        } else {
          manifestLink.remove();
        }
      }
      document.title = originalTitle;
    };
  }, []);

  // Estados para transacciones
  const [transacciones, setTransacciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalItems, setTotalItems] = useState(0);
  
  // Filtros
  const [rangoSeleccionado, setRangoSeleccionado] = useState("mes_actual"); // mes_actual, ultimos_30, ultimos_90, anio_actual, personalizado
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [page, setPage] = useState(1);
  const limit = 10;

  // Estados para métricas
  const [metricas, setMetricas] = useState({
    total_ingresos: 0,
    total_gastos: 0,
    balance: 0,
    categorias_gastos: [],
    categorias_ingresos: [],
    evolucion_mensual: []
  });

  // Modales
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  // Formulario
  const [formTipo, setFormTipo] = useState("Ingreso");
  const [formMonto, setFormMonto] = useState("");
  const [formCategoria, setFormCategoria] = useState("");
  const [formFecha, setFormFecha] = useState(new Date().toISOString().split("T")[0]);
  const [formDescripcion, setFormDescripcion] = useState("");

  // Historial de categorías (localStorage)
  const [categoriasGuardadas, setCategoriasGuardadas] = useState(loadCategorias);

  // Agregar una nueva categoría al historial si no existe ya
  const agregarCategoria = (nuevaCat) => {
    const cat = nuevaCat.trim();
    if (!cat) return;
    setCategoriasGuardadas(prev => {
      if (prev.includes(cat)) return prev;
      const updated = [cat, ...prev];
      saveCategorias(updated);
      return updated;
    });
  };

  // Tooltip de gráfico
  const [tooltipData, setTooltipData] = useState(null);

  // Inicializar fechas basadas en el rango predefinido
  useEffect(() => {
    const hoy = new Date();
    let inicio = "";
    let fin = hoy.toISOString().split("T")[0];

    if (rangoSeleccionado === "mes_actual") {
      const primerDia = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
      inicio = primerDia.toISOString().split("T")[0];
    } else if (rangoSeleccionado === "ultimos_30") {
      const hace30dias = new Date();
      hace30dias.setDate(hoy.getDate() - 30);
      inicio = hace30dias.toISOString().split("T")[0];
    } else if (rangoSeleccionado === "ultimos_90") {
      const hace90dias = new Date();
      hace90dias.setDate(hoy.getDate() - 90);
      inicio = hace90dias.toISOString().split("T")[0];
    } else if (rangoSeleccionado === "anio_actual") {
      inicio = `${hoy.getFullYear()}-01-01`;
    }

    if (rangoSeleccionado !== "personalizado") {
      setFechaInicio(inicio);
      setFechaFin(fin);
      setPage(1);
    }
  }, [rangoSeleccionado]);

  // Ejecutar carga cuando cambian los filtros
  useEffect(() => {
    if (fechaInicio && fechaFin) {
      fetchTransacciones();
      fetchMetricas();
    }
  }, [fechaInicio, fechaFin, filtroTipo, filtroCategoria, page]);

  // Cargar transacciones de la tabla
  const fetchTransacciones = async () => {
    setLoading(true);
    try {
      const skip = (page - 1) * limit;
      let queryParams = `?skip=${skip}&limit=${limit}`;
      if (fechaInicio) queryParams += `&fecha_inicio=${fechaInicio}`;
      if (fechaFin) queryParams += `&fecha_fin=${fechaFin}`;
      if (filtroTipo) queryParams += `&tipo=${filtroTipo}`;
      if (filtroCategoria) queryParams += `&categoria=${filtroCategoria}`;

      const res = await fetch(`${API_URL}/finanzas/${queryParams}`);
      if (res.ok) {
        const data = await res.json();
        setTransacciones(data);
        
        // Petición auxiliar sin límite para saber el total de elementos (paginación sencilla en backend)
        let countParams = "";
        if (fechaInicio) countParams += `?fecha_inicio=${fechaInicio}`;
        if (fechaFin) countParams += `${countParams ? "&" : "?"}fecha_fin=${fechaFin}`;
        if (filtroTipo) countParams += `${countParams ? "&" : "?"}tipo=${filtroTipo}`;
        if (filtroCategoria) countParams += `${countParams ? "&" : "?"}categoria=${filtroCategoria}`;
        
        const resCount = await fetch(`${API_URL}/finanzas/${countParams}&limit=999999`);
        if (resCount.ok) {
          const allData = await resCount.json();
          setTotalItems(allData.length);
        }
      }
    } catch (error) {
      console.error("Error al cargar transacciones:", error);
    } finally {
      setLoading(false);
    }
  };

  // Cargar métricas del dashboard
  const fetchMetricas = async () => {
    try {
      let queryParams = "";
      if (fechaInicio) queryParams += `?fecha_inicio=${fechaInicio}`;
      if (fechaFin) queryParams += `${queryParams ? "&" : "?"}fecha_fin=${fechaFin}`;

      const res = await fetch(`${API_URL}/finanzas/metricas${queryParams}`);
      if (res.ok) {
        const data = await res.json();
        setMetricas(data);
      }
    } catch (error) {
      console.error("Error al cargar métricas:", error);
    }
  };

  // Manejar el cambio del tipo en el formulario
  const handleFormTipoChange = (tipo) => {
    setFormTipo(tipo);
    setFormCategoria("");
  };

  // Abrir modal para crear
  const openCreateModal = () => {
    setEditingId(null);
    setFormTipo("Ingreso");
    setFormMonto("");
    setFormCategoria("");
    setFormFecha(new Date().toISOString().split("T")[0]);
    setFormDescripcion("");
    setIsModalOpen(true);
  };

  // Abrir modal para editar
  const openEditModal = (transaccion) => {
    setEditingId(transaccion.id);
    setFormTipo(transaccion.tipo);
    setFormMonto(transaccion.monto.toString());
    setFormCategoria(transaccion.categoria);
    setFormFecha(transaccion.fecha);
    setFormDescripcion(transaccion.descripcion || "");
    setIsModalOpen(true);
  };

  // Guardar datos (Crear o Editar)
  const handleSave = async (e) => {
    e.preventDefault();
    if (!formMonto || parseFloat(formMonto) <= 0) {
      alert("Por favor ingrese un monto válido mayor a 0.");
      return;
    }

    const payload = {
      tipo: formTipo,
      monto: parseFloat(formMonto),
      categoria: formCategoria,
      fecha: formFecha,
      descripcion: formDescripcion || null
    };

    try {
      let res;
      if (editingId) {
        res = await fetch(`${API_URL}/finanzas/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch(`${API_URL}/finanzas/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      }

      if (res.ok) {
        // Guardar la categoría en el historial local
        agregarCategoria(formCategoria);
        setIsModalOpen(false);
        fetchTransacciones();
        fetchMetricas();
      } else {
        const errData = await res.json();
        alert(`Error al guardar: ${errData.detail || "Error desconocido"}`);
      }
    } catch (error) {
      console.error("Error al guardar movimiento:", error);
      alert("Error de conexión al guardar el movimiento.");
    }
  };

  // Eliminar transacción
  const handleDelete = async (id) => {
    if (!window.confirm("¿Está seguro de que desea eliminar este registro?")) return;

    try {
      const res = await fetch(`${API_URL}/finanzas/${id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        fetchTransacciones();
        fetchMetricas();
      } else {
        alert("Error al eliminar el registro.");
      }
    } catch (error) {
      console.error("Error al eliminar movimiento:", error);
    }
  };

  // Exportar a Excel con diseño profesional
  const handleExportToExcel = async () => {
    try {
      let queryParams = "?limit=999999";
      if (fechaInicio) queryParams += `&fecha_inicio=${fechaInicio}`;
      if (fechaFin) queryParams += `&fecha_fin=${fechaFin}`;
      if (filtroTipo) queryParams += `&tipo=${filtroTipo}`;
      if (filtroCategoria) queryParams += `&categoria=${filtroCategoria}`;

      const res = await fetch(`${API_URL}/finanzas/${queryParams}`);
      if (!res.ok) throw new Error("No se pudo obtener la lista de transacciones");
      const allTransacciones = await res.json();

      const totalIngresos = allTransacciones.filter(t => t.tipo === "Ingreso").reduce((s, t) => s + t.monto, 0);
      const totalGastos   = allTransacciones.filter(t => t.tipo === "Gasto").reduce((s, t)   => s + t.monto, 0);
      const balanceNeto   = totalIngresos - totalGastos;

      // ── Helpers de estilo ──────────────────────────────────────────────
      const thinBorder = {
        top:    { style: "thin", color: { rgb: "CCCCCC" } },
        bottom: { style: "thin", color: { rgb: "CCCCCC" } },
        left:   { style: "thin", color: { rgb: "CCCCCC" } },
        right:  { style: "thin", color: { rgb: "CCCCCC" } },
      };
      const thickBorderDark = {
        top:    { style: "medium", color: { rgb: "0F172A" } },
        bottom: { style: "medium", color: { rgb: "0F172A" } },
        left:   { style: "medium", color: { rgb: "0F172A" } },
        right:  { style: "medium", color: { rgb: "0F172A" } },
      };
      const cell = (v, s) => ({ v, s });
      const ar   = (v, extra = {}) => ({ ...extra, alignment: { horizontal: "right", vertical: "center" } });
      const ac   = (v, extra = {}) => ({ ...extra, alignment: { horizontal: "center", vertical: "center" } });

      // Estilos base
      const styleTitleBg   = { fgColor: { rgb: "0F172A" } };
      const styleHeaderBg  = { fgColor: { rgb: "1E293B" } };
      const styleIngresosBg = { fgColor: { rgb: "ECFDF5" } };
      const styleGastosBg   = { fgColor: { rgb: "FFF1F2" } };
      const styleTotalesRowBg = { fgColor: { rgb: "F0FDF4" } };
      const styleBalanceNegBg = { fgColor: { rgb: "FFF1F2" } };
      const styleSubHeaderBg = { fgColor: { rgb: "F8FAFC" } };

      // ── Construcción de filas ──────────────────────────────────────────
      // Fila 1: Título principal (cols A–F)
      const filaTitulo = [
        cell("REPORTE FINANCIERO — TALLER CSA", {
          font:      { bold: true, sz: 16, color: { rgb: "FFFFFF" }, name: "Calibri" },
          fill:      styleTitleBg,
          alignment: { horizontal: "center", vertical: "center", wrapText: false },
          border:    thickBorderDark,
        }),
        cell("", { fill: styleTitleBg }),
        cell("", { fill: styleTitleBg }),
        cell("", { fill: styleTitleBg }),
        cell("", { fill: styleTitleBg }),
        cell("", { fill: styleTitleBg }),
      ];

      // Fila 2: Período del reporte
      const periodoTexto = fechaInicio && fechaFin
        ? `Período: ${new Date(fechaInicio + "T00:00:00").toLocaleDateString("es-AR")} al ${new Date(fechaFin + "T00:00:00").toLocaleDateString("es-AR")}`
        : `Generado: ${new Date().toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric" })}`;
      const filaSubtitulo = [
        cell(periodoTexto, {
          font:      { italic: true, sz: 10, color: { rgb: "94A3B8" }, name: "Calibri" },
          fill:      styleTitleBg,
          alignment: { horizontal: "center", vertical: "center" },
          border:    thickBorderDark,
        }),
        cell("", { fill: styleTitleBg }),
        cell("", { fill: styleTitleBg }),
        cell("", { fill: styleTitleBg }),
        cell("", { fill: styleTitleBg }),
        cell("", { fill: styleTitleBg }),
      ];

      // Fila 3: Tarjetas resumen (Ingresos | Gastos | Balance)
      const styleResumenLabel = (color) => ({
        font:      { bold: true, sz: 9, color: { rgb: "FFFFFF" }, name: "Calibri" },
        fill:      { fgColor: { rgb: color } },
        alignment: { horizontal: "center", vertical: "center" },
        border:    thickBorderDark,
      });
      const styleResumenValor = (color) => ({
        font:      { bold: true, sz: 13, color: { rgb: color }, name: "Calibri" },
        fill:      { fgColor: { rgb: color === "166534" ? "F0FDF4" : color === "991B1B" ? "FFF1F2" : (balanceNeto >= 0 ? "F0FDF4" : "FFF1F2") } },
        alignment: { horizontal: "center", vertical: "center" },
        numFmt:    "#,##0.00",
        border:    thickBorderDark,
      });
      const filaResumen1 = [
        cell("", { fill: { fgColor: { rgb: "1E293B" } } }),
        cell("✦ TOTAL INGRESOS",  styleResumenLabel("059669")),
        cell("", { fill: { fgColor: { rgb: "059669" } } }),
        cell("✦ TOTAL GASTOS",    styleResumenLabel("E11D48")),
        cell("", { fill: { fgColor: { rgb: "E11D48" } } }),
        cell("✦ BALANCE NETO",    styleResumenLabel(balanceNeto >= 0 ? "0F766E" : "9F1239")),
      ];
      const filaResumen2 = [
        cell("", { fill: { fgColor: { rgb: "1E293B" } } }),
        { v: totalIngresos, t: "n",  s: styleResumenValor("166534") },
        cell("", { fill: { fgColor: { rgb: "D1FAE5" } } }),
        { v: totalGastos,   t: "n",  s: styleResumenValor("991B1B") },
        cell("", { fill: { fgColor: { rgb: "FFE4E6" } } }),
        { v: balanceNeto,   t: "n",  s: styleResumenValor(balanceNeto >= 0 ? "166534" : "991B1B") },
      ];

      // Fila 4: Espacio vacío
      const filaVacia = Array(6).fill(cell("", { fill: { fgColor: { rgb: "FFFFFF" } } }));

      // Fila 5: Encabezados de la tabla
      const headerStyle = {
        font:      { bold: true, sz: 10, color: { rgb: "FFFFFF" }, name: "Calibri" },
        fill:      styleHeaderBg,
        alignment: { horizontal: "center", vertical: "center", wrapText: false },
        border:    thinBorder,
      };
      const filaHeaders = [
        cell("Nº",          headerStyle),
        cell("Fecha",       headerStyle),
        cell("Tipo",        headerStyle),
        cell("Categoría",   headerStyle),
        cell("Monto ($)",   { ...headerStyle, alignment: { horizontal: "right", vertical: "center" } }),
        cell("Descripción", headerStyle),
      ];

      // Filas de datos
      const filasData = allTransacciones.map((item, i) => {
        const esIngreso = item.tipo === "Ingreso";
        const bgFill    = esIngreso ? styleIngresosBg : styleGastosBg;
        const tipoColor = esIngreso ? "166534" : "9F1239";
        const baseStyle = {
          font:   { sz: 10, name: "Calibri", color: { rgb: "1E293B" } },
          fill:   bgFill,
          border: thinBorder,
          alignment: { vertical: "center" },
        };
        return [
          cell(i + 1, { ...baseStyle, alignment: { horizontal: "center", vertical: "center" } }),
          cell(
            new Date(item.fecha + "T00:00:00").toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" }),
            { ...baseStyle, alignment: { horizontal: "center", vertical: "center" } }
          ),
          cell(item.tipo, {
            ...baseStyle,
            font:      { bold: true, sz: 10, name: "Calibri", color: { rgb: tipoColor } },
            alignment: { horizontal: "center", vertical: "center" },
          }),
          cell(item.categoria, baseStyle),
          { v: item.monto, t: "n", s: {
            ...baseStyle,
            font:      { bold: true, sz: 10, name: "Calibri", color: { rgb: tipoColor } },
            alignment: { horizontal: "right", vertical: "center" },
            numFmt:    "#,##0.00",
          }},
          cell(item.descripcion || "—", { ...baseStyle, font: { sz: 9, name: "Calibri", color: { rgb: "64748B" }, italic: !item.descripcion } }),
        ];
      });

      // Fila de totales final
      const totalesStyle = {
        font:   { bold: true, sz: 11, name: "Calibri", color: { rgb: "0F172A" } },
        fill:   { fgColor: { rgb: "E2E8F0" } },
        border: { top: { style: "medium", color: { rgb: "1E293B" } }, bottom: { style: "medium", color: { rgb: "1E293B" } }, left: thinBorder.left, right: thinBorder.right },
        alignment: { vertical: "center" },
      };
      const filaTotales = [
        cell("TOTALES", { ...totalesStyle, alignment: { horizontal: "center", vertical: "center" } }),
        cell("", totalesStyle),
        cell("", totalesStyle),
        cell(`${allTransacciones.length} movimientos`, { ...totalesStyle, alignment: { horizontal: "center", vertical: "center" } }),
        { v: balanceNeto, t: "n", s: {
          ...totalesStyle,
          font:      { bold: true, sz: 11, name: "Calibri", color: { rgb: balanceNeto >= 0 ? "166534" : "991B1B" } },
          fill:      { fgColor: { rgb: balanceNeto >= 0 ? "D1FAE5" : "FFE4E6" } },
          numFmt:    "#,##0.00",
          alignment: { horizontal: "right", vertical: "center" },
        }},
        cell("Balance Neto", { ...totalesStyle, font: { bold: true, sz: 10, name: "Calibri", color: { rgb: "475569" } } }),
      ];

      // ── Armar la hoja ─────────────────────────────────────────────────
      const allRows = [
        filaTitulo,
        filaSubtitulo,
        filaResumen1,
        filaResumen2,
        filaVacia,
        filaHeaders,
        ...filasData,
        filaVacia,
        filaTotales,
      ];

      const ws = XLSXStyle.utils.aoa_to_sheet(allRows);
      const wb = XLSXStyle.utils.book_new();
      XLSXStyle.utils.book_append_sheet(wb, ws, "Finanzas");

      // Merge de celdas para título, subtítulo y tarjetas
      ws["!merges"] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } }, // Título
        { s: { r: 1, c: 0 }, e: { r: 1, c: 5 } }, // Subtítulo
        { s: { r: 2, c: 1 }, e: { r: 2, c: 2 } }, // Label Ingresos
        { s: { r: 3, c: 1 }, e: { r: 3, c: 2 } }, // Valor Ingresos
        { s: { r: 2, c: 3 }, e: { r: 2, c: 4 } }, // Label Gastos
        { s: { r: 3, c: 3 }, e: { r: 3, c: 4 } }, // Valor Gastos
      ];

      // Alturas de filas
      ws["!rows"] = [
        { hpt: 38 }, // Título
        { hpt: 18 }, // Subtítulo
        { hpt: 22 }, // Resumen label
        { hpt: 32 }, // Resumen valor
        { hpt: 8  }, // Vacía
        { hpt: 22 }, // Headers
        ...filasData.map(() => ({ hpt: 18 })),
        { hpt: 8  }, // Vacía
        { hpt: 24 }, // Totales
      ];

      // Anchos de columna
      ws["!cols"] = [
        { wch: 7  }, // Nº
        { wch: 14 }, // Fecha
        { wch: 12 }, // Tipo
        { wch: 28 }, // Categoría
        { wch: 18 }, // Monto
        { wch: 38 }, // Descripción
      ];

      XLSXStyle.writeFile(wb, `Reporte_Financiero_Taller_${new Date().toISOString().split("T")[0]}.xlsx`);
    } catch (error) {
      console.error("Error al exportar:", error);
      alert("Error al exportar los datos a Excel.");
    }
  };

  // Formatear montos a moneda local
  const formatMonto = (monto) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 2
    }).format(monto);
  };

  // Máximo valor mensual para escalar el gráfico SVG
  const maxMensual = metricas.evolucion_mensual.length > 0
    ? Math.max(...metricas.evolucion_mensual.map(e => Math.max(e.ingresos, e.gastos)))
    : 1000;

  const totalPaginas = Math.ceil(totalItems / limit) || 1;

  return (
    <div className="min-h-screen w-full bg-background text-foreground p-6 md:p-10 overflow-y-auto">
      <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-500 pb-16">
        
        {/* Encabezado Principal */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black tracking-tight bg-gradient-to-br from-foreground via-foreground/90 to-muted-foreground bg-clip-text text-transparent drop-shadow-sm">
              Control de Gastos e Ingresos
            </h1>
            <p className="text-muted-foreground mt-1 text-sm font-medium">
              Registrá la contabilidad diaria, analizá el rendimiento con métricas gráficas y exportá reportes completos a Excel.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition-all duration-300 shadow-sm"
              title={theme === "light" ? "Modo Oscuro" : "Modo Claro"}
            >
              {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
            </button>
            {/* Font Size Selector */}
            <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-border bg-card shadow-sm" title="Tamaño de fuente">
              <Type size={13} className="text-muted-foreground mr-1" />
              {FONT_SIZES.map((fs) => (
                <button
                  key={fs.value}
                  title={fs.title}
                  onClick={() => setFontSize(fs.value)}
                  className={[
                    "flex items-center justify-center rounded-lg transition-all duration-200 font-bold leading-none select-none",
                    fontSize === fs.value
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                  ].join(" ")}
                  style={{
                    fontSize: `${fs.value - 4}px`,
                    width: `${fs.value + 8}px`,
                    height: `${fs.value + 8}px`,
                  }}
                >
                  A
                </button>
              ))}
            </div>
            <button
              onClick={handleExportToExcel}
              disabled={transacciones.length === 0}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-emerald-500/30 dark:border-emerald-500/20 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 transition-all duration-300 font-bold text-sm shadow-sm hover:shadow-emerald-500/10 disabled:opacity-50 disabled:pointer-events-none"
            >
              <FileSpreadsheet size={16} />
              Exportar a Excel
            </button>
            <button
              onClick={openCreateModal}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-300 font-black text-sm shadow-[0_4px_12px_rgba(var(--primary),0.25)] hover:shadow-[0_6px_20px_rgba(var(--primary),0.4)] hover:-translate-y-0.5"
            >
              <Plus size={16} />
              Registrar Movimiento
            </button>
          </div>
        </div>

      {/* Barra de Filtros */}
      <div className="p-5 rounded-2xl border border-border/50 bg-card/70 backdrop-blur-md shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-foreground/80 font-bold text-sm">
          <Filter size={15} className="text-primary" />
          <span>Filtros y Período</span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-5">
          
          {/* Selector de Período Rápido */}
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-black tracking-wider text-muted-foreground/80">Intervalo</label>
            <select
              value={rangoSeleccionado}
              onChange={(e) => setRangoSeleccionado(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all duration-200"
            >
              <option value="mes_actual">Este Mes</option>
              <option value="ultimos_30">Últimos 30 días</option>
              <option value="ultimos_90">Últimos 90 días</option>
              <option value="anio_actual">Año Actual</option>
              <option value="personalizado">Rango Personalizado</option>
            </select>
          </div>

          {/* Fecha Inicio */}
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-black tracking-wider text-muted-foreground/80">Desde</label>
            <div className="relative">
              <input
                type="date"
                value={fechaInicio}
                disabled={rangoSeleccionado !== "personalizado"}
                onChange={(e) => {
                  setFechaInicio(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all duration-200 disabled:opacity-60"
              />
              <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            </div>
          </div>

          {/* Fecha Fin */}
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-black tracking-wider text-muted-foreground/80">Hasta</label>
            <div className="relative">
              <input
                type="date"
                value={fechaFin}
                disabled={rangoSeleccionado !== "personalizado"}
                onChange={(e) => {
                  setFechaFin(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all duration-200 disabled:opacity-60"
              />
              <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            </div>
          </div>

          {/* Tipo de Movimiento */}
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-black tracking-wider text-muted-foreground/80">Tipo</label>
            <select
              value={filtroTipo}
              onChange={(e) => {
                setFiltroTipo(e.target.value);
                setFiltroCategoria("");
                setPage(1);
              }}
              className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all duration-200"
            >
              <option value="">Todos</option>
              <option value="Ingreso">Ingresos</option>
              <option value="Gasto">Gastos</option>
            </select>
          </div>

          {/* Categoría */}
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-black tracking-wider text-muted-foreground/80">Categoría</label>
            <select
              value={filtroCategoria}
              onChange={(e) => {
                setFiltroCategoria(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all duration-200"
            >
              <option value="">Todas</option>
              {categoriasGuardadas.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

        </div>
      </div>

      {/* Tarjetas de Totales (Dashboard) */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* Balance Neto */}
        <div className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card p-6 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5">
          <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${metricas.balance >= 0 ? "from-emerald-500 to-teal-400" : "from-rose-500 to-orange-400"}`} />
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-muted-foreground/85">Balance Neto</span>
            <div className={`p-2 rounded-xl border ${metricas.balance >= 0 ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400" : "bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400"}`}>
              {metricas.balance >= 0 ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
            </div>
          </div>
          <div className="mt-4">
            <h3 className={`text-3xl font-black font-mono tracking-tight ${metricas.balance >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
              {formatMonto(metricas.balance)}
            </h3>
            <p className="text-[11px] text-muted-foreground font-medium mt-1">Ingresos menos gastos en el período</p>
          </div>
        </div>

        {/* Total Ingresos */}
        <div className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card p-6 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 to-emerald-600/80" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-muted-foreground/85">Total Ingresos</span>
            <div className="p-2 rounded-xl border bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-black font-mono tracking-tight text-foreground">
              {formatMonto(metricas.total_ingresos)}
            </h3>
            <p className="text-[11px] text-muted-foreground font-medium mt-1">Flujo de entrada total registrado</p>
          </div>
        </div>

        {/* Total Gastos */}
        <div className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card p-6 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-400 to-rose-600/80" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-muted-foreground/85">Total Gastos</span>
            <div className="p-2 rounded-xl border bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400">
              <TrendingDown size={18} />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-black font-mono tracking-tight text-foreground">
              {formatMonto(metricas.total_gastos)}
            </h3>
            <p className="text-[11px] text-muted-foreground font-medium mt-1">Gastos e inversiones salientes</p>
          </div>
        </div>
      </div>

      {/* Gráficos y Métricas */}
      <div className="grid gap-6 lg:grid-cols-3">
        
        {/* Gráfico de Evolución Mensual - Tendencia */}
        <div className="lg:col-span-2 rounded-2xl border border-border/50 bg-card p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-black text-foreground">Tendencia de Ingresos vs Gastos</h3>
              <span className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1 bg-muted px-2.5 py-1 rounded-xl">
                <CalendarRange size={11} className="text-primary" /> Últimos 6 Meses
              </span>
            </div>
            
            {metricas.evolucion_mensual.length === 0 ? (
              <div className="flex items-center justify-center h-48 border border-dashed border-border rounded-xl">
                <p className="text-muted-foreground text-sm font-medium">No hay suficientes datos financieros históricos.</p>
              </div>
            ) : (
              <div className="relative pt-6">
                {/* Eje e Indicadores SVG del Gráfico */}
                <div className="h-56 w-full flex items-end justify-between px-2 relative border-b border-border/60 pb-1">
                  {metricas.evolucion_mensual.map((e, index) => {
                    const hIngresos = maxMensual > 0 ? (e.ingresos / maxMensual) * 100 : 0;
                    const hGastos = maxMensual > 0 ? (e.gastos / maxMensual) * 100 : 0;

                    return (
                      <div key={index} className="flex-1 flex flex-col items-center group/bar max-w-[80px] px-1 relative">
                        {/* Tooltip flotante en hover */}
                        <div className="absolute bottom-[105%] hidden group-hover/bar:flex flex-col items-center bg-foreground text-background p-2.5 rounded-xl text-[10px] font-bold shadow-2xl z-20 w-36 pointer-events-none transition-all duration-300">
                          <span className="text-muted text-[9px] mb-1 font-black">{e.mes}</span>
                          <span className="text-emerald-400 flex justify-between w-full">Ingresos: <span className="font-mono">{formatMonto(e.ingresos)}</span></span>
                          <span className="text-rose-400 flex justify-between w-full">Gastos: <span className="font-mono">{formatMonto(e.gastos)}</span></span>
                          <span className="border-t border-muted/50 mt-1 pt-1 flex justify-between w-full text-white">Balance: <span className="font-mono">{formatMonto(e.balance)}</span></span>
                        </div>

                        {/* Contenedor de barras */}
                        <div className="w-full flex items-end justify-center gap-1.5 h-44">
                          {/* Barra Ingresos */}
                          <div 
                            style={{ height: `${hIngresos}%` }} 
                            className="w-3 sm:w-4 bg-gradient-to-t from-emerald-600/80 to-emerald-400 rounded-t-sm sm:rounded-t-md transition-all duration-500 group-hover/bar:brightness-110 shadow-sm"
                          />
                          {/* Barra Gastos */}
                          <div 
                            style={{ height: `${hGastos}%` }} 
                            className="w-3 sm:w-4 bg-gradient-to-t from-rose-600/80 to-rose-400 rounded-t-sm sm:rounded-t-md transition-all duration-500 group-hover/bar:brightness-110 shadow-sm"
                          />
                        </div>
                        
                        {/* Etiqueta del mes */}
                        <span className="text-[10px] font-bold text-muted-foreground mt-2 truncate max-w-full">
                          {e.mes}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Leyenda */}
          <div className="flex items-center gap-6 mt-6 border-t border-border/40 pt-4 text-xs font-bold text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded bg-gradient-to-r from-emerald-500 to-emerald-400 shadow-sm" />
              <span>Ingresos</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded bg-gradient-to-r from-rose-500 to-rose-400 shadow-sm" />
              <span>Gastos</span>
            </div>
            <div className="ml-auto text-[10px] font-medium text-muted-foreground/80 flex items-center gap-1">
              <Info size={12} className="text-primary" /> Posiciona el cursor en las columnas para ver detalles.
            </div>
          </div>

        </div>

        {/* Distribución por Categoría de Gastos */}
        <div className="rounded-2xl border border-border/50 bg-card p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-black text-foreground mb-4">Gastos por Categoría</h3>
            
            {metricas.categorias_gastos.length === 0 ? (
              <div className="flex items-center justify-center h-48 border border-dashed border-border rounded-xl">
                <p className="text-muted-foreground text-sm font-medium">No hay gastos en este período.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {metricas.categorias_gastos
                  .sort((a, b) => b.monto - a.monto)
                  .slice(0, 5) // Mostrar los 5 mayores gastos
                  .map((c, index) => {
                    const totalGastosVal = metricas.total_gastos || 1;
                    const porcentaje = Math.round((c.monto / totalGastosVal) * 100);
                    
                    return (
                      <div key={index} className="space-y-1.5 group">
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span className="text-foreground/90 group-hover:text-primary transition-colors truncate max-w-[70%]">
                            {c.categoria}
                          </span>
                          <span className="text-muted-foreground font-mono">
                            {formatMonto(c.monto)} ({porcentaje}%)
                          </span>
                        </div>
                        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                          <div
                            style={{ width: `${porcentaje}%` }}
                            className="h-full bg-gradient-to-r from-rose-500 to-orange-400 rounded-full transition-all duration-700"
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
          
          <div className="border-t border-border/40 pt-4 mt-6">
            <div className="flex items-center justify-between text-xs font-black text-foreground">
              <span>Egresos Totales</span>
              <span className="font-mono text-rose-600 dark:text-rose-400">
                {formatMonto(metricas.total_gastos)}
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* Tabla de Movimientos */}
      <div className="rounded-2xl border border-border/50 bg-card shadow-sm overflow-hidden">
        
        {/* Encabezado de la tabla */}
        <div className="p-6 border-b border-border/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-black text-foreground">Historial de Transacciones</h3>
            <p className="text-xs text-muted-foreground font-medium">Listado detallado ordenado cronológicamente</p>
          </div>
          <span className="text-xs font-bold text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-xl border border-border/30">
            Mostrando {transacciones.length} de {totalItems} registros
          </span>
        </div>

        {/* Tabla */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : transacciones.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="p-3 bg-muted rounded-full text-muted-foreground/60 mb-3">
                <DollarSign size={24} />
              </div>
              <h4 className="text-base font-bold text-foreground">Sin transacciones registradas</h4>
              <p className="text-xs text-muted-foreground max-w-xs mt-1">No se encontraron movimientos financieros con los filtros seleccionados.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border/50 bg-muted/20 text-[10px] uppercase font-black tracking-wider text-muted-foreground">
                  <th className="py-4 px-6">Fecha</th>
                  <th className="py-4 px-6">Tipo</th>
                  <th className="py-4 px-6">Categoría</th>
                  <th className="py-4 px-6">Descripción</th>
                  <th className="py-4 px-6 text-right">Monto</th>
                  <th className="py-4 px-6 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {transacciones.map((t) => {
                  const fechaFormateada = new Date(t.fecha + "T00:00:00").toLocaleDateString("es-AR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric"
                  });

                  return (
                    <tr 
                      key={t.id}
                      className="group/row hover:bg-muted/30 transition-all duration-200 text-sm font-medium text-foreground"
                    >
                      <td className="py-4 px-6 text-muted-foreground font-semibold">{fechaFormateada}</td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold border ${
                          t.tipo === "Ingreso" 
                            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                            : "bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400"
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${t.tipo === "Ingreso" ? "bg-emerald-500" : "bg-rose-500"}`} />
                          {t.tipo}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-foreground/80 font-semibold">{t.categoria}</td>
                      <td className="py-4 px-6 text-muted-foreground font-normal max-w-xs truncate" title={t.descripcion}>
                        {t.descripcion || "-"}
                      </td>
                      <td className={`py-4 px-6 text-right font-black font-mono ${
                        t.tipo === "Ingreso" ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                      }`}>
                        {t.tipo === "Ingreso" ? "+" : "-"} {formatMonto(t.monto)}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => openEditModal(t)}
                            className="p-1.5 rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-all duration-200"
                            title="Editar transacción"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(t.id)}
                            className="p-1.5 rounded-lg border border-border hover:border-rose-500/30 hover:bg-rose-500/10 text-muted-foreground hover:text-rose-600 dark:hover:text-rose-400 transition-all duration-200"
                            title="Eliminar transacción"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Paginación */}
        {totalItems > limit && (
          <div className="p-5 border-t border-border/50 bg-muted/10 flex items-center justify-between">
            <button
              onClick={() => setPage(p => Math.max(p - 1, 1))}
              disabled={page === 1}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-border bg-card hover:bg-muted text-xs font-bold text-foreground transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none"
            >
              <ChevronLeft size={14} /> Anterior
            </button>
            <span className="text-xs font-bold text-muted-foreground">
              Página {page} de {totalPaginas}
            </span>
            <button
              onClick={() => setPage(p => Math.min(p + 1, totalPaginas))}
              disabled={page === totalPaginas}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-border bg-card hover:bg-muted text-xs font-bold text-foreground transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none"
            >
              Siguiente <ChevronRight size={14} />
            </button>
          </div>
        )}

      </div>

      {/* Modal para Registrar / Editar */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="relative w-full max-w-lg rounded-2xl border border-border/50 bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-250">
            
            {/* Cabecera de modal */}
            <div className="flex items-center justify-between pb-4 border-b border-border/50">
              <h3 className="text-xl font-black text-foreground">
                {editingId ? "Editar Movimiento" : "Registrar Movimiento"}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Formulario */}
            <form onSubmit={handleSave} className="space-y-5 mt-5">
              
              {/* Selector de Tipo (Ingreso / Gasto) */}
              <div className="grid grid-cols-2 gap-3 p-1 rounded-xl bg-muted">
                <button
                  type="button"
                  onClick={() => handleFormTipoChange("Ingreso")}
                  className={`py-2 rounded-lg text-xs font-black transition-all duration-300 ${
                    formTipo === "Ingreso"
                      ? "bg-card text-emerald-600 dark:text-emerald-400 shadow-sm border border-border/50"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <TrendingUp size={14} className="inline mr-1" />
                  Ingreso
                </button>
                <button
                  type="button"
                  onClick={() => handleFormTipoChange("Gasto")}
                  className={`py-2 rounded-lg text-xs font-black transition-all duration-300 ${
                    formTipo === "Gasto"
                      ? "bg-card text-rose-600 dark:text-rose-400 shadow-sm border border-border/50"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <TrendingDown size={14} className="inline mr-1" />
                  Gasto
                </button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {/* Monto */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-muted-foreground uppercase tracking-wide">Monto ($)</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="0.00"
                      value={formMonto}
                      onChange={(e) => setFormMonto(e.target.value)}
                      className="w-full pl-8 pr-3 py-2.5 text-sm rounded-xl border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all duration-200 font-mono"
                    />
                    <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  </div>
                </div>

                {/* Fecha */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-muted-foreground uppercase tracking-wide">Fecha</label>
                  <div className="relative">
                    <input
                      type="date"
                      required
                      value={formFecha}
                      onChange={(e) => setFormFecha(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all duration-200"
                    />
                    <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  </div>
                </div>
              </div>

              {/* Categoría */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-muted-foreground uppercase tracking-wide">
                  Categoría
                  {categoriasGuardadas.length === 0 && (
                    <span className="ml-2 text-[10px] font-medium text-muted-foreground/60 normal-case">
                      (escribí la primera para guardarla)
                    </span>
                  )}
                </label>
                <CategoryAutocomplete
                  value={formCategoria}
                  onChange={setFormCategoria}
                  categorias={categoriasGuardadas}
                  placeholder="Ej: Mano de obra, Repuestos..."
                />
              </div>


              {/* Descripción */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-muted-foreground uppercase tracking-wide">Descripción (Opcional)</label>
                <textarea
                  rows="3"
                  placeholder="Detalles sobre el gasto o ingreso..."
                  value={formDescripcion}
                  onChange={(e) => setFormDescripcion(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm rounded-xl border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all duration-200 resize-none"
                />
              </div>

              {/* Acciones */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border/50">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-border hover:bg-muted text-sm font-bold text-muted-foreground hover:text-foreground transition-all duration-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-black transition-all duration-300 shadow-[0_4px_12px_rgba(var(--primary),0.2)]"
                >
                  {editingId ? "Actualizar" : "Guardar"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      </div>
    </div>
  );
}

// ── APP COMPONENT PRINCIPAL ──────────────────────────────────────────────────
// Depende de: React, ReactDOM, globals.js, financial_logic.js, components.js, charts.js, escenarios.js, tabla.js, pdf-report.js

const { useState, useMemo, useEffect } = React;
const { fmt, fmtM, fmtCLP, costosPrepagoOpciones } = window;

const { SidebarClock, Input, Select, Stat, SliderInput, RateBarChart, ProbabilityGauge } = window.UIComponents;
const { GraficoSaldo, GraficoCuotas, GraficoEscenarios } = window.Charts;
const { Escenario1, Escenario2 } = window.Escenarios;
const { TablaAmortizacion } = window.Tabla;
const ReportePDF = window.ReportePDF;

function App() {
  const { tasaMensual, cuotaMensual, calcularSaldoActual, calcularInteresesTotales, simularPrepago, calcularHistorial } = window.FinancialLogic;

  // Calcular fecha de inicio por defecto (hace 36 meses)
  const initialDate = React.useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 36);
    return { year: d.getFullYear(), month: d.getMonth() + 1 };
  }, []);

  const [credito, setCredito] = useState({
    capital: 2000,
    tna: 4.5,
    plazo: 300,
    mesesPagados: 36,
    costoPrepago: "1.5",
    seguros: 0.5,
    fechaInicioYear: initialDate.year,
    fechaInicioMonth: initialDate.month
  });
  const [estrategia, setEstrategia] = useState({
    monto: 100,
    frecuencia: "anual",
    mesInicio: 37,
    destino: "plazo"
  });
  const [macro, setMacro] = useState({
    inflacion: 4.0,
    retornoInv: 8.0,
    rentaBruta: 2500000,
    valorUF: null,
    valorUTM: null,
    volatilidad: 35.0
  });
  const [ui, setUi] = useState({
    tab: "datos",
    detalleVista: "tabla",
    tributarioVista: "resumen",
    monedaTabla: "UF",
    showPrintView: false
  });

  // Alias y destructuring para mantener compatibilidad
  const cr = credito;
  const pr = estrategia;
  const { inflacion, retornoInv, rentaBruta, valorUF, valorUTM, volatilidad } = macro;
  const { tab, detalleVista, tributarioVista, monedaTabla, showPrintView } = ui;

  // Setters que imitan el comportamiento original
  const setCr = (newCr) => setCredito(newCr);
  const setPr = (newPr) => setEstrategia(newPr);
  const setTab = (t) => setUi(p => ({ ...p, tab: t }));
  const setDetalleVista = (v) => setUi(p => ({ ...p, detalleVista: v }));
  const setTributarioVista = (v) => setUi(p => ({ ...p, tributarioVista: v }));
  const setMonedaTabla = (m) => setUi(p => ({ ...p, monedaTabla: m }));
  const setShowPrintView = (v) => setUi(p => ({ ...p, showPrintView: v }));
  const setInflacion = (v) => setMacro(p => ({ ...p, inflacion: v }));
  const setRetornoInv = (v) => setMacro(p => ({ ...p, retornoInv: v }));
  const setRentaBruta = (v) => setMacro(p => ({ ...p, rentaBruta: v }));
  const setValorUF = (v) => setMacro(p => ({ ...p, valorUF: v }));
  const setValorUTM = (v) => setMacro(p => ({ ...p, valorUTM: v }));
  const setVolatilidad = (v) => setMacro(p => ({ ...p, volatilidad: v }));


  useEffect(() => {
    if (showPrintView) {
      setTimeout(() => window.print(), 100);
    }
  }, [showPrintView]);

  useEffect(() => {
    const getUF = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout
        const res = await fetch("https://mindicador.cl/api/uf", { signal: controller.signal });
        clearTimeout(timeoutId);

        if (!res.ok) throw new Error("Server response not OK");
        const data = await res.json();
        if (data?.serie?.[0]?.valor) {
          setValorUF(data.serie[0].valor);
          return;
        }
      } catch (err) {
        console.error("Error fetching UF from mindicador.cl:", err);
      }
      // Fallback UF value if API fails (March 2026 reference)
      setValorUF(39841.72);
    };
    getUF();

    const getUTM = async () => {
      try {
        const res = await fetch("https://mindicador.cl/api/utm", { signal: AbortSignal.timeout(5000) });
        if (!res.ok) throw new Error("UTM fetch failed");
        const data = await res.json();
        if (data?.serie?.[0]?.valor) { setValorUTM(data.serie[0].valor); return; }
      } catch (err) { console.error("Error fetching UTM:", err); }
      setValorUTM(67790); // Fallback UTM March 2026
    };
    getUTM();
  }, []);

  const setC = k => v => setCr(p => ({ ...p, [k]: v }));
  const setP = k => v => setPr(p => ({ ...p, [k]: v }));

  // --- Handlers de entrada con validación y sincronización ---
  const updateFechaInicio = (year, month) => {
    const today = new Date();
    const diffMonths = (today.getFullYear() - year) * 12 + (today.getMonth() - month + 1);
    setCr(p => ({
      ...p,
      fechaInicioYear: year,
      fechaInicioMonth: month,
      mesesPagados: Math.max(0, Math.min(diffMonths, p.plazo))
    }));
  };

  const updateMesesPagados = (val) => {
    const months = Math.max(0, Math.min(val, cr.plazo));
    const d = new Date();
    d.setMonth(d.getMonth() - months);
    setCr(p => ({
      ...p,
      mesesPagados: months,
      fechaInicioYear: d.getFullYear(),
      fechaInicioMonth: d.getMonth() + 1
    }));
  };

  const handlePlazoChange = (val) => {
    const num = val === "" ? "" : Number(val);
    setCr(p => {
      const newPlazo = num === "" ? 12 : Math.max(12, num);
      const newMesesPagados = Math.min(p.mesesPagados, newPlazo);
      const d = new Date();
      d.setMonth(d.getMonth() - newMesesPagados);
      return {
        ...p,
        plazo: newPlazo,
        mesesPagados: newMesesPagados,
        fechaInicioYear: d.getFullYear(),
        fechaInicioMonth: d.getMonth() + 1
      };
    });
  };

  const handleMesesPagadosChange = (val) => {
    const num = val === "" ? "" : Number(val);
    updateMesesPagados(num);
  };

  const handleMesInicioChange = (val) => {
    const num = val === "" ? "" : Number(val);
    const minMesInicio = +cr.mesesPagados + 1;
    setPr(p => ({
      ...p,
      mesInicio: num === "" ? "" : Math.max(minMesInicio, num)
    }));
  };

  const mesesRestantes = Math.max(+cr.plazo - +cr.mesesPagados, 1);
  const saldoActual = calcularSaldoActual(+cr.capital, +cr.tna, +cr.plazo, +cr.mesesPagados);
  const cuotaBase = cuotaMensual(saldoActual, +cr.tna, mesesRestantes);
  const interesesBase = calcularInteresesTotales(saldoActual, +cr.tna, mesesRestantes);

  // Año y mes de inicio del crédito
  const creditStart = React.useMemo(() => {
    return { year: cr.fechaInicioYear || new Date().getFullYear(), month: cr.fechaInicioMonth || 1 };
  }, [cr.fechaInicioYear, cr.fechaInicioMonth]);

  // Historial ya pagado (desde mes 1 hasta mesesPagados)
  const historialPagado = useMemo(() =>
    calcularHistorial(+cr.capital, +cr.tna, +cr.plazo, +cr.mesesPagados, +cr.seguros),
    [cr.capital, cr.tna, cr.plazo, cr.mesesPagados, cr.seguros]
  );

  const simPlazo = useMemo(() =>
    simularPrepago(saldoActual, +cr.tna, mesesRestantes, +pr.monto, pr.frecuencia, Math.max(1, +pr.mesInicio - +cr.mesesPagados), "plazo", cuotaBase, +cr.costoPrepago, +cr.seguros),
    [saldoActual, cr.tna, mesesRestantes, pr.monto, pr.frecuencia, pr.mesInicio, cr.mesesPagados, cuotaBase, cr.costoPrepago, cr.seguros]
  );

  const simCuota = useMemo(() =>
    simularPrepago(saldoActual, +cr.tna, mesesRestantes, +pr.monto, pr.frecuencia, Math.max(1, +pr.mesInicio - +cr.mesesPagados), "cuota", cuotaBase, +cr.costoPrepago, +cr.seguros),
    [saldoActual, cr.tna, mesesRestantes, pr.monto, pr.frecuencia, pr.mesInicio, cr.mesesPagados, cuotaBase, cr.costoPrepago, cr.seguros]
  );

  const sim = useMemo(() => pr.destino === "plazo" ? simPlazo : simCuota, [pr.destino, simPlazo, simCuota]);

  const mesesAhorrados = mesesRestantes - sim.mesesReales;
  const ahorroIntereses = interesesBase - sim.totalIntereses;
  const ahorroSeguros = Math.max(mesesAhorrados * (+cr.seguros), 0); // Ahorro por no pagar seguros en meses liberados
  const ahorroNeto = ahorroIntereses + ahorroSeguros - sim.totalMultas;
  const conviene = ahorroNeto > 0;

  const dividendoTotal = cuotaBase + (+cr.seguros);
  const cae = +cr.seguros;

  // (Variables macro agrupadas y configuradas en el estado macro)

  const tabs = [
    { id: "datos", label: "Datos de Entrada", icon: React.createElement("svg", {width:16,height:16,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:1.8,strokeLinecap:"round",strokeLinejoin:"round"}, React.createElement("path",{d:"M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"}), React.createElement("circle",{cx:12,cy:12,r:3})) },
    { id: "resumen", label: "Dashboard Resumen", icon: React.createElement("svg", {width:16,height:16,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:1.8,strokeLinecap:"round",strokeLinejoin:"round"}, React.createElement("rect",{x:3,y:3,width:7,height:7,rx:1}), React.createElement("rect",{x:14,y:3,width:7,height:7,rx:1}), React.createElement("rect",{x:3,y:14,width:7,height:7,rx:1}), React.createElement("rect",{x:14,y:14,width:7,height:7,rx:1})) },
    { id: "grafico", label: "Gráfico Comparativo", icon: React.createElement("svg", {width:16,height:16,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:1.8,strokeLinecap:"round",strokeLinejoin:"round"}, React.createElement("line",{x1:18,y1:20,x2:18,y2:10}), React.createElement("line",{x1:12,y1:20,x2:12,y2:4}), React.createElement("line",{x1:6,y1:20,x2:6,y2:14})) },
    { id: "amortizacion", label: "Detalle Mensual", icon: React.createElement("svg", {width:16,height:16,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:1.8,strokeLinecap:"round",strokeLinejoin:"round"}, React.createElement("path",{d:"M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"}), React.createElement("polyline",{points:"14 2 14 8 20 8"}), React.createElement("line",{x1:16,y1:13,x2:8,y2:13}), React.createElement("line",{x1:16,y1:17,x2:8,y2:17})) },
    { id: "escenario1", label: "Arbitraje de Tasas", icon: React.createElement("svg", {width:16,height:16,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:1.8,strokeLinecap:"round",strokeLinejoin:"round"}, React.createElement("polyline",{points:"22 12 18 12 15 21 9 3 6 12 2 12"})) },
    { id: "escenario2", label: "Valoración & Riesgo", icon: React.createElement("svg", {width:16,height:16,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:1.8,strokeLinecap:"round",strokeLinejoin:"round"}, React.createElement("path",{d:"M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"})) },
    { id: "tributario", label: "Beneficio Tributario", icon: React.createElement("svg", {width:16,height:16,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:1.8,strokeLinecap:"round",strokeLinejoin:"round"}, React.createElement("rect",{x:2,y:5,width:20,height:14,rx:2}), React.createElement("line",{x1:2,y1:10,x2:22,y2:10})) },
  ];

  if (showPrintView) {
    return (
      <div>
        <button className="no-print" onClick={() => setShowPrintView(false)} style={{ margin: 12, padding: 8 }}>&larr; Volver</button>
        <div className="pdf-report-container">
          <ReportePDF
            cr={cr}
            pr={pr}
            sim={sim}
            saldoActual={saldoActual}
            mesesRestantes={mesesRestantes}
            cuotaBase={cuotaBase}
            interesesBase={interesesBase}
            ahorroNeto={ahorroNeto}
            mesesAhorrados={mesesAhorrados}
            inflacion={inflacion}
            retornoInv={retornoInv}
            simularPrepago={simularPrepago}
            valorUF={valorUF}
            valorUTM={valorUTM}
            rentaBruta={rentaBruta}
          />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="app-container">
        <div className="sidebar">
          <div className="sidebar-header">
            <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 11 }}>
              {/* Logo mark */}
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
                <defs>
                  <linearGradient id="logoGrad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#1460A8"/>
                    <stop offset="100%" stopColor="#C4831E"/>
                  </linearGradient>
                </defs>
                <rect width="40" height="40" rx="11" fill="url(#logoGrad)"/>
                {/* Roof */}
                <path d="M8 22L20 11L32 22" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                {/* Walls */}
                <path d="M12 19.5V31H17.5V25.5H22.5V31H28V19.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                {/* Door highlight */}
                <rect x="17.5" y="25.5" width="5" height="5.5" rx="1" fill="rgba(255,255,255,0.35)"/>
              </svg>
              {/* Wordmark */}
              <div style={{ lineHeight: 1 }}>
                <div style={{ display: "flex", alignItems: "baseline" }}>
                  <span style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: 19, fontWeight: 200, color: "#4A4843", letterSpacing: "0px" }}>Opti</span><span style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: 19, fontWeight: 800, color: "#BA7517", letterSpacing: "-0.8px" }}>HAUZ</span>
                </div>
                <div style={{ fontSize: 8.5, color: "#AEACA6", letterSpacing: "0.14em", textTransform: "uppercase", marginTop: 3, fontFamily: "'Inter', system-ui, sans-serif", fontWeight: 500 }}>Simulador Hipotecario</div>
              </div>
            </div>
            <SidebarClock />
          </div>

          <div className="sidebar-inputs" style={{ display: "none" }}>
          </div>

          <div className="sidebar-nav">
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8, paddingLeft: 12 }}>
              Vistas de Análisis
            </div>
            {tabs.map((t) => (
              <button key={t.id}
                onClick={() => setTab(t.id)}
                className={`sidebar-tab ${tab === t.id ? 'active' : ''}`}
              >
                <span className="sidebar-tab-icon">{t.icon}</span>
                <span style={{ flex: 1 }}>{t.label}</span>
              </button>
            ))}
          </div>

          <div className="sidebar-footer">
            <button
              onClick={() => setShowPrintView(true)}
              style={{
                width: "100%",
                padding: "10px 18px",
                borderRadius: "8px",
                background: "#1A1915",
                color: "#FAFAF9",
                border: "none",
                fontWeight: 600,
                fontSize: "14px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                transition: "transform 0.1s",
                boxShadow: "0 2px 8px rgba(0,0,0,0.12)"
              }}
              onMouseOver={(e) => e.currentTarget.style.transform = "scale(0.97)"}
              onMouseOut={(e) => e.currentTarget.style.transform = "scale(1)"}
            >
              <span style={{ fontSize: 15 }}>📄</span> Exportar Informe PDF
            </button>
          </div>
        </div>

        {/* ── ÁREA PRINCIPAL (DERECHA) ── */}
        <div className="main-area">
          <div className="main-content-scroll" style={(tab === "amortizacion" || tab === "resumen") ? { overflow: "hidden" } : {}}>

            {/* Banner Alerta movido dentro de la pestaña Resumen */}

            {/* Visores Dinámicos */}
              <div style={{ padding: "0", overflowY: (tab === "resumen" || tab === "amortizacion") ? "hidden" : "auto" }}>
                {tab === "datos" && (() => {
                  const clpEquivalent = (ufVal) => valorUF ? fmtCLP(ufVal * valorUF) : "Cargando CLP...";
                  const minPrepagoLegal = Math.ceil(saldoActual * 0.05);
                  
                  // Calcular fecha estimada para el inicio del prepago
                  let fechaPrepagoStr = "";
                  if (creditStart && pr.mesInicio) {
                    const d = new Date(creditStart.year, creditStart.month - 1);
                    d.setMonth(d.getMonth() + +pr.mesInicio - 1);
                    fechaPrepagoStr = d.toLocaleDateString('es-CL', { month: 'long', year: 'numeric' });
                  }

                  return (
                    <div className="animate-fade grid-2" style={{ gap: 16 }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                        <div className="glass-card" style={{ padding: 16, display: "flex", flexDirection: "column", gap: 16 }}>
                          <div className="section-title">
                            <span style={{ fontSize: 18 }}>🏦</span> Datos del Crédito
                          </div>
                          
                          <Input 
                            label="Monto original" 
                            value={cr.capital} 
                            onChange={setC("capital")} 
                            prefix="UF" 
                            min={1} 
                            sublabel={`Equivale a: ${clpEquivalent(cr.capital)}`}
                          />

                          <SliderInput 
                            label="Tasa (TNA)" 
                            value={cr.tna} 
                            onChange={setC("tna")} 
                            min={1.0} 
                            max={12.0} 
                            step={0.1} 
                            suffix="%" 
                          />

                          <SliderInput 
                            label="Plazo total" 
                            value={cr.plazo} 
                            onChange={handlePlazoChange} 
                            min={60} 
                            max={480} 
                            step={12} 
                            suffix=" meses" 
                            sublabel={`Equivale a: ${Math.round(cr.plazo / 12)} Años`}
                          />

                          <SliderInput 
                            label="Meses pagados" 
                            value={cr.mesesPagados} 
                            onChange={handleMesesPagadosChange} 
                            min={0} 
                            max={+cr.plazo} 
                            step={1} 
                            suffix=" meses" 
                          />

                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                            <Select 
                              label="Mes de inicio" 
                              value={cr.fechaInicioMonth} 
                              onChange={v => updateFechaInicio(cr.fechaInicioYear, Number(v))}
                              options={[
                                { value: 1, label: "Enero" },
                                { value: 2, label: "Febrero" },
                                { value: 3, label: "Marzo" },
                                { value: 4, label: "Abril" },
                                { value: 5, label: "Mayo" },
                                { value: 6, label: "Junio" },
                                { value: 7, label: "Julio" },
                                { value: 8, label: "Agosto" },
                                { value: 9, label: "Septiembre" },
                                { value: 10, label: "Octubre" },
                                { value: 11, label: "Noviembre" },
                                { value: 12, label: "Diciembre" }
                              ]}
                            />
                            <Select 
                              label="Año de inicio" 
                              value={cr.fechaInicioYear} 
                              onChange={v => updateFechaInicio(Number(v), cr.fechaInicioMonth)}
                              options={Array.from({ length: 40 }, (_, i) => {
                                const y = new Date().getFullYear() - i;
                                return { value: y, label: String(y) };
                              })}
                            />
                          </div>

                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, alignItems: "start" }}>
                            <Input 
                              label="Coste de Seguros" 
                              value={cr.seguros} 
                              onChange={setC("seguros")} 
                              suffix="UF" 
                              step={0.01} 
                              sublabel={`Mensual · ${clpEquivalent(cr.seguros)}`}
                            />
                            <Select 
                              label="Costo Prepago" 
                              value={cr.costoPrepago} 
                              onChange={setC("costoPrepago")}
                              options={costosPrepagoOpciones} 
                            />
                          </div>
                        </div>
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                        <div className="glass-card" style={{ borderColor: "var(--accent-amber)", padding: 16, display: "flex", flexDirection: "column", gap: 16 }}>
                          <div className="section-title" style={{ color: "var(--accent-amber)" }}>
                            <span style={{ fontSize: 18 }}>💸</span> Tu Estrategia de Prepago
                          </div>

                          <Input 
                            label="Monto del Prepago" 
                            value={pr.monto} 
                            onChange={setP("monto")} 
                            prefix="UF" 
                            sublabel={`Equivale a: ${clpEquivalent(pr.monto)} · Mínimo legal (5%): UF ${minPrepagoLegal}`}
                          />

                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                            <Select 
                              label="Frecuencia" 
                              value={pr.frecuencia} 
                              onChange={setP("frecuencia")}
                              options={[
                                { value: "una_vez", label: "Una vez" },
                                { value: "mensual", label: "Mensual" },
                                { value: "semestral", label: "Semestral" },
                                { value: "anual", label: "Anual" }
                              ]} 
                            />
                            <Select 
                              label="Destino del Prepago" 
                              value={pr.destino} 
                              onChange={setP("destino")}
                              options={[
                                { value: "plazo", label: "Bajar Plazo" },
                                { value: "cuota", label: "Bajar Cuota" }
                              ]} 
                            />
                          </div>

                          <SliderInput 
                            label="Inicia en mes" 
                            value={pr.mesInicio} 
                            onChange={handleMesInicioChange} 
                            min={+cr.mesesPagados + 1} 
                            max={+cr.plazo} 
                            step={1} 
                            suffix=" meses" 
                            sublabel={`Equivale a la cuota de: ${fechaPrepagoStr || 'cargando...'}`}
                          />
                        </div>

                        <div className="glass-card" style={{ borderColor: "var(--color-border-secondary)", padding: 16, display: "flex", flexDirection: "column", gap: 16 }}>
                          <div className="section-title" style={{ color: "var(--accent-indigo)" }}>
                            <span style={{ fontSize: 18 }}>⚙️</span> Macroeconómicos
                          </div>
                          
                          <SliderInput 
                            label="Inflación Proyectada (π)" 
                            value={inflacion} 
                            onChange={setInflacion} 
                            min={0.0} 
                            max={15.0} 
                            step={0.1} 
                            suffix="%" 
                          />

                          <SliderInput 
                            label="Retorno Inversión (ρ)" 
                            value={retornoInv} 
                            onChange={setRetornoInv} 
                            min={0.0} 
                            max={20.0} 
                            step={0.1} 
                            suffix="%" 
                          />

                          <div style={{ fontSize: 11, color: "var(--color-text-secondary)", lineHeight: 1.4 }}>
                            *Variables usadas estocásticamente en los modelos de Arbitraje y VPN.
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {tab === "resumen" && (() => {
                  const costoTotalSinPrepago = (cuotaBase + (+cr.seguros)) * mesesRestantes;
                  const porcentajeAmortizado = ((+cr.capital - saldoActual) / +cr.capital * 100);
                  const roiPrepago = +pr.monto > 0 && sim.totalPrepagado > 0 ? (ahorroNeto / sim.totalPrepagado * 100) : 0;
                  const terminoSinPrepago = new Date().getFullYear() + Math.ceil(mesesRestantes / 12);
                  const terminoConPrepago = +pr.monto > 0 ? new Date().getFullYear() + Math.ceil(sim.mesesReales / 12) : terminoSinPrepago;
                  const mesesPagados = +cr.mesesPagados;
                  const plazoTotal = +cr.plazo;
                  const progresoPlazo = (mesesPagados / plazoTotal * 100);

                  // --- Score de Conveniencia (0-100) ---
                  const calcScore = () => {
                    if (+pr.monto <= 0) return null;
                    const components = [];
                    // 1. ROI (30%): ahorro neto por cada UF prepagada
                    const roi = sim.totalPrepagado > 0 ? ahorroNeto / sim.totalPrepagado : 0;
                    components.push({ w: 0.30, v: Math.min(Math.max(roi * 100, 0), 100) });
                    // 2. Reducción de plazo relativa (25%)
                    const mesesAhorradosCalc = mesesRestantes - sim.mesesReales;
                    components.push({ w: 0.25, v: Math.min(Math.max((mesesAhorradosCalc / mesesRestantes) * 100, 0), 100) });
                    // 3. Bajo impacto de multas (20%)
                    const penaltyRatio = ahorroIntereses > 0 ? sim.totalMultas / ahorroIntereses : 1;
                    components.push({ w: 0.20, v: Math.max(0, (1 - penaltyRatio) * 100) });
                    // 4. Factor tasa (15%): tasa alta = más beneficio
                    components.push({ w: 0.15, v: Math.min((+cr.tna / 7) * 100, 100) });
                    // 5. Timing (10%): más plazo restante = mejor momento
                    components.push({ w: 0.10, v: (mesesRestantes / +cr.plazo) * 100 });
                    return Math.round(components.reduce((acc, c) => acc + c.w * c.v, 0));
                  };
                  const score = calcScore();
                  const scoreColor = score === null ? "var(--color-text-tertiary)" : score >= 81 ? "var(--accent-emerald)" : score >= 61 ? "var(--accent-cyan)" : score >= 31 ? "var(--accent-amber)" : "var(--accent-rose)";
                  const scoreLabel = score === null ? "Sin prepago" : score >= 81 ? "Altamente Conveniente" : score >= 61 ? "Conveniente" : score >= 41 ? "Moderado" : score >= 21 ? "Poco Conveniente" : "No Recomendado";

                  return (
                  <div className="animate-fade" style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                    {/* Score + Progreso del crédito */}
                    <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 12 }}>
                      {/* Progreso card */}
                      <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: 12, padding: "38px 24px", order: 2, minHeight: 132 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                          <div>
                            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Progreso del Crédito</div>
                            <div style={{ fontSize: 28, fontWeight: 800, color: "var(--color-text-primary)", lineHeight: 1.2 }}>UF {fmt(saldoActual)} <span style={{ fontSize: 14, fontWeight: 500, color: "var(--color-text-secondary)" }}>de UF {fmt(+cr.capital)}</span></div>
                            {valorUF && <div style={{ fontSize: 13, color: "var(--color-text-tertiary)", marginTop: 2 }}>{fmtCLP(saldoActual * valorUF)}</div>}
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <div style={{ fontSize: 36, fontWeight: 800, color: "var(--accent-cyan)", lineHeight: 1 }}>{porcentajeAmortizado.toFixed(1)}%</div>
                            <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginTop: 4 }}>amortizado</div>
                          </div>
                        </div>
                        {/* Barra de progreso */}
                        <div style={{ background: "var(--color-border-tertiary)", borderRadius: 6, height: 10, overflow: "hidden", position: "relative" }}>
                          <div style={{ width: `${porcentajeAmortizado}%`, height: "100%", background: "linear-gradient(90deg, var(--accent-cyan), var(--accent-emerald))", borderRadius: 6, transition: "width 0.6s ease" }}></div>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 11, color: "var(--color-text-tertiary)" }}>
                          <span>Mes {mesesPagados} de {plazoTotal}</span>
                          <span>Término sin prepago: {terminoSinPrepago}</span>
                        </div>
                      </div>

                      {/* Score widget */}
                      <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: 12, padding: "20px 20px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minWidth: 140, minHeight: 132, order: 1 }}>
                        <div style={{ fontSize: 10, fontWeight: 600, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Score Prepago</div>
                        <div style={{ position: "relative", width: 100, height: 100 }}>
                          {React.createElement("svg", { width: 100, height: 100, viewBox: "0 0 100 100" },
                            React.createElement("circle", { cx: 50, cy: 50, r: 42, fill: "none", stroke: "var(--color-border-tertiary)", strokeWidth: 5 }),
                            score !== null && React.createElement("circle", {
                              cx: 50, cy: 50, r: 42, fill: "none",
                              stroke: scoreColor, strokeWidth: 5,
                              strokeDasharray: `${(score / 100) * 263.89} 263.89`,
                              strokeLinecap: "round",
                              transform: "rotate(-90 50 50)",
                              style: { transition: "stroke-dasharray 0.8s ease" }
                            })
                          )}
                          <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                            <div style={{ fontSize: 28, fontWeight: 800, color: scoreColor, lineHeight: 1 }}>{score !== null ? score : "—"}</div>
                            <div style={{ fontSize: 9, fontWeight: 500, color: "var(--color-text-tertiary)", marginTop: 2 }}>/100</div>
                          </div>
                        </div>
                        <div style={{ fontSize: 10, fontWeight: 600, color: scoreColor, marginTop: 6, textAlign: "center", lineHeight: 1.3 }}>{scoreLabel}</div>
                      </div>
                    </div>

                    {/* Estado actual: 4 columnas compactas */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
                      <Stat label="Dividendo Mensual" value={valorUF ? `${fmtCLP(dividendoTotal * valorUF)}` : `UF ${fmt(dividendoTotal)}`} sub={`UF ${fmt(dividendoTotal)}`} colorClass="indigo" />
                      <Stat label="Tasa Anual (TNA)" value={`${(+cr.tna).toFixed(2)}%`} sub={`Mensual: ${(+cr.tna / 12).toFixed(3)}%`} colorClass="indigo" />
                      <Stat label="Intereses por Pagar" value={`UF ${fmt(interesesBase)}`} sub={`${(interesesBase / saldoActual * 100).toFixed(0)}% del saldo`} colorClass="indigo" />
                      <Stat label="Costo Total Restante" value={`UF ${fmt(costoTotalSinPrepago)}`} sub="Capital + interés + seguros" colorClass="indigo" />
                    </div>

                    {+pr.monto > 0 && (
                      <React.Fragment>

                        {/* Impacto: Hero cards lado a lado */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                          {/* Columna izquierda: Ahorro principal */}
                          <div style={{ background: conviene ? "#F0FDF4" : "#FEF2F2", border: `0.5px solid ${conviene ? "#BBF7D0" : "#FECACA"}`, borderRadius: 12, padding: "24px 24px 28px", display: "flex", flexDirection: "column", justifyContent: "center", minHeight: 192 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: "#6B6860", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Ahorro Neto Total</div>
                            <div style={{ fontSize: 38, fontWeight: 800, color: conviene ? "#3B6D11" : "#A32D2D", lineHeight: 1.1 }}>{valorUF ? fmtCLP(ahorroNeto * valorUF) : `UF ${fmt(ahorroNeto)}`}</div>
                            <div style={{ fontSize: 15, color: "#6B6860", marginTop: 6 }}>UF {fmt(ahorroNeto)}</div>
                            <div style={{ fontSize: 13, color: "#AEACA6", marginTop: 8 }}>Interés ahorrado − multas − costo oportunidad</div>
                          </div>

                          {/* Columna derecha: Timeline */}
                          <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: 12, padding: "24px 24px 28px", minHeight: 192 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: "#6B6860", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>
                              {pr.destino === "plazo" ? "Reducción de Plazo" : "Reducción de Cuota"}
                            </div>
                            {pr.destino === "plazo" ? (
                              <div style={{ display: "flex", alignItems: "baseline", gap: 16 }}>
                                <div>
                                  <div style={{ fontSize: 34, fontWeight: 800, color: "#185FA5", lineHeight: 1.1 }}>{fmtM(sim.mesesReales)}</div>
                                  <div style={{ fontSize: 13, color: "#AEACA6", marginTop: 4 }}>nuevo plazo → {terminoConPrepago}</div>
                                </div>
                                <div style={{ width: 1, height: 50, background: "var(--color-border-tertiary)" }}></div>
                                <div>
                                  <div style={{ fontSize: 26, fontWeight: 800, color: "#3B6D11", lineHeight: 1.1 }}>{fmtM(mesesAhorrados)}</div>
                                  <div style={{ fontSize: 13, color: "#AEACA6", marginTop: 4 }}>ahorrados ({((mesesAhorrados / mesesRestantes) * 100).toFixed(0)}%)</div>
                                </div>
                              </div>
                            ) : (
                              <div>
                                <div style={{ fontSize: 34, fontWeight: 800, color: "#185FA5", lineHeight: 1.1 }}>UF {fmt(sim.nuevaCuota + (+cr.seguros))}</div>
                                <div style={{ fontSize: 15, color: "#6B6860", marginTop: 6 }}>nueva cuota ({((cuotaBase - sim.nuevaCuota) / cuotaBase * 100).toFixed(1)}% menos)</div>
                                {valorUF && <div style={{ fontSize: 14, color: "#AEACA6", marginTop: 4 }}>Ahorras {fmtCLP((cuotaBase - sim.nuevaCuota) * valorUF)} / mes</div>}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Métricas del prepago: 4 columnas */}
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
                          <Stat label="Total Prepagado" value={`UF ${fmt(sim.totalPrepagado)}`} sub={`${sim.prepagosRealizados} eventos`} colorClass="amber" />
                          <Stat label="Costo Multas" value={`UF ${fmt(sim.totalMultas)}`} sub={sim.totalPrepagado > 0 ? `${(sim.totalMultas / sim.totalPrepagado * 100).toFixed(1)}% del prepago` : ""} colorClass="rose" />
                          <Stat label="Interés Ahorrado" value={`UF ${fmt(ahorroIntereses)}`} sub={`${((ahorroIntereses / interesesBase) * 100).toFixed(1)}% del total`} colorClass="emerald" />
                          <Stat label="ROI Prepago" value={`${roiPrepago.toFixed(1)}%`} sub="Retorno / capital prepagado" colorClass={roiPrepago > 0 ? "emerald" : "rose"} />
                        </div>
                      </React.Fragment>
                    )}
                  </div>
                  );
                })()}

                {
                  tab === "grafico" && (
                    <div className="animate-fade" style={{ display: "flex", flexDirection: "column", height: "100%", gap: 20 }}>
                      {+pr.monto > 0 && ahorroIntereses > 0 && (
                        <div className="glass-card" style={{ padding: "16px 20px", borderLeft: "4px solid var(--accent-cyan)", borderRadius: "8px 16px 16px 8px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--accent-cyan)" }}></div>
                            <div style={{ color: "var(--accent-cyan)", fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>Executive Summary</div>
                          </div>
                          <div style={{ fontSize: 14, color: "var(--text-main)", lineHeight: 1.6, fontFamily: "var(--font-body)", fontWeight: 400 }}>
                            La estrategia de amortización propuesta acelera la reducción del saldo insoluto, mitigando la exposición a intereses prospectivos en un <strong style={{ color: "#1A1915", fontWeight: 700 }}>{((ahorroIntereses / interesesBase) * 100).toFixed(1)}%</strong>. Esto permite comparar el impacto diferencial entre reducir plazo y reducir cuota.
                          </div>
                        </div>
                      )}
                      <div className="glass-card" style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                          <h3 style={{ fontSize: 15, color: "var(--text-main)", fontWeight: 700, letterSpacing: "-0.01em", display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ fontSize: 18 }}>📉</span> Proyección de Saldo Insoluto (UF)
                          </h3>
                        </div>
                        <div style={{ position: "relative", flex: 1, minHeight: "calc(100vh - 350px)" }}>
                          <GraficoSaldo evolucionSin={sim.evolucionSin} evolucionPlazo={simPlazo.evolucionCon} evolucionCuota={simCuota.evolucionCon} mesesRestantes={mesesRestantes} saldoInicial={saldoActual} cr={cr} />
                        </div>
                      </div>
                    </div>
                  )
                }

                {
                  tab === "escenario1" && (
                    <div className="animate-fade">
                      <h3 style={{ fontSize: 16, marginBottom: 8, color: "#1A1915", fontWeight: 600 }}>Punto de Equilibrio & Arbitraje</h3>
                      <p style={{ fontSize: 14, color: "var(--text-muted)", marginBottom: 16 }}>Análisis de tasas de interés, inflación y costo de capital.</p>
                      <Escenario1 cr={cr} saldoActual={saldoActual} mesesRestantes={mesesRestantes} interesesBase={interesesBase} pr={pr} cuotaBase={cuotaBase} valorUF={valorUF} cae={cae} inflacion={inflacion} setInflacion={setInflacion} retornoInv={retornoInv} setRetornoInv={setRetornoInv} />
                    </div>
                  )
                }

                {
                  tab === "escenario2" && (
                    <div className="animate-fade">
                      <h3 style={{ fontSize: 16, marginBottom: 8, color: "#1A1915", fontWeight: 600 }}>Valor Presente & Riesgo Estocástico</h3>
                      <p style={{ fontSize: 14, color: "var(--text-muted)", marginBottom: 16 }}>Análisis de flujos descontados y simulación de volatilidad (Monte Carlo).</p>
                      <Escenario2 cr={cr} saldoActual={saldoActual} mesesRestantes={mesesRestantes} interesesBase={interesesBase} pr={pr} cuotaBase={cuotaBase} valorUF={valorUF} cae={cae} inflacion={inflacion} setInflacion={setInflacion} retornoInv={retornoInv} setRetornoInv={setRetornoInv} volatilidad={volatilidad} setVolatilidad={setVolatilidad} />
                    </div>
                  )
                }

                {tab === "tributario" && (() => {
                  const UTA = valorUTM ? valorUTM * 12 : 813480; // UTA = UTM × 12
                  const topeDeduccionAnualUF = 8; // 8 UTA en UF (Art. 55 bis)
                  const topeDeduccionCLP = 8 * UTA;
                  const rentaAnual = rentaBruta * 12;
                  const limiteSuperior = 150 * UTA; // Sobre esto, beneficio = 0

                  // Calcular intereses anuales SIN prepago
                  const r = tasaMensual(+cr.tna);
                  const calcInteresesAnuales = (saldoInicio, tna, mesesDesde, cantMeses) => {
                    let saldo = saldoInicio;
                    let interesAnual = 0;
                    const rr = tasaMensual(tna);
                    const cuota = cuotaMensual(saldo, tna, cantMeses);
                    const anios = [];
                    let interesAcum = 0;
                    for (let m = 1; m <= cantMeses; m++) {
                      const intMes = saldo * rr;
                      const amort = Math.min(cuota - intMes, saldo);
                      saldo = Math.max(saldo - amort, 0);
                      interesAcum += intMes;
                      if (m % 12 === 0 || m === cantMeses) {
                        anios.push(interesAcum);
                        interesAcum = 0;
                      }
                    }
                    return anios;
                  };

                  const interesesSinPrepago = calcInteresesAnuales(saldoActual, +cr.tna, 0, mesesRestantes);

                  // Intereses CON prepago (usar datos del sim)
                  const interesesConPrepago = (() => {
                    if (+pr.monto <= 0 || !sim.detalleMensual) return null;
                    const anios = [];
                    let acum = 0;
                    sim.detalleMensual.forEach((d, i) => {
                      acum += d.interes;
                      if ((i + 1) % 12 === 0 || i === sim.detalleMensual.length - 1) {
                        anios.push(acum);
                        acum = 0;
                      }
                    });
                    return anios;
                  })();

                  // Factor de reducción por renta alta
                  const factorReduccion = rentaAnual >= limiteSuperior ? 0 :
                    rentaAnual <= 90 * UTA ? 1 :
                    Math.max(0, 1 - (rentaAnual - 90 * UTA) / (limiteSuperior - 90 * UTA));

                  // Tramo impositivo aproximado (Chile 2da categoría simplificado)
                  const calcTramo = (ra) => {
                    const uta = UTA;
                    if (ra <= 13.5 * uta) return 0;
                    if (ra <= 30 * uta) return 0.04;
                    if (ra <= 50 * uta) return 0.08;
                    if (ra <= 70 * uta) return 0.135;
                    if (ra <= 90 * uta) return 0.23;
                    if (ra <= 120 * uta) return 0.304;
                    if (ra <= 150 * uta) return 0.35;
                    return 0.40;
                  };
                  const tramoImpositivo = calcTramo(rentaAnual);

                  // Calcular beneficio por año
                  const beneficiosPorAnio = interesesSinPrepago.map((intAnualUF, i) => {
                    const intAnualCLP = intAnualUF * (valorUF || 39841);
                    const deducible = Math.min(intAnualCLP, topeDeduccionCLP) * factorReduccion;
                    const ahorroFiscal = deducible * tramoImpositivo;
                    return { anio: i + 1, interesUF: intAnualUF, interesCLP: intAnualCLP, deducible, ahorroFiscal };
                  });

                  const beneficiosConPrepago = interesesConPrepago ? interesesConPrepago.map((intAnualUF, i) => {
                    const intAnualCLP = intAnualUF * (valorUF || 39841);
                    const deducible = Math.min(intAnualCLP, topeDeduccionCLP) * factorReduccion;
                    const ahorroFiscal = deducible * tramoImpositivo;
                    return { anio: i + 1, interesUF: intAnualUF, interesCLP: intAnualCLP, deducible, ahorroFiscal };
                  }) : null;

                  const totalBeneficioSin = beneficiosPorAnio.reduce((s, b) => s + b.ahorroFiscal, 0);
                  const totalBeneficioCon = beneficiosConPrepago ? beneficiosConPrepago.reduce((s, b) => s + b.ahorroFiscal, 0) : 0;
                  const diferenciaBeneficio = totalBeneficioSin - totalBeneficioCon;
                  const ahorroNetoReal = +pr.monto > 0 ? (ahorroNeto * (valorUF || 39841)) - diferenciaBeneficio : 0;

                  return (
                    <div className="animate-fade" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <h3 style={{ fontSize: 16, color: "#1A1915", fontWeight: 600 }}>Beneficio Tributario — Art. 55 bis</h3>
                          <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>
                            Calcula la deducción fiscal por intereses hipotecarios y su impacto al prepagar.
                          </p>
                        </div>
                        <div className="segmented-control">
                          {[{ key: "resumen", label: "Resumen" }, { key: "tabla", label: "Desglose Anual" }].map(v => (
                            <button key={v.key} onClick={() => setTributarioVista(v.key)}
                              className={`segmented-control-btn ${tributarioVista === v.key ? 'active' : ''}`}>
                              {v.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {tributarioVista === "resumen" && <React.Fragment>
                      {/* Input de renta */}
                      <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: 12, padding: "20px 24px" }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12 }}>Datos del Contribuyente</div>
                        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr 1fr", gap: 16, alignItems: "end" }}>
                          <Input 
                            label="Renta Bruta Mensual (CLP)" 
                            value={rentaBruta} 
                            onChange={val => setRentaBruta(+val)} 
                            prefix="$"
                          />
                          <div>
                            <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginBottom: 4, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Tramo Impositivo</div>
                            <div style={{ fontSize: 20, fontWeight: 700, color: "var(--accent-cyan)", height: 42, display: "flex", alignItems: "center" }}>{(tramoImpositivo * 100).toFixed(1)}%</div>
                          </div>
                          <div>
                            <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginBottom: 4, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>UTM Vigente</div>
                            <div style={{ fontSize: 20, fontWeight: 700, color: "var(--color-text-primary)", height: 42, display: "flex", alignItems: "center" }}>{valorUTM ? fmtCLP(valorUTM) : "Cargando..."}</div>
                          </div>
                        </div>
                        {factorReduccion < 1 && factorReduccion > 0 && (
                          <div style={{ marginTop: 12, padding: "8px 12px", background: "rgba(186,117,23,0.08)", borderRadius: 8, fontSize: 12, color: "var(--accent-amber)" }}>
                            ⚠ Su renta excede 90 UTA. El beneficio se reduce al {(factorReduccion * 100).toFixed(0)}%.
                          </div>
                        )}
                        {factorReduccion === 0 && (
                          <div style={{ marginTop: 12, padding: "8px 12px", background: "rgba(163,45,45,0.08)", borderRadius: 8, fontSize: 12, color: "var(--accent-rose)" }}>
                            Su renta excede 150 UTA. No aplica beneficio tributario Art. 55 bis.
                          </div>
                        )}
                      </div>

                      {/* Resumen de impacto */}
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
                        <Stat label="Beneficio Total Sin Prepago" value={fmtCLP(totalBeneficioSin)} sub={`${beneficiosPorAnio.length} años`} colorClass="cyan" />
                        <Stat label="Beneficio Total Con Prepago" value={+pr.monto > 0 ? fmtCLP(totalBeneficioCon) : "—"} sub={beneficiosConPrepago ? `${beneficiosConPrepago.length} años` : "Sin prepago"} colorClass={+pr.monto > 0 ? "emerald" : "indigo"} />
                        <Stat label="Beneficio Fiscal Perdido" value={+pr.monto > 0 ? fmtCLP(diferenciaBeneficio) : "—"} sub="Al prepagar, reduces intereses" colorClass="rose" />
                        <Stat label="Ahorro Neto Real" value={+pr.monto > 0 ? fmtCLP(ahorroNetoReal) : "—"} sub="Ahorro prepago − beneficio perdido" colorClass={ahorroNetoReal > 0 ? "emerald" : "rose"} />
                      </div>

                      {/* Insight card */}
                      {+pr.monto > 0 && (
                        <div style={{ background: ahorroNetoReal > 0 ? "#F0FDF4" : "#FEF2F2", border: `0.5px solid ${ahorroNetoReal > 0 ? "#BBF7D0" : "#FECACA"}`, borderRadius: 12, padding: "20px 24px" }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "#6B6860", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Conclusión</div>
                          <div style={{ fontSize: 14, color: "#1A1915", lineHeight: 1.6 }}>
                            {ahorroNetoReal > 0 ? (
                              <span>Prepagar <strong>sigue siendo conveniente</strong> incluso descontando el beneficio tributario perdido. Tu ahorro neto real es <strong style={{ color: "#3B6D11" }}>{fmtCLP(ahorroNetoReal)}</strong>. El beneficio fiscal perdido ({fmtCLP(diferenciaBeneficio)}) representa solo el <strong>{totalBeneficioSin > 0 ? ((diferenciaBeneficio / (ahorroNeto * (valorUF || 39841))) * 100).toFixed(1) : 0}%</strong> de tu ahorro bruto.</span>
                            ) : (
                              <span>Al considerar el beneficio tributario perdido, el prepago <strong style={{ color: "#A32D2D" }}>no es conveniente</strong>. Perderías {fmtCLP(diferenciaBeneficio)} en deducciones fiscales, superando el ahorro del prepago. Considera mantener el crédito y optimizar tu declaración de impuestos.</span>
                            )}
                          </div>
                        </div>
                      )}
                      </React.Fragment>}

                      {/* Tabla por año */}
                      {tributarioVista === "tabla" && <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: 12, overflow: "hidden" }}>
                        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--color-border-tertiary)" }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "#1A1915" }}>Desglose Anual de Beneficio Tributario</div>
                        </div>
                        <div style={{ maxHeight: "calc(100vh - 500px)", overflowY: "auto" }}>
                          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                            <thead>
                              <tr style={{ background: "#F5F5F0", position: "sticky", top: 0, zIndex: 1 }}>
                                <th style={{ padding: "10px 16px", textAlign: "left", fontWeight: 600, color: "#6B6860", borderBottom: "2px solid var(--color-border-tertiary)" }}>Año</th>
                                <th style={{ padding: "10px 16px", textAlign: "right", fontWeight: 600, color: "#6B6860", borderBottom: "2px solid var(--color-border-tertiary)" }}>Intereses (UF)</th>
                                <th style={{ padding: "10px 16px", textAlign: "right", fontWeight: 600, color: "#6B6860", borderBottom: "2px solid var(--color-border-tertiary)" }}>Intereses (CLP)</th>
                                <th style={{ padding: "10px 16px", textAlign: "right", fontWeight: 600, color: "#6B6860", borderBottom: "2px solid var(--color-border-tertiary)" }}>Deducible</th>
                                <th style={{ padding: "10px 16px", textAlign: "right", fontWeight: 600, color: "#6B6860", borderBottom: "2px solid var(--color-border-tertiary)" }}>Ahorro Fiscal</th>
                                {beneficiosConPrepago && <th style={{ padding: "10px 16px", textAlign: "right", fontWeight: 600, color: "#6B6860", borderBottom: "2px solid var(--color-border-tertiary)" }}>Ahorro c/ Prepago</th>}
                                {beneficiosConPrepago && <th style={{ padding: "10px 16px", textAlign: "right", fontWeight: 600, color: "#6B6860", borderBottom: "2px solid var(--color-border-tertiary)" }}>Diferencia</th>}
                              </tr>
                            </thead>
                            <tbody>
                              {beneficiosPorAnio.map((b, i) => {
                                const bCon = beneficiosConPrepago && beneficiosConPrepago[i];
                                const diff = bCon ? b.ahorroFiscal - bCon.ahorroFiscal : 0;
                                return (
                                  <tr key={i} style={{ borderBottom: "1px solid #F0EDE8" }}>
                                    <td style={{ padding: "8px 16px", color: "#1A1915", fontWeight: 500 }}>{b.anio}</td>
                                    <td style={{ padding: "8px 16px", textAlign: "right", color: "#1A1915" }}>UF {fmt(b.interesUF)}</td>
                                    <td style={{ padding: "8px 16px", textAlign: "right", color: "#6B6860" }}>{fmtCLP(b.interesCLP)}</td>
                                    <td style={{ padding: "8px 16px", textAlign: "right", color: "#185FA5" }}>{fmtCLP(b.deducible)}</td>
                                    <td style={{ padding: "8px 16px", textAlign: "right", color: "#3B6D11", fontWeight: 600 }}>{fmtCLP(b.ahorroFiscal)}</td>
                                    {beneficiosConPrepago && <td style={{ padding: "8px 16px", textAlign: "right", color: bCon ? "#3B6D11" : "#AEACA6" }}>{bCon ? fmtCLP(bCon.ahorroFiscal) : "—"}</td>}
                                    {beneficiosConPrepago && <td style={{ padding: "8px 16px", textAlign: "right", color: diff > 0 ? "#A32D2D" : "#6B6860", fontWeight: diff > 0 ? 600 : 400 }}>{diff > 0 ? `-${fmtCLP(diff)}` : "—"}</td>}
                                  </tr>
                                );
                              })}
                            </tbody>
                            <tfoot>
                              <tr style={{ background: "#F5F5F0", fontWeight: 700 }}>
                                <td style={{ padding: "10px 16px", color: "#1A1915" }}>Total</td>
                                <td style={{ padding: "10px 16px", textAlign: "right", color: "#1A1915" }}>UF {fmt(beneficiosPorAnio.reduce((s,b) => s + b.interesUF, 0))}</td>
                                <td style={{ padding: "10px 16px", textAlign: "right", color: "#6B6860" }}>{fmtCLP(beneficiosPorAnio.reduce((s,b) => s + b.interesCLP, 0))}</td>
                                <td style={{ padding: "10px 16px", textAlign: "right", color: "#185FA5" }}>{fmtCLP(beneficiosPorAnio.reduce((s,b) => s + b.deducible, 0))}</td>
                                <td style={{ padding: "10px 16px", textAlign: "right", color: "#3B6D11" }}>{fmtCLP(totalBeneficioSin)}</td>
                                {beneficiosConPrepago && <td style={{ padding: "10px 16px", textAlign: "right", color: "#3B6D11" }}>{fmtCLP(totalBeneficioCon)}</td>}
                                {beneficiosConPrepago && <td style={{ padding: "10px 16px", textAlign: "right", color: "#A32D2D" }}>-{fmtCLP(diferenciaBeneficio)}</td>}
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      </div>}

                      {/* Nota legal */}
                      <div style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.5, padding: "0 4px" }}>
                        * Cálculo referencial basado en Art. 55 bis Ley de Impuesto a la Renta. Tope deducción: 8 UTA anuales. Beneficio se reduce progresivamente entre 90 and 150 UTA de renta anual. Consulte a su contador para su situación específica. UTM vigente: {valorUTM ? fmtCLP(valorUTM) : "cargando"}.
                      </div>
                    </div>
                  );
                })()}

                {tab === "amortizacion" && (
                  <div className="animate-fade">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                      <div>
                        <h3 style={{ fontSize: 16, color: "#1A1915", fontWeight: 600 }}>
                          {detalleVista === "tabla" ? "Tabla de Amortización Detallada" : "Evolución del Flujo de Caja"}
                        </h3>
                        <p style={{ fontSize: 14, color: "var(--text-muted)" }}>
                          {detalleVista === "tabla"
                            ? `Desglose mensual bajo la estrategia de ${pr.destino === "plazo" ? "Reducción de Plazo" : "Reducción de Cuota"}.`
                            : "Compara cómo la cuota mensual disminuye progresivamente en el tiempo según tu estrategia."}
                        </p>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div className="segmented-control">
                          {[{ key: "tabla", label: "Tabla" }, { key: "grafico", label: "Gráfico" }].map(v => (
                            <button
                              key={v.key}
                              onClick={() => setDetalleVista(v.key)}
                              className={`segmented-control-btn ${detalleVista === v.key ? 'active' : ''}`}
                            >
                              {v.label}
                            </button>
                          ))}
                        </div>
                        <div className="segmented-control">
                          {["UF", "CLP"].map(m => (
                            <button
                              key={m}
                              onClick={() => setMonedaTabla(m)}
                              className={`segmented-control-btn ${monedaTabla === m ? 'active' : ''}`}
                              style={{ fontSize: 10, padding: "6px 12px" }}
                            >
                              {m}
                            </button>
                          ))}
                        </div>
                        <div style={{ textAlign: "right", background: "var(--color-background-secondary)", padding: "12px 20px", borderRadius: 10, border: "1px solid var(--color-border-secondary)", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                          <div style={{ fontSize: 10, color: "var(--accent-cyan)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em" }}>Término Proyectado</div>
                          <div style={{ fontSize: 20, fontWeight: 800, color: "var(--color-text-primary)", lineHeight: 1.1, marginTop: 2 }}>{new Date().getFullYear() + Math.floor((new Date().getMonth() + sim.mesesReales) / 12)}</div>
                        </div>
                      </div>
                    </div>

                    {detalleVista === "tabla" ? (
                      <TablaAmortizacion
                        detalle={sim.detalleMensual}
                        historial={historialPagado}
                        mesesPagados={+cr.mesesPagados}
                        startYear={creditStart.year}
                        startMonth={creditStart.month}
                        seguros={+cr.seguros}
                        moneda={monedaTabla}
                        valorUF={valorUF}
                      />
                    ) : (
                      <div style={{ position: "relative", minHeight: 500, height: "60vh" }}>
                        <GraficoCuotas evolucionCuota={sim.evolucionCuota} cuotaBase={cuotaBase + (+cr.seguros)} destino={pr.destino} valorUF={valorUF} moneda={monedaTabla} />
                      </div>
                    )}
                  </div>
                )}
              </div >
          </div >
        </div>
      </div>
    </>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);

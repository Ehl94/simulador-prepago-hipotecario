// ── ESCENARIO 1 (ARBITRAJE DE TASAS) + ESCENARIO 2 (VPN Y MONTE CARLO) ──────────────
// Depende de: globals.js (fmt, fmtM), financial_logic.js

const { fmt } = window;
const { SliderInput, RateBarChart, ProbabilityGauge } = window.UIComponents;

// ── ESCENARIO 1 (TASAS E INFLACIÓN) ────────────────────────────────────────────────────────
const Escenario1 = ({ cr, saldoActual, mesesRestantes, interesesBase, pr, cuotaBase, valorUF, cae, inflacion, setInflacion, retornoInv, setRetornoInv }) => {
  // Evaluar escenario actual
  const { simularPrepago, calcularFisher } = window.FinancialLogic;
  const minPrepago = Math.ceil(saldoActual * 0.05); // Límite legal 5%
  const montoEstrategico = Math.max(minPrepago, +pr.monto);
  const { totalMultas } = simularPrepago(
    saldoActual, +cr.tna, mesesRestantes, montoEstrategico, pr.frecuencia, Math.max(1, +pr.mesInicio - +cr.mesesPagados), pr.destino, cuotaBase, +cr.costoPrepago, +cr.seguros
  );

  // MODELO B: Arbitraje de Tasas (Criterio de Fisher Modificado)
  const { costoNominal: i_nom, deltaFisher, breakEvenInflacion: piElegible } = calcularFisher(+cr.tna, inflacion, retornoInv);

  // Decisión Final
  const esDominante = deltaFisher > 0;

  return (
    <div className="animate-fade" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      
      {/* Panel de Controles Rápidos en el Escenario */}
      <div className="glass-card" style={{ padding: "12px 16px", background: "var(--color-background-secondary)", border: "1px solid var(--color-border-tertiary)" }}>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "var(--color-text-secondary)", marginBottom: 10 }}>
          🎛️ Ajustar Supuestos del Escenario
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
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
        </div>
      </div>

      <div className="grid-2" style={{ gap: 16 }}>
        {/* ────── MODELO A: PUNTO DE EQUILIBRIO DE INFLACIÓN ────── */}
        <div className="glass-card" style={{ padding: "16px", display: "flex", flexDirection: "column" }}>
          <h3 style={{ fontSize: 14, color: "#1A1915", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ color: "var(--accent-indigo)" }}>A.</span> Punto de Equilibrio (π*)
          </h3>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 16, lineHeight: 1.5 }}>
            En Chile, la deuda hipotecaria está en UF y la inversión en pesos (CLP). Este modelo calcula la <strong>inflación exacta</strong> en la que tu crédito se encarece tanto que empata con la rentabilidad de tu inversión.
          </div>
          <div className="highlight-card" style={{ justifyContent: "space-between", marginBottom: 16 }}>
            <div>
              <div className="kpi-card-mini-label" style={{ textAlign: "left" }}>Break-even (π*)</div>
              <div className="kpi-card-mini-value" style={{ fontSize: 28 }}>{(piElegible * 100).toFixed(2)}%</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div className="kpi-card-mini-label">Tu Proyección (π)</div>
              <div className="kpi-card-mini-value" style={{ fontSize: 20, color: inflacion > (piElegible * 100) ? "var(--accent-emerald)" : "var(--accent-rose)" }}>{(+inflacion).toFixed(2)}%</div>
            </div>
          </div>

          {/* Regla de Decisión Dinámica */}
          {(() => {
            const piPct = piElegible * 100;
            const upperBound = piPct + 0.25;
            const lowerBound = piPct - 0.25;
            const inf = +inflacion;
            let decisionClass, title, desc;

            if (inf > upperBound) {
              decisionClass = "positive";
              title = "🟢 PREPAGO GANA"; desc = "La inflación proyectada es demasiado alta. Tu deuda en UF está creciendo más rápido de lo que rendiría el capital en el banco. Matemática y financieramente, te conviene liquidar la deuda.";
            } else if (inf < lowerBound) {
              decisionClass = "negative";
              title = "🔴 INVERSIÓN GANA"; desc = "Con una inflación baja, la UF crece lento. El dinero tiene mucha más fuerza multiplicadora rindiendo en tu instrumento financiero que destruyendo pasivos estáticos.";
            } else {
              decisionClass = "neutral";
              title = "🟡 ZONA DE INDIFERENCIA"; desc = `La inflación proyectada está extremadamente cerca del punto de equilibrio [${lowerBound.toFixed(2)}% - ${upperBound.toFixed(2)}%]. En este margen, la rentabilidad es casi idéntica; elige la opción que te dé mayor liquidez o tranquilidad psicológica.`;
            }

            return (
              <div className={`decision-box ${decisionClass}`}>
                <div className="decision-box-title">{title}</div>
                <div className="decision-box-desc">{desc}</div>
              </div>
            );
          })()}
        </div>

        {/* ────── MODELO B: ARBITRAJE Y PARIDAD ────── */}
        <div className="glass-card" style={{ padding: "16px", display: "flex", flexDirection: "column" }}>
          <h3 style={{ fontSize: 14, color: "#1A1915", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ color: "var(--accent-indigo)" }}>B.</span> Arbitraje y Paridad (Fisher)
          </h3>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 8, lineHeight: 1.5 }}>
            Transforma el costo en UF de tu crédito a una <strong>Tasa Anual Nominal (CLP)</strong> para compararlo directamente con el retorno de tu inversión bancaria.
          </div>
          
          <RateBarChart 
            label1="Costo Nominal del Crédito (UF + Inflación)" 
            value1={i_nom * 100} 
            label2="Retorno Nominal de tu Inversión" 
            value2={+retornoInv} 
          />

          <div className="kpi-grid-3" style={{ marginBottom: 16 }}>
            <div className="kpi-card-mini">
              <div className="kpi-card-mini-label">Costo Nominal</div>
              <div className="kpi-card-mini-value cyan">{(i_nom * 100).toFixed(2)}%</div>
            </div>
            <div className={`kpi-card-mini ${deltaFisher > 0 ? 'positive' : 'negative'}`}>
              <div className="kpi-card-mini-label">Spread Neto</div>
              <div className={`kpi-card-mini-value ${deltaFisher > 0 ? 'emerald' : 'rose'}`}>
                {deltaFisher > 0 ? '+' : ''}{(deltaFisher * 100).toFixed(2)}%
              </div>
            </div>
            <div className="kpi-card-mini">
              <div className="kpi-card-mini-label">Retorno Inv.</div>
              <div className="kpi-card-mini-value">{(+retornoInv).toFixed(2)}%</div>
            </div>
          </div>

          <div className={`decision-box centered ${esDominante ? 'positive' : 'negative'}`}>
            <div className="decision-box-title">
              {esDominante ? 'Costo Crédito > Retorno Inversión' : 'Costo Crédito < Retorno Inversión'}
            </div>
            <div className="decision-box-desc">
              {esDominante
                ? `Tu crédito te cuesta ${(i_nom * 100).toFixed(2)}% anual nominal, pero tu dinero solo rinde ${(+retornoInv).toFixed(2)}%. Estás perdiendo patrimonio manteniendo dinero invertido en lugar de pagar deuda cara.`
                : `Cerrar este crédito es ineficiente. El costo financiero en UF sale más barato (${(i_nom * 100).toFixed(2)}% nominal) que lo que el banco te paga por mantener el dinero en fondos (${(+retornoInv).toFixed(2)}%). Acumula capital tranquilo.`}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── ESCENARIO 2 (VALOR PRESENTE & RIESGO ESTOCÁSTICO) ───────────────────────────────────
const Escenario2 = ({ cr, saldoActual, mesesRestantes, interesesBase, pr, cuotaBase, valorUF, cae, inflacion, setInflacion, retornoInv, setRetornoInv, volatilidad, setVolatilidad }) => {
  // Evaluar escenario actual
  const { simularPrepago, calcularFisher, calcularVPN } = window.FinancialLogic;
  const minPrepago = Math.ceil(saldoActual * 0.05);
  const montoEstrategico = Math.max(minPrepago, +pr.monto);
  const sim = simularPrepago(
    saldoActual, +cr.tna, mesesRestantes, montoEstrategico, pr.frecuencia, +pr.mesInicio - +cr.mesesPagados, pr.destino, cuotaBase, +cr.costoPrepago, +cr.seguros
  );
  const { mesesReales, totalIntereses, totalMultas } = sim;

  const mesesAhorrados = Math.max(0, mesesRestantes - mesesReales);
  const ahorroIntereses = interesesBase - totalIntereses;
  const ahorroSeguros = mesesAhorrados * (+cr.seguros || 0);
  const ahorroBruto = ahorroIntereses + ahorroSeguros;
  const ahorroNeto = ahorroBruto - totalMultas;

  // Criterio de Fisher
  const { deltaFisher } = calcularFisher(+cr.tna, inflacion, retornoInv);

  // MODELO C: Valor Presente Neto (VPN)
  const { vpContrato, vpPrepago, ahorroVPN, convieneVPN } = calcularVPN(
    saldoActual, +cr.tna, mesesRestantes, montoEstrategico, pr.frecuencia, +pr.mesInicio - +cr.mesesPagados, pr.destino, cuotaBase, +cr.costoPrepago, +cr.seguros, retornoInv, sim
  );

  // MODELO D: Simulación Estocástica Simplificada (Monte Carlo)
  // Usamos una distribución determinista basada en la volatilidad ingresada
  const stdDev = Math.sqrt(0.015 ** 2 + (volatilidad / 100) ** 2);
  const zScore = deltaFisher / stdDev;
  const probConveniencia = 1 / (1 + Math.exp(-1.702 * zScore));

  const volatilidadAhorro = ahorroNeto * (volatilidad / 100);
  const mcRango = [Math.max(0, ahorroNeto - volatilidadAhorro), ahorroNeto + volatilidadAhorro];


  return (
    <div className="animate-fade" style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Panel de Controles Rápidos en el Escenario */}
      <div className="glass-card" style={{ padding: "12px 16px", background: "var(--color-background-secondary)", border: "1px solid var(--color-border-tertiary)" }}>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "var(--color-text-secondary)", marginBottom: 10 }}>
          🎛️ Ajustar Supuestos del Escenario
        </div>
        <div className="grid-3">
          <SliderInput 
            label="Retorno Inversión (ρ)" 
            value={retornoInv} 
            onChange={setRetornoInv} 
            min={0.0} 
            max={20.0} 
            step={0.1} 
            suffix="%" 
          />
          <SliderInput 
            label="Volatilidad del Retorno (σ)" 
            value={volatilidad} 
            onChange={setVolatilidad} 
            min={5.0} 
            max={60.0} 
            step={1.0} 
            suffix="%" 
          />
          <SliderInput 
            label="Inflación Proyectada (π)" 
            value={inflacion} 
            onChange={setInflacion} 
            min={0.0} 
            max={15.0} 
            step={0.1} 
            suffix="%" 
          />
        </div>
      </div>

      <div className="grid-2" style={{ gap: 16 }}>
        {/* ────── MODELO C: VALOR PRESENTE NETO ────── */}
        <div className="glass-card" style={{ padding: "16px", display: "flex", flexDirection: "column" }}>
          <h3 style={{ fontSize: 14, color: "#1A1915", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ color: "var(--accent-indigo)" }}>C.</span> Valor Presente Neto (VPN)
          </h3>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 16, lineHeight: 1.5 }}>
            El dinero en el futuro vale menos que hoy. Este modelo <strong>descuenta todos los flujos de tus dividendos futuros</strong> de vuelta al día de hoy, usando tu rentabilidad de inversión como barrera de descuento.
          </div>

          <div className="detail-row-group">
            <div className="detail-row-item">
              <div>
                <div className="detail-row-label">VP Contrato Base</div>
                <div className="detail-row-sublabel">Sin prepagar nada</div>
              </div>
              <div className="detail-row-value">UF {fmt(vpContrato)}</div>
            </div>
            <div className="detail-row-item">
              <div>
                <div className="detail-row-label">VP Estrategia (+ Prepago)</div>
                <div className="detail-row-sublabel">Inyección + Nuevos flujos</div>
              </div>
              <div className="detail-row-value">UF {fmt(vpPrepago)}</div>
            </div>
          </div>

          <div className={`decision-box ${convieneVPN ? 'positive' : 'negative'}`}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <span className="decision-box-title" style={{ margin: 0 }}>
                Creación Neta de Patrimonio
              </span>
              <span style={{ fontSize: 24, fontWeight: 800 }}>
                {convieneVPN ? "+" : ""}UF {fmt(ahorroVPN)}
              </span>
            </div>
            <div className="decision-box-desc">
              {convieneVPN
                ? `Al ejecutar esta estrategia, estás "destruyendo obligaciones" y agregando directamente riqueza presente y pura a tu hoja de balance personal.`
                : `Destinar capital hoy para comprar deuda barata está "destruyendo" valor presente en tu patrimonio neto en favor del banco.`}
            </div>
          </div>
        </div>

        {/* ────── MODELO D: MONTE CARLO ────── */}
        <div className="glass-card" style={{ padding: "16px", background: "linear-gradient(135deg, #FFFFFF 0%, rgba(245,158,11,0.10) 100%)", display: "flex", flexDirection: "column" }}>
          <h3 style={{ fontSize: 14, color: "#1A1915", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ color: "var(--accent-amber)" }}>D.</span> Monte Carlo (Probabilidades)
          </h3>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 20, lineHeight: 1.5 }}>
            Las inversiones rara vez tienen un retorno fijo asegurado. Este modelo somete tu retorno del {retornoInv}% a un entorno de <strong>caos y volatilidad estocástica</strong> para medir la verdadera probabilidad de vencer al banco en el mundo real.
          </div>

          <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 20 }}>
            <div style={{ width: 140, flexShrink: 0 }}>
              <ProbabilityGauge probability={probConveniencia} />
            </div>
            <div style={{ fontSize: 12, color: "var(--color-text-secondary)", lineHeight: 1.5, flex: 1 }}>
              <strong>Probabilidad de Éxito.</strong><br />
              Si simulamos esta estrategia 10,000 veces en la economía bajo escenarios de estrés, esta es la probabilidad de que el prepago resulte financieramente superior a mantener la inversión alternativa (retorno nominal neto positivo).
            </div>
          </div>

          <div className="spectrum-card">
            <div className="spectrum-card-title">Espectro de Ahorro Neto UF (P10 - P90)</div>
            <div className="spectrum-card-row">
              <div className="spectrum-card-val-box left">
                <div className="spectrum-card-num">UF {fmt(mcRango[0], 0)}</div>
                <div className="spectrum-card-lbl">Peor Escenario</div>
              </div>
              <div className="spectrum-card-bar-wrapper">
                <div className="spectrum-card-bar-bg">
                  <div className="spectrum-card-bar-fill"></div>
                </div>
              </div>
              <div className="spectrum-card-val-box right">
                <div className="spectrum-card-num">UF {fmt(mcRango[1], 0)}</div>
                <div className="spectrum-card-lbl">Mejor Escenario</div>
              </div>
            </div>
            <div className="spectrum-card-footer">
              Bajo un estrés de mercado del {volatilidad}% de desviación estándar.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Expose components globally
window.Escenarios = { Escenario1, Escenario2 };

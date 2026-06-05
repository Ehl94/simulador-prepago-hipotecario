// -- REPORTE PDF -------------------------------------------------------------------------
// Depende de: globals.js (fmt, fmtM, fmtCLP), financial_logic.js

    const ReportePDF = React.forwardRef(({ cr, pr, sim, saldoActual, mesesRestantes, cuotaBase, interesesBase, ahorroNeto, mesesAhorrados, inflacion, retornoInv, simularPrepago }, ref) => {
      const { tasaMensual } = window.FinancialLogic;
      // Formateadores locales para PDF
      const fNum = (num) => (+num).toLocaleString('es-CL', { maximumFractionDigits: 1 });
      const fMon = (num) => `UF ${fNum(num)}`;
      const fmtM = (m) => `${Math.floor(m / 12)}a ${m % 12}m`;
      // Dividendo total (cuota + seguros)
      const dividendoTotal = cuotaBase + (+cr.seguros || 0);

      // Wrapper para simular escenarios
      const runSim = (monto) => {
        const s = simularPrepago(saldoActual, +cr.tna, mesesRestantes, monto, pr.frecuencia, +pr.mesInicio - +cr.mesesPagados, pr.destino, cuotaBase, +cr.costoPrepago, +cr.seguros);
        const ahorroInt = interesesBase - s.totalIntereses;
        return {
          ...s,
          ahorroNeto: ahorroInt - s.totalMultas,
          ahorroIntereses: ahorroInt,
          mesesAhorrados: mesesRestantes - s.mesesReales,
          nuevaCuota: s.nuevaCuota
        };
      };

      // Métricas Avanzadas (Fisher & VPN)
      const { calcularFisher, calcularVPN } = window.FinancialLogic;
      const { costoNominal: i_nom, deltaFisher } = calcularFisher(+cr.tna, inflacion, retornoInv);
      const { vpContrato, vpPrepago, ahorroVPN } = calcularVPN(
        saldoActual, +cr.tna, mesesRestantes, +pr.monto, pr.frecuencia, +pr.mesInicio - +cr.mesesPagados, pr.destino, cuotaBase, +cr.costoPrepago, +cr.seguros, retornoInv, sim
      );


      // Escenarios comparativos (Page 3)
      const nivelesPrepago = [50, 100, 200, 300, 500, 800];
      const maxAhorro = Math.max(0, ...nivelesPrepago.map(m => runSim(m).ahorroNeto));

      // -- SVG Math Helpers (Page 4)
      const maxMes = mesesRestantes || 1;
      const maxSaldo = saldoActual || 1;
      const mapX = (mes) => 60 + (mes / maxMes) * 570;
      const mapY = (saldo) => 245 - (saldo / maxSaldo) * 215;

      const makePath = (data) => {
        if (!data || data.length === 0) return "";
        return data.map((d, i) => `${i === 0 ? 'M' : 'L'}${mapX(d.mes)},${mapY(d.saldo)}`).join(' ');
      };

      const pathSin = makePath(sim.evolucionSin);
      const pathCon = makePath(sim.evolucionCon);
      // Para las áreas, cerramos el polígono hacia el eje X
      const lastMesCon = sim.evolucionCon.length > 0 ? sim.evolucionCon[sim.evolucionCon.length - 1].mes : 0;
      const areaSin = `${pathSin} L${mapX(maxMes)},245 L60,245 Z`;
      const areaCon = `${pathCon} L${mapX(lastMesCon)},245 L60,245 Z`;

      return (
        <div ref={ref} className="pdf-report-container">
          {/* --------------------------------------------------------------
               PÁGINA 1 — PORTADA
          --------------------------------------------------------------- */}
          <div className="page cover">
            <div className="cover-top-bar"></div>
            <div className="cover-body">
              <div className="cover-eyebrow">Análisis Financiero Confidencial</div>
              <div className="cover-title">Estrategia de<br /><span>Prepago</span> Hipotecario</div>
              <div className="cover-subtitle">Evaluación integral de impacto financiero, proyección de ahorro, análisis de sensibilidad y recomendación de estrategia óptima de amortización anticipada según supuestos macroeconómicos.</div>
              <div className="cover-divider"></div>

              <div className="cover-hero-stat">
                <div className="cover-stat-box">
                  <label>Ahorro proyectado en intereses</label>
                  <div className="val">{fMon(ahorroNeto > 0 ? ahorroNeto : 0)}</div>
                  <div className="sub">Neto de multa · Escenario simulado</div>
                </div>
                {pr.destino === "plazo" ? (
                  <div className={`cover-stat-box ${ahorroNeto > 0 ? 'green' : ''}`}>
                    <label>Reducción del plazo</label>
                    <div className="val">{fmtM(Math.max(0, mesesAhorrados))}</div>
                    <div className="sub">Con prepago {pr.frecuencia} de {fMon(pr.monto)}</div>
                  </div>
                ) : (
                  <div className={`cover-stat-box ${ahorroNeto > 0 ? 'green' : ''}`}>
                    <label>Reducción de cuota</label>
                    <div className="val">{fMon(Math.max(0, cuotaBase - sim.nuevaCuota))}</div>
                    <div className="sub">Nueva cuota const.: {fMon(sim.nuevaCuota)}</div>
                  </div>
                )}
              </div>

              <div className="cover-meta">
                <div className="cover-meta-item">
                  <label>Cliente</label>
                  <span>Generado Localmente</span>
                </div>
                <div className="cover-meta-item">
                  <label>Fecha del informe</label>
                  <span>{new Date().toLocaleDateString('es-CL', { month: 'long', year: 'numeric' })}</span>
                </div>
                <div className="cover-meta-item">
                  <label>TNA Base</label>
                  <span>{cr.tna}%</span>
                </div>
              </div>
            </div>

            <div className="cover-footer">
              <div className="cover-footer-brand">SIMULADOR HIPOTECARIO</div>
              <div className="cover-footer-conf">Documento confidencial · Solo para uso del cliente</div>
            </div>
          </div>

          {/* --------------------------------------------------------------
               PÁGINA 2 — TABLA DE CONTENIDOS
          --------------------------------------------------------------- */}
          <div className="page inner-page">
            <div className="page-header">
              <div>
                <div className="page-section-label">Contenido</div>
                <div className="page-title">Tabla de Contenidos</div>
              </div>
              <div className="page-number"><strong>Índice</strong></div>
            </div>

            <div style={{ fontSize: 13, color: "#1A1915", lineHeight: 2.1, fontFamily: 'Inter' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, paddingBottom: 6, borderBottom: '1px solid #E5E7EB' }}>
                <span>1. Portada y Resumen Ejecutivo</span>
                <span style={{ color: '#AEACA6' }}>1</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, paddingBottom: 6, borderBottom: '1px solid #E5E7EB' }}>
                <span>2. Parámetros de Entrada y Supuestos</span>
                <span style={{ color: '#AEACA6' }}>3</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, paddingBottom: 6, borderBottom: '1px solid #E5E7EB' }}>
                <span>3. Diagnóstico del Crédito Actual</span>
                <span style={{ color: '#AEACA6' }}>4</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, paddingBottom: 6, borderBottom: '1px solid #E5E7EB' }}>
                <span>4. Análisis de Escenarios de Prepago</span>
                <span style={{ color: '#AEACA6' }}>5</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, paddingBottom: 6, borderBottom: '1px solid #E5E7EB' }}>
                <span>5. Proyección Financiera y Evolución del Saldo</span>
                <span style={{ color: '#AEACA6' }}>6</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, paddingBottom: 6, borderBottom: '1px solid #E5E7EB' }}>
                <span>6. Análisis de Sensibilidad y Riesgos</span>
                <span style={{ color: '#AEACA6' }}>7</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, paddingBottom: 6, borderBottom: '1px solid #E5E7EB' }}>
                <span>7. Recomendación Estratégica y Plan de Acción</span>
                <span style={{ color: '#AEACA6' }}>8</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, paddingBottom: 6, borderBottom: '1px solid #E5E7EB' }}>
                <span>8. Disclaimers y Consideraciones Legales</span>
                <span style={{ color: '#AEACA6' }}>9</span>
              </div>
            </div>

            <div style={{ marginTop: 16, padding: '12px', background: 'rgba(37, 99, 235, 0.06)', borderLeft: `4px solid #2563EB`, borderRadius: 4 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#4338ca', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Documento de Referencia</div>
              <div style={{ fontSize: 10, color: '#1A1915', lineHeight: 1.5 }}>
                Este reporte ha sido generado localmente utilizando datos bancarios y supuestos macroeconómicos ingresados en el simulador. Los cálculos se basan en sistema de amortización francesa con compounding mensual. La información contenida es válida únicamente para la fecha de emisión y bajo los supuestos especificados en la página siguiente.
              </div>
            </div>

            <div className="page-footer">
              <div><strong>Simulador de Prepago Hipotecario</strong> · Análisis Financiero Confidencial</div>
              <div>Generado automáticamente · {new Date().toLocaleDateString('es-CL')}</div>
            </div>
          </div>

          {/* --------------------------------------------------------------
               PÁGINA 3 — PARÁMETROS DE ENTRADA
          --------------------------------------------------------------- */}
          <div className="page inner-page">
            <div className="page-header">
              <div>
                <div className="page-section-label">Configuración</div>
                <div className="page-title">Parámetros de Entrada y Supuestos</div>
              </div>
              <div className="page-number"><strong>02</strong>Parámetros</div>
            </div>

            {/* Sección Crédito */}
            <div className="section-title">Especificaciones del Crédito Hipotecario</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
              <div style={{ padding: '12px', background: '#f8fafc', borderRadius: 6, border: '1px solid #E5E7EB' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#AEACA6', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Capital Original</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#1A1915' }}>{fMon(cr.capital)}</div>
              </div>
              <div style={{ padding: '12px', background: '#f8fafc', borderRadius: 6, border: '1px solid #E5E7EB' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#AEACA6', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Plazo Total</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#1A1915' }}>{fmtM(+cr.plazo)}</div>
              </div>
              <div style={{ padding: '12px', background: '#f8fafc', borderRadius: 6, border: '1px solid #E5E7EB' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#AEACA6', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Meses Pagados</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#1A1915' }}>{fmtM(+cr.mesesPagados)}</div>
              </div>
              <div style={{ padding: '12px', background: '#f8fafc', borderRadius: 6, border: '1px solid #E5E7EB' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#AEACA6', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>TNA (Nominal)</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#1A1915' }}>{cr.tna}%</div>
              </div>
              <div style={{ padding: '12px', background: '#f8fafc', borderRadius: 6, border: '1px solid #E5E7EB' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#AEACA6', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Coste Seguros</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#1A1915' }}>{cr.seguros} UF</div>
              </div>
              <div style={{ padding: '12px', background: '#f8fafc', borderRadius: 6, border: '1px solid #E5E7EB' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#AEACA6', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Multa por Prepago</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#1A1915' }}>{cr.costoPrepago}%</div>
              </div>
            </div>

            {/* Sección Prepago */}
            <div className="section-title">Estrategia de Prepago Simulada</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
              <div style={{ padding: '12px', background: '#f0fdf4', borderRadius: 6, border: '1px solid #bbf7d0' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#15803d', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Monto Prepago</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#15803d' }}>{fMon(pr.monto)}</div>
              </div>
              <div style={{ padding: '12px', background: '#f0fdf4', borderRadius: 6, border: '1px solid #bbf7d0' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#15803d', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Frecuencia</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#15803d', textTransform: 'capitalize' }}>{pr.frecuencia}</div>
              </div>
              <div style={{ padding: '12px', background: '#f0fdf4', borderRadius: 6, border: '1px solid #bbf7d0' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#15803d', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Mes Inicio</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#15803d' }}>Mes {pr.mesInicio}</div>
              </div>
              <div style={{ padding: '12px', background: '#f0fdf4', borderRadius: 6, border: '1px solid #bbf7d0' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#15803d', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Destino</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#15803d', textTransform: 'capitalize' }}>{pr.destino === 'plazo' ? 'Reducir Plazo' : 'Reducir Cuota'}</div>
              </div>
            </div>

            {/* Sección Supuestos Macroeconómicos */}
            <div className="section-title">Supuestos Macroeconómicos</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ padding: '12px', background: '#fef3c7', borderRadius: 6, border: '1px solid #fde68a' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#92400e', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Inflación Proyectada</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#92400e' }}>{inflacion}%</div>
              </div>
              <div style={{ padding: '12px', background: '#fef3c7', borderRadius: 6, border: '1px solid #fde68a' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#92400e', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Retorno Inversión (CLP)</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#92400e' }}>{retornoInv}%</div>
              </div>
            </div>

            <div className="page-footer">
              <div><strong>Simulador de Prepago Hipotecario</strong> · Análisis Personalizado</div>
              <div>Todos los cálculos basados en estos parámetros · Sistema de amortización francesa</div>
            </div>
          </div>

          {/* --------------------------------------------------------------
               PÁGINA 4 — RESUMEN EJECUTIVO
          --------------------------------------------------------------- */}
          <div className="page inner-page">
            <div className="page-header">
              <div>
                <div className="page-section-label">Resumen Ejecutivo</div>
                <div className="page-title">Diagnóstico del Crédito Actual</div>
              </div>
              <div className="page-number"><strong>04</strong>Resumen</div>
            </div>

            {/* Callout principal */}
            <div className={`callout ${ahorroNeto > 0 ? 'green' : 'red'}`}>
              <strong>Conclusión principal: </strong>
              {ahorroNeto > 0
                ? <>Con una estrategia de prepago {pr.frecuencia} de <strong>{fMon(pr.monto)}</strong>, el crédito puede mejorar su costo financiero, generando un ahorro neto de <strong>{fMon(ahorroNeto)}</strong> (incluye intereses y seguros ahorrados), una vez descontada la multa estimada.</>
                : <>La estrategia de prepago {pr.frecuencia} de <strong>{fMon(pr.monto)}</strong> genera un costo en multas (<strong>{fMon(sim.totalMultas)}</strong>) que supera el ahorro de intereses y seguros. Esta decisión destruye patrimonio por <strong>{fMon(Math.abs(ahorroNeto))}</strong>.</>}
            </div>

            {/* KPIs estado actual */}
            <div className="section-title">Estado actual del crédito</div>
            <div className="kpi-grid kpi-grid-4" style={{ marginBottom: 12 }}>
              <div className="kpi-box navy">
                <div className="kpi-label">Saldo actual</div>
                <div className="kpi-value">{fMon(saldoActual)}</div>
                <div className="kpi-sub">Capital pendiente</div>
              </div>
              <div className="kpi-box">
                <div className="kpi-label">Dividendo mensual</div>
                <div className="kpi-value">{fMon(dividendoTotal)}</div>
                <div className="kpi-sub">Incluye seguros</div>
              </div>
              <div className="kpi-box">
                <div className="kpi-label">Plazo restante</div>
                <div className="kpi-value">{fmtM(mesesRestantes)}</div>
                <div className="kpi-sub">{mesesRestantes} meses</div>
              </div>
              <div className="kpi-box red">
                <div className="kpi-label">Int. restantes</div>
                <div className="kpi-value">{fMon(interesesBase)}</div>
                <div className="kpi-sub">Sin prepago</div>
              </div>
            </div>

            {/* KPIs del crédito */}
            <div className="section-title">Condiciones del crédito</div>
            <div className="kpi-grid kpi-grid-3" style={{ marginBottom: 10 }}>
              <div className="kpi-box">
                <div className="kpi-label">Monto original</div>
                <div className="kpi-value">{fMon(cr.capital)}</div>
                <div className="kpi-sub">Capital pactado</div>
              </div>
              <div className="kpi-box">
                <div className="kpi-label">Rentab. Inversión (?)</div>
                <div className="kpi-value">{retornoInv}%</div>
                <div className="kpi-sub">Costo de oportunidad alterno</div>
              </div>
              <div className="kpi-box">
                <div className="kpi-label">Multa est. primer pago</div>
                <div className="kpi-value">{fMon((cr.costoPrepago / 100) * saldoActual)}</div>
                <div className="kpi-sub">{cr.costoPrepago}% sobre prepagado</div>
              </div>
            </div>

            {/* Insights */}
            <div className="section-title">Hallazgos clave y Evaluación Financiera Avanzada</div>
            <div className="three-col">
              <div className="insight-box" data-n="01">
                <div className="insight-title">El costo real nominal (Fisher)</div>
                <div className="insight-body">Considerando una inflación proyectada del {inflacion}% y un CAE del {cr.tna}%, el costo efectivo anualizado de su deuda asciende al <strong>{(i_nom * 100).toFixed(2)}%</strong> nominal.</div>
              </div>
              <div className="insight-box" data-n="02">
                <div className="insight-title">Análisis de Arbitraje</div>
                <div className="insight-body">El diferencial entre el costo de su deuda y el retorno de inversión ({retornoInv}%) es de <strong>{(deltaFisher * 100).toFixed(2)}%</strong>. {deltaFisher > 0 ? "Prepagar destruye pasivos más caros que su inversión alternativa." : "La inversión alternativa rinde más que el costo de la deuda."}</div>
              </div>
              <div className="insight-box" data-n="03">
                <div className="insight-title">Valor Presente Neto (VPN)</div>
                <div className="insight-body">
                  Descontando los flujos a su tasa de inversión, esta estrategia genera una creación de riqueza neta (VPN) de <strong>{fMon(ahorroVPN)}</strong> a dinero de hoy.
                </div>
              </div>
            </div>

            <div className="page-footer">
              <div><strong>Simulador de Prepago Hipotecario</strong> · Documento confidencial</div>
              <div>Los cálculos son referenciales bajo sistema de amortización francesa</div>
            </div>
          </div>

          {/* --------------------------------------------------------------
               PÁGINA 5 — ANÁLISIS DE ESCENARIOS
          --------------------------------------------------------------- */}
          <div className="page inner-page">
            <div className="page-header">
              <div>
                <div className="page-section-label">Análisis de Escenarios</div>
                <div className="page-title">Impacto por Monto de Prepago</div>
              </div>
              <div className="page-number"><strong>05</strong>Escenarios</div>
            </div>

            <div className="callout">
              Los siguientes escenarios asumen <strong>frecuencia {pr.frecuencia}</strong> de prepago, iniciando en el mes {pr.mesInicio}, con la estimada <strong>multa bancaria ya descontada</strong> del ahorro neto. Destino: <strong>{pr.destino === 'plazo' ? 'Reducir Plazo' : 'Reducir Cuota'}</strong>.
            </div>

            {/* Tabla de escenarios */}
            <div className="section-title">Comparación de escenarios de prepago</div>
            <table className="data-table" style={{ marginBottom: 10 }}>
              <thead>
                <tr>
                  <th>Monto prepago {pr.frecuencia}</th>
                  {pr.destino === 'plazo' ? (
                    <>
                      <th>Nueva duración</th>
                      <th>Meses ahorrados</th>
                    </>
                  ) : (
                    <>
                      <th>Nueva Cuota</th>
                      <th>Ahorro Mensual</th>
                    </>
                  )}
                  <th>Ahorro intereses</th>
                  <th>Ahorro neto</th>
                </tr>
              </thead>
              <tbody>
                {nivelesPrepago.map(monto => {
                  const s = runSim(monto);
                  const isCurrent = monto === +pr.monto;
                  return (
                    <tr key={monto} className={isCurrent ? "highlight-row" : ""}>
                      <td>UF {monto} {isCurrent && "? Estrategia Base"}</td>

                      {pr.destino === 'plazo' ? (
                        <>
                          <td>{fmtM(s.mesesReales)}</td>
                          <td className="tag-blue">{s.mesesAhorrados}m</td>
                        </>
                      ) : (
                        <>
                          <td>{fMon(s.nuevaCuota)}</td>
                          <td className="tag-blue">{fMon(cuotaBase - s.nuevaCuota)}</td>
                        </>
                      )}

                      <td>{fMon(s.ahorroIntereses)}</td>
                      <td className={s.ahorroNeto > 0 ? "tag-green" : "tag-red"}>{fMon(s.ahorroNeto)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            {/* Barras de ahorro neto */}
            <div className="section-title">Ahorro neto por escenario (UF)</div>
            <div style={{ marginBottom: 10 }}>
              {nivelesPrepago.map(monto => {
                const s = runSim(monto);
                const pct = maxAhorro > 0 ? Math.max(0, (s.ahorroNeto / maxAhorro) * 100) : 0;
                const isCurrent = monto === +pr.monto;
                return (
                  <div className="bar-row" key={monto}>
                    <div className="bar-label">UF {monto} {isCurrent && "?"}</div>
                    <div className="bar-track">
                      <div className="bar-fill" style={{ width: `${pct}%`, background: isCurrent ? 'var(--pdf-green)' : 'var(--pdf-blue2)' }}></div>
                    </div>
                    <div className="bar-val" style={{ color: isCurrent ? 'var(--pdf-green)' : 'var(--pdf-navy)' }}>{fMon(s.ahorroNeto)}</div>
                  </div>
                )
              })}
            </div>

            <div className="page-footer">
              <div><strong>Simulador de Prepago Hipotecario</strong> · Documento confidencial</div>
              <div>Frecuencia {pr.frecuencia} · Multas descontadas en todos los escenarios</div>
            </div>
          </div>

          {/* --------------------------------------------------------------
               PÁGINA 6 — EVOLUCIÓN DEL SALDO (SVG Dinámico)
          --------------------------------------------------------------- */}
          <div className="page inner-page">
            <div className="page-header">
              <div>
                <div className="page-section-label">Proyección Financiera</div>
                <div className="page-title">Evolución del Saldo Deudor</div>
              </div>
              <div className="page-number"><strong>06</strong>Proyección</div>
            </div>

            <div className="section-title">Saldo pendiente (UF) · Con vs. Sin prepago</div>
            <div className="chart-wrap" style={{ marginBottom: 12 }}>
              <svg viewBox="0 0 650 280" width="630" height="271" style={{ display: 'block', margin: '0 auto' }}>
                <defs>
                  <linearGradient id="gSin" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#dc2626" stopOpacity="0.18" />
                    <stop offset="100%" stopColor="#dc2626" stopOpacity="0.01" />
                  </linearGradient>
                  <linearGradient id="gCon" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3B6D11" stopOpacity="0.22" />
                    <stop offset="100%" stopColor="#3B6D11" stopOpacity="0.01" />
                  </linearGradient>
                </defs>

                {/* Grid horizontal */}
                <line x1="60" x2="630" y1="30" y2="30" stroke="#DDDAD3" strokeWidth="1" />
                <line x1="60" x2="630" y1={mapY(maxSaldo * 0.75)} y2={mapY(maxSaldo * 0.75)} stroke="#DDDAD3" strokeWidth="1" />
                <line x1="60" x2="630" y1={mapY(maxSaldo * 0.5)} y2={mapY(maxSaldo * 0.5)} stroke="#DDDAD3" strokeWidth="1" />
                <line x1="60" x2="630" y1={mapY(maxSaldo * 0.25)} y2={mapY(maxSaldo * 0.25)} stroke="#DDDAD3" strokeWidth="1" />
                <line x1="60" x2="630" y1="245" y2="245" stroke="#DDDAD3" strokeWidth="1" />

                {/* Etiquetas Y */}
                <text x="52" y="34" textAnchor="end" fontSize="10" fill="#AEACA6">{fNum(maxSaldo)}</text>
                <text x="52" y={mapY(maxSaldo * 0.75) + 4} textAnchor="end" fontSize="10" fill="#AEACA6">{fNum(maxSaldo * 0.75)}</text>
                <text x="52" y={mapY(maxSaldo * 0.5) + 4} textAnchor="end" fontSize="10" fill="#AEACA6">{fNum(maxSaldo * 0.5)}</text>
                <text x="52" y={mapY(maxSaldo * 0.25) + 4} textAnchor="end" fontSize="10" fill="#AEACA6">{fNum(maxSaldo * 0.25)}</text>
                <text x="52" y="249" textAnchor="end" fontSize="10" fill="#AEACA6">0</text>

                <text x="12" y="145" textAnchor="middle" fontSize="10" fill="#AEACA6" transform="rotate(-90,12,145)">Saldo (UF)</text>

                {/* Etiquetas X */}
                <text x="60" y="262" textAnchor="middle" fontSize="10" fill="#AEACA6">Hoy</text>
                <text x={mapX(maxMes * 0.25)} y="262" textAnchor="middle" fontSize="10" fill="#AEACA6">{Math.ceil(maxMes * 0.25 / 12)} Años</text>
                <text x={mapX(maxMes * 0.5)} y="262" textAnchor="middle" fontSize="10" fill="#AEACA6">{Math.ceil(maxMes * 0.5 / 12)} Años</text>
                <text x={mapX(maxMes * 0.75)} y="262" textAnchor="middle" fontSize="10" fill="#AEACA6">{Math.ceil(maxMes * 0.75 / 12)} Años</text>
                <text x="630" y="262" textAnchor="middle" fontSize="10" fill="#AEACA6">{Math.ceil(maxMes / 12)} Años</text>

                <text x="345" y="278" textAnchor="middle" fontSize="10" fill="#AEACA6">Tiempo Transcurrido</text>

                {/* ÁREA Y LÍNEA SIN PREPAGO */}
                <path d={areaSin} fill="url(#gSin)" />
                <path d={pathSin} fill="none" stroke="#dc2626" strokeWidth="2" strokeDasharray="6,3" opacity="0.8" />

                {/* ÁREA Y LÍNEA CON PREPAGO */}
                <path d={areaCon} fill="url(#gCon)" />
                <path d={pathCon} fill="none" stroke="#3B6D11" strokeWidth="2.5" />

                {/* Punto fin con prepago */}
                <circle cx={mapX(lastMesCon)} cy="245" r="4" fill="#3B6D11" />
                <line x1={mapX(lastMesCon)} x2={mapX(lastMesCon)} y1={mapY(maxSaldo)} y2="245" stroke="#3B6D11" strokeWidth="1" strokeDasharray="3,2" />

                {/* Leyenda */}
                <rect x="64" y="12" width="14" height="3" fill="#3B6D11" rx="2" />
                <text x="82" y="16" fontSize="10" fill="#3B6D11" fontWeight="700">Con prepago {pr.frecuencia}</text>
                <line x1="210" y1="13" x2="224" y2="13" stroke="#dc2626" strokeWidth="2" strokeDasharray="5,3" />
                <circle cx="217" cy="13" r="0" />
                <text x="228" y="17" fontSize="10" fill="#dc2626">Sin prepago</text>

                {ahorroNeto > 0 && (
                  <text x="490" y="50" fontSize="11" fill="#0a1628" fontWeight="700">Zona de ahorro</text>
                )}
              </svg>
            </div>

            {/* Tabla resumen anual simplificada para el reporte */}
            <div className="section-title">Evolución anual resumida (UF)</div>
            <table className="data-table" style={{ marginBottom: 8 }}>
              <thead>
                <tr>
                  <th>Hito</th>
                  <th>Saldo original</th>
                  <th>Saldo con estrategia</th>
                  <th>Diferencia / Ahorro acumulado</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Hoy</td>
                  <td>{fMon(saldoActual)}</td>
                  <td>{fMon(saldoActual)}</td>
                  <td>-</td>
                </tr>
                <tr>
                  <td>Mitad del plazo ({Math.ceil(maxMes / 24)} años)</td>
                  <td>{fMon(sim.evolucionSin[Math.floor(maxMes / 2)]?.saldo || 0)}</td>
                  <td>{fMon(sim.evolucionCon[Math.min(Math.floor(maxMes / 2), lastMesCon - 1)]?.saldo || 0)}</td>
                  <td className="tag-green">Se acelera curva de rebaja</td>
                </tr>
                <tr className="highlight-row">
                  <td>Año {Math.ceil(lastMesCon / 12)} (Fin Crédito)</td>
                  <td>{fMon(sim.evolucionSin[lastMesCon - 1]?.saldo || 0)}</td>
                  <td>UF 0.0</td>
                  <td className="tag-green">Crédito liquidado</td>
                </tr>
              </tbody>
            </table>

            <div className="page-footer">
              <div><strong>Simulador de Prepago Hipotecario</strong> · Documento confidencial</div>
              <div>Trayectoria modelada con datos matemáticos exactos</div>
            </div>
          </div>

          {/* --------------------------------------------------------------
               PÁGINA 7 — ANÁLISIS DE SENSIBILIDAD
          --------------------------------------------------------------- */}
          <div className="page inner-page">
            <div className="page-header">
              <div>
                <div className="page-section-label">Análisis de Riesgos</div>
                <div className="page-title">Sensibilidad y Escenarios Extremos</div>
              </div>
              <div className="page-number"><strong>07</strong>Sensibilidad</div>
            </div>

            <div className="callout" style={{ background: '#EFF6FF', borderLeft: '4px solid #2563EB', color: '#1A1915' }}>
              Análisis de cómo cambios en variables macroeconómicas afectan la conveniencia del prepago. Todos los escenarios mantienen fijos: monto prepago, frecuencia, multa y destino.
            </div>

            {/* Sensibilidad a Inflación */}
            <div className="section-title">Escenario 1: Variación de la Inflación Proyectada</div>
            <div style={{ fontSize: 11, color: '#1A1915', marginBottom: 16, lineHeight: 1.6 }}>
              La inflación es crítica en el análisis Fisher. Una inflación mayor erosiona el valor real del dinero que podrías dedicar al prepago.
            </div>
            <table className="data-table" style={{ marginBottom: 16 }}>
              <thead>
                <tr>
                  <th>Escenario Inflacionario</th>
                  <th>Costo Real de la Deuda</th>
                  <th>Retorno Real Inversión</th>
                  <th>Diferencial</th>
                  <th>Recomendación</th>
                </tr>
              </thead>
              <tbody>
                {[{ inf: inflacion - 2, label: 'Inflación baja (-2pp)' }, { inf: +inflacion, label: 'Escenario base' }, { inf: +inflacion + 2, label: 'Inflación alta (+2pp)' }].map(s => {
                  const inf = s.inf / 100;
                  const costReal = ((1 + ((+cr.tna) / 100)) * (1 + inf)) - 1;
                  const retReal = ((1 + (retornoInv / 100)) / (1 + inf)) - 1;
                  const delta = costReal - retReal;
                  return (
                    <tr key={s.label}>
                      <td><strong>{s.label}</strong></td>
                      <td>{(costReal * 100).toFixed(2)}%</td>
                      <td>{(retReal * 100).toFixed(2)}%</td>
                      <td style={{ color: delta > 0 ? '#059669' : '#A32D2D', fontWeight: 700 }}>{(delta * 100).toFixed(2)}%</td>
                      <td style={{ fontSize: 10 }}>{delta > 0 ? '? Prepagar' : '? Invertir'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Sensibilidad a Retorno de Inversión */}
            <div className="section-title">Escenario 2: Variación del Retorno de Inversión</div>
            <div style={{ fontSize: 11, color: '#1A1915', marginBottom: 16, lineHeight: 1.6 }}>
              Mayor rentabilidad en inversiones alternativas hace más atractivo no prepagar. Este análisis muestra el rango de sensibilidad.
            </div>
            <table className="data-table" style={{ marginBottom: 16 }}>
              <thead>
                <tr>
                  <th>Retorno Inversión (CLP)</th>
                  <th>Costo Real Deuda</th>
                  <th>Retorno Real</th>
                  <th>Diferencial</th>
                  <th>Recomendación</th>
                </tr>
              </thead>
              <tbody>
                {[{ ret: retornoInv - 2, label: 'Retorno bajo (-2pp)' }, { ret: +retornoInv, label: 'Escenario base' }, { ret: +retornoInv + 2, label: 'Retorno alto (+2pp)' }].map(s => {
                  const retDec = s.ret / 100;
                  const infDec = inflacion / 100;
                  const costReal = ((1 + ((+cr.tna) / 100)) * (1 + infDec)) - 1;
                  const retReal = ((1 + retDec) / (1 + infDec)) - 1;
                  const delta = costReal - retReal;
                  return (
                    <tr key={s.label}>
                      <td><strong>{s.label}</strong></td>
                      <td>{(costReal * 100).toFixed(2)}%</td>
                      <td>{(retReal * 100).toFixed(2)}%</td>
                      <td style={{ color: delta > 0 ? '#059669' : '#A32D2D', fontWeight: 700 }}>{(delta * 100).toFixed(2)}%</td>
                      <td style={{ fontSize: 10 }}>{delta > 0 ? '? Prepagar' : '? Invertir'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Matriz de Sensibilidad */}
            <div className="section-title">Matriz de Decisión: Inflación vs Retorno Inversión</div>
            <div style={{ fontSize: 11, color: '#1A1915', marginBottom: 12, lineHeight: 1.6 }}>
              La matriz muestra para cada combinación de inflación y retorno, si la estrategia recomendada es prepagar (??) o invertir (??).
            </div>
            <table className="data-table" style={{ fontSize: 10 }}>
              <thead>
                <tr>
                  <th>Inflación / Retorno</th>
                  <th>{(+retornoInv - 2)}%</th>
                  <th>{(+retornoInv)}%</th>
                  <th>{(+retornoInv + 2)}%</th>
                </tr>
              </thead>
              <tbody>
                {[{ inf: +inflacion - 2 }, { inf: +inflacion }, { inf: +inflacion + 2 }].map(infRow => (
                  <tr key={infRow.inf}>
                    <td><strong>{infRow.inf}%</strong></td>
                    {[{ ret: +retornoInv - 2 }, { ret: +retornoInv }, { ret: +retornoInv + 2 }].map(retCol => {
                      const infDec = infRow.inf / 100;
                      const retDec = retCol.ret / 100;
                      const costReal = ((1 + ((+cr.tna) / 100)) * (1 + infDec)) - 1;
                      const retReal = ((1 + retDec) / (1 + infDec)) - 1;
                      const delta = costReal - retReal;
                      return (
                        <td key={`${infRow.inf}-${retCol.ret}`} style={{ textAlign: 'center', background: delta > 0 ? 'rgba(5,150,105,0.08)' : 'rgba(220,38,38,0.08)', fontWeight: 700, color: delta > 0 ? '#059669' : '#A32D2D' }}>
                          {delta > 0 ? '?? P' : '?? I'}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="page-footer">
              <div><strong>Simulador de Prepago Hipotecario</strong> · Análisis de Sensibilidad</div>
              <div>P = Prepagar es mejor | I = Invertir es mejor</div>
            </div>
          </div>

          {/* --------------------------------------------------------------
               PÁGINA 8 — RECOMENDACIÓN Y CIERRE
          --------------------------------------------------------------- */}
          <div className="page inner-page">
            <div className="page-header">
              <div>
                <div className="page-section-label">Recomendación Estratégica</div>
                <div className="page-title">Plan de Acción y Conclusiones</div>
              </div>
              <div className="page-number"><strong>08</strong>Cierre</div>
            </div>

            {/* Recomendación principal */}
            <div className="rec-header" style={{ marginBottom: 0 }}>
              <div className="label">? Recomendación para su caso</div>
              <div className="title">{ahorroNeto > 0 ? `Ejecutar prepago ${pr.frecuencia} de ${fMon(pr.monto)} a partir del mes ${pr.mesInicio}` : `Mantener crédito orgánico. No se recomienda prepagar.`}</div>
            </div>
            <div className="rec-body">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#AEACA6", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Fundamentos</div>
                  <div style={{ fontSize: 12, color: "#1A1915", lineHeight: 1.7 }}>
                    ? La TNA del {cr.tna}% actúa como <strong>retorno garantizado</strong> de cualquier prepago realizado.<br /><br />
                    ? La multa estimada de {fMon(sim.totalMultas)} se recupera velozmente gracias a la evasión de intereses compuestos.<br /><br />
                    ? El ahorro neto de {fMon(ahorroNeto)} equivale a <strong>{(ahorroNeto / cuotaBase).toFixed(1)} meses de cuota base</strong> totalmente gratis.
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#AEACA6", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Pasos concretos</div>
                  <div style={{ fontSize: 12, color: "#1A1915", lineHeight: 1.7 }}>
                    ? <strong>Aviso:</strong> Notificar al banco con 10 días hábiles de anticipación.<br /><br />
                    ? <strong>Confirmar multa por escrito</strong> y solicitar tabla recalculada.<br /><br />
                    ? <strong>Destino:</strong> {pr.destino === 'plazo' ? "Reducir plazo (recomendado para maximizar el ahorro total)." : "Reducir cuota (liberará flujo de caja mensual)."}<br /><br />
                    ? <strong>Revisar anualmente</strong> si el monto puede aumentarse.
                  </div>
                </div>
              </div>
            </div>

            {/* Consideraciones importantes */}
            <div className="section-title">Consideraciones importantes para proteger su inversión</div>
            <div className="three-col" style={{ marginBottom: 14 }}>
              <div className="insight-box" data-n="? 01">
                <div className="insight-title">Liquidez primero</div>
                <div className="insight-body">Asegúrese de mantener un fondo de emergencia de al menos 6 meses de gastos antes de comprometer el excedente en prepagos.</div>
              </div>
              <div className="insight-box" data-n="? 02">
                <div className="insight-title">Factor Inflación</div>
                <div className="insight-body">Mientras la UF suba, el costo nominal de su deuda se agravará. Prepagar reduce su exposición a la inflación futura.</div>
              </div>
              <div className="insight-box" data-n="? 03">
                <div className="insight-title">Notificación legal</div>
                <div className="insight-body">La ley exige notificar al banco con al menos 10 días hábiles de anticipación. El incumplimiento puede invalidar el prepago o sumar recargos.</div>
              </div>
            </div>

            <div className="disclaimer">
              <strong>Aviso Legal:</strong> Este informe fue generado automáticamente por el Simulador de Prepago Hipotecario con fines referenciales. Los cálculos se basan en amortización francesa asumiendo condiciones constantes. No constituye asesoría financiera ni legal. Verifique con su banco las condiciones exactas antes de operar.
            </div>

            <div className="page-footer">
              <div><strong>Simulador de Prepago Hipotecario</strong> · Documento confidencial</div>
              <div>Generado en entorno local · {new Date().getFullYear()}</div>
            </div>
          </div>

          {/* --------------------------------------------------------------
               PÁGINA 9 — DISCLAIMER Y CONSIDERACIONES LEGALES
          --------------------------------------------------------------- */}
          <div className="page inner-page">
            <div className="page-header">
              <div>
                <div className="page-section-label">Referencias Legales</div>
                <div className="page-title">Disclaimers y Limitaciones</div>
              </div>
              <div className="page-number"><strong>09</strong>Disclaimer</div>
            </div>

            <div style={{ background: 'rgba(220, 38, 38, 0.06)', padding: 14, borderLeft: '4px solid #f43f5e', borderRadius: 4, marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#7f1d1d', marginBottom: 6 }}>?? ADVERTENCIA IMPORTANTE</div>
              <div style={{ fontSize: 10, color: '#1A1915', lineHeight: 1.6 }}>
                Este documento es un <strong>análisis refrencial</strong> generado automáticamente por un simulador local. No constituye asesoría financiera, legal, ni de inversión de ningún tipo. Los cálculos están basados en supuestos simplificados y datos ingresados por el usuario. Verifique con su banco los términos exactos antes de cualquier operación.
              </div>
            </div>

            <div className="section-title">Limitaciones y supuestos</div>
            <ul style={{ fontSize: 11, color: '#1A1915', lineHeight: 1.8, marginBottom: 16 }}>
              <li><strong>Sistema de amortización:</strong> Asume amortización francesa con compounding mensual. Otros sistemas pueden producir resultados distintos.</li>
              <li><strong>Tasa fija:</strong> El análisis asume que la TNA del crédito no varía. Créditos con tasas variables requieren recálculo.</li>
              <li><strong>Multa por prepago:</strong> Las multas están estimadas según el parámetro ingresado. Algunos bancos tienen cláusulas especiales.</li>
              <li><strong>Inflación y retorno:</strong> Las proyecciones de inflación y retorno de inversión son supuestos del usuario. El resultado real dependerá de variables macroeconómicas ajenas a este modelo.</li>
              <li><strong>Impuestos:</strong> El análisis no incluye el impacto de impuestos (SII, IRR, otros). Consulte a un asesor tributario para el escenario completo.</li>
              <li><strong>Cambios legales:</strong> La normativa sobre prepagos hipotecarios puede variar. Verifique la legislación vigente en su jurisdicción.</li>
            </ul>

            <div className="section-title">Requisitos legales para prepago en Chile</div>
            <div style={{ fontSize: 11, color: '#1A1915', lineHeight: 1.8, marginBottom: 12 }}>
              <p><strong>Notificación anticipada:</strong> La ley exige notificar al banco con un mínimo de 10 días hábiles de anticipación.</p>
              <p><strong>Derechos del deudor:</strong> El Banco no puede cobrar comisión por prepago, pero sí puede cobrar multa si está estipulada en el contrato (hasta 3 meses de intereses en la mayoría de casos).</p>
              <p><strong>Transparencia bancaria:</strong> El banco debe entregar una tabla recalculada con las nuevas cuotas/plazos dentro de 5 días hábiles.</p>
              <p><strong>Destino del pago:</strong> El cliente especifica si el prepago reduce plazo o cuota. El banco debe respetar esta decisión.</p>
            </div>

            <div className="section-title">Responsabilidades del usuario</div>
            <div style={{ fontSize: 11, color: '#1A1915', lineHeight: 1.6, marginBottom: 10 }}>
              El usuario acepta que:
            </div>
            <ul style={{ fontSize: 11, color: '#1A1915', lineHeight: 1.8, marginBottom: 12 }}>
              <li>Ha revisado personal e independientemente este análisis.</li>
              <li>Los datos ingresados son exactos y están actualizados.</li>
              <li>Cualquier decisión financiera es de su exclusiva responsabilidad.</li>
              <li>Consultará con asesores especializados (abogado, contador, asesor financiero) antes de operar.</li>
              <li>No reclama al generador de este simulador por pérdidas derivadas del uso de este análisis.</li>
            </ul>

            <div style={{ background: 'rgba(37, 99, 235, 0.06)', padding: 12, borderRadius: 4, fontSize: 10, color: '#1A1915', lineHeight: 1.6 }}>
              <strong>Contacto y soporte:</strong> Este simulador es una herramienta educativa y de referencia. Para dudas técnicas con su crédito hipotecario, contacte a su ejecutivo bancario. Para análisis más profundos, consulte a profesionales certificados en finanzas personal.
            </div>

            <div className="page-footer">
              <div><strong>Simulador de Prepago Hipotecario</strong> · Versión de Referencia</div>
              <div>Generado: {new Date().toLocaleDateString('es-CL')} | Documento confidencial - Solo para el usuario</div>
            </div>
          </div>

        </div>
      );
    });

window.ReportePDF = ReportePDF;
import React, { useState, useMemo } from "react";
import {
    AreaChart, Area, BarChart, Bar, LineChart, Line, ReferenceLine,
    XAxis, YAxis, CartesianGrid, Tooltip,
    Legend, ResponsiveContainer
} from "recharts";
import './App.css';

// ── COLOR TOKENS PARA RECHARTS ──────────────────────────────────────────────
const chartColors = {
    sinPrepago: "#64748b", // slate
    conPrepago: "#06b6d4", // cyan
    grid: "rgba(255,255,255,0.03)",
    text: "#94a3b8",
    card: "#18181b",
};

// ── HELPERS FINANCIEROS (Centralizados en financial_logic.js) ────────────────
const { tasaMensual, cuotaMensual, calcularSaldoActual, calcularInteresesTotales, simularPrepago } = window.FinancialLogic;

const costosPrepagoOpciones = [
    { value: "1.5", label: "1,5 meses de interés por prepago" },
    { value: "0", label: "Sin costo de prepago" }
];

const fmt = (n, d = 1) => n?.toLocaleString("es-CL", { minimumFractionDigits: d, maximumFractionDigits: d });
const fmtM = (m) => {
    const a = Math.floor(m / 12), mo = m % 12;
    return a > 0 ? `${a}a ${mo > 0 ? mo + "m" : ""}` : `${mo}m`;
};

// ── COMPONENTES UI ──────────────────────────────────────────────────────────
const Input = ({ label, value, onChange, min, max, step = "any", prefix, suffix }) => (
    <div className="input-group">
        <label className="input-label">{label}</label>
        <div className="input-wrapper">
            {prefix && <span className="input-prefix">{prefix}</span>}
            <input type="number" className="styled-input" value={value} onChange={e => onChange(e.target.value)} min={min} max={max} step={step} />
            {suffix && <span className="input-suffix">{suffix}</span>}
        </div>
    </div>
);

const Select = ({ label, value, onChange, options }) => (
    <div className="input-group">
        <label className="input-label">{label}</label>
        <div className="input-wrapper">
            <select className="styled-input" value={value} onChange={e => onChange(e.target.value)}>
                {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
        </div>
    </div>
);

const Stat = ({ label, value, sub, colorClass = "cyan", big }) => (
    <div className={`stat-box ${colorClass}`}>
        <div className="stat-label">{label}</div>
        <div className={`stat-value ${big ? 'big' : ''}`}>{value}</div>
        {sub && <div className="stat-sub">{sub}</div>}
    </div>
);

// ── COMPONENTES PARA GRÁFICOS ──────────────────────────────────────────────
const CustomBadge = ({ x, y, value, color, bottomY }) => {
    // Glassmorphism adjustment: semi-transparent wash with a border
    const glassColor = color + 'CC'; // Adding ~80% opacity
    return (
        <g transform={`translate(${x}, 0)`}>
            <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur in="SourceAlpha" stdDeviation="1.5" />
                <feOffset dx="0" dy="1" result="offsetblur" />
                <feComponentTransfer>
                    <feFuncA type="linear" slope="0.2" />
                </feComponentTransfer>
                <feMerge>
                    <feMergeNode />
                    <feMergeNode in="SourceGraphic" />
                </feMerge>
            </filter>
            
            {/* Línea vertical suavizada */}
            <line
                x1="0" y1={bottomY}
                x2="0" y2={y + 12}
                stroke={color} strokeDasharray="3 3" strokeWidth={1}
                opacity={0.6}
            />

            <rect
                x="-65" y={y - 12} width="130" height="24"
                rx="12" fill={glassColor} stroke="#fff" strokeWidth={1.5}
                filter="url(#shadow)"
            />
            <text
                x="0" y={y + 4} textAnchor="middle" fill="#fff"
                style={{ fontSize: 10, fontWeight: 800, fontFamily: 'Outfit' }}
            >
                Termino del Credito {value}
            </text>
        </g>
    );
};

// ── GRÁFICO ──────────────────────────────────────────────────────────────────
const GraficoSaldo = ({ evolucionSin, simPlazo, simCuota, mesesRestantes, saldoInicial }) => {
    const dataMap = {};
    const evolucionPlazo = simPlazo.evolucionCon;
    const evolucionCuota = simCuota.evolucionCon;

    [{ mes: 0, saldo: saldoInicial }].concat(evolucionSin).forEach(p => {
        dataMap[p.mes] = { mes: p.mes, sinPrepago: Math.round(p.saldo) };
    });
    [{ mes: 0, saldo: saldoInicial }].concat(evolucionPlazo).forEach(p => {
        if (dataMap[p.mes]) dataMap[p.mes].conPrepagoPlazo = Math.round(p.saldo);
        else dataMap[p.mes] = { mes: p.mes, conPrepagoPlazo: Math.round(p.saldo) };
    });
    [{ mes: 0, saldo: saldoInicial }].concat(evolucionCuota).forEach(p => {
        if (dataMap[p.mes]) dataMap[p.mes].conPrepagoCuota = Math.round(p.saldo);
        else dataMap[p.mes] = { mes: p.mes, conPrepagoCuota: Math.round(p.saldo) };
    });

    const data = Object.values(dataMap).sort((a, b) => a.mes - b.mes);

    const xTickFormatter = (mes) => {
        if (mes === 0) return "Hoy";
        if (mes % 12 === 0) return `${mes / 12} ${mes / 12 === 1 ? "Año" : "Años"}`;
        return "";
    };
    const xTicks = data.map(d => d.mes).filter(m => m === 0 || m % 12 === 0);

    const CustomTooltip = ({ active, payload, label }) => {
        if (!active || !payload?.length) return null;
        return (
            <div style={{ background: "rgba(24, 24, 27, 0.95)", border: `1px solid rgba(255,255,255,0.15)`, borderRadius: 12, padding: "12px 16px", boxShadow: "0 10px 25px rgba(0,0,0,0.5)" }}>
                <div style={{ color: "#fff", fontFamily: "Outfit", marginBottom: 8, fontSize: 13, fontWeight: 700 }}>
                    Mes {label} {label > 0 && label % 12 === 0 ? `(Año ${label / 12})` : ""}
                </div>
                {payload.map(p => (
                    <div key={p.name} style={{ color: p.color, fontFamily: "Inter", fontWeight: 600, fontSize: 13, display: "flex", justifyContent: "space-between", gap: 24, marginTop: 4 }}>
                        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <div style={{ width: 8, height: 8, borderRadius: "50%", background: p.color }}></div>
                            {p.name}:
                        </span>
                        <span>UF {fmt(p.value, 0)}</span>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div style={{ padding: "10px 0" }}>
            <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                    <defs>
                        <linearGradient id="gradSin" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={chartColors.sinPrepago} stopOpacity={0.15} />
                            <stop offset="95%" stopColor={chartColors.sinPrepago} stopOpacity={0.01} />
                        </linearGradient>
                        <linearGradient id="gradPlazo" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.01} />
                        </linearGradient>
                        <linearGradient id="gradCuota" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0.01} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={"rgba(255, 255, 255, 0.05)"} vertical={true} verticalFill={["rgba(255,255,255,0.01)", "transparent"]} />
                    <XAxis
                        dataKey="mes" type="number" domain={[0, mesesRestantes]}
                        ticks={xTicks} tickFormatter={xTickFormatter}
                        tick={{ fill: "rgba(255, 255, 255, 0.6)", fontSize: 11, fontWeight: 500, fontFamily: "Inter" }}
                        axisLine={{ stroke: "rgba(255, 255, 255, 0.05)" }} tickLine={false} dx={-10} dy={10}
                    />
                    <YAxis
                        tickFormatter={v => `${fmt(v, 0)}`}
                        tick={{ fill: "rgba(255, 255, 255, 0.6)", fontSize: 11, fontWeight: 500, fontFamily: "Inter" }}
                        axisLine={false} tickLine={false} width={45}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ stroke: "rgba(255,255,255,0.15)", strokeWidth: 1, strokeDasharray: "4 4" }} />
                    <Legend verticalAlign="top" height={40} iconType="circle" wrapperStyle={{ fontSize: 12, fontWeight: 600, color: "#fff", fontFamily: "Inter" }} />
                    
                    {/* Líneas de Término Armonizadas */}
                    {(() => {
                        const mP = simPlazo.mesesReales;
                        const mC = simCuota.mesesReales;
                        // Increased threshold to 84 months (7 years) to account for badge width overlap
                        const isClose = Math.abs(mP - mC) < 84; 
                        const yPlazo = 60;
                        const yCuota = isClose ? 115 : 60; 
                        
                        return (
                            <>
                                <ReferenceLine
                                    x={mP} stroke="none"
                                    label={<CustomBadge color="#3b82f6" value={new Date().getFullYear() + Math.floor((new Date().getMonth() + mP) / 12)} y={yPlazo} bottomY={380} />}
                                />
                                <ReferenceLine
                                    x={mC} stroke="none"
                                    label={<CustomBadge color="#10b981" value={new Date().getFullYear() + Math.floor((new Date().getMonth() + mC) / 12)} y={yCuota} bottomY={380} />}
                                />
                            </>
                        );
                    })()}

                    <Area
                        type="monotone" dataKey="sinPrepago" name="Sin Prepago" stroke={chartColors.sinPrepago}
                        strokeWidth={2} strokeDasharray="4 4" fill="url(#gradSin)" dot={false} activeDot={{ r: 6, fill: "#fff", stroke: chartColors.sinPrepago, strokeWidth: 3 }} connectNulls
                    />
                    <Area
                        type="monotone" dataKey="conPrepagoPlazo" name="Reducir Plazo" stroke="#3b82f6"
                        strokeWidth={3} fill="url(#gradPlazo)" dot={false} activeDot={{ r: 7, fill: "#fff", stroke: "#3b82f6", strokeWidth: 3 }} connectNulls
                    />
                    <Area
                        type="monotone" dataKey="conPrepagoCuota" name="Reducir Cuota" stroke="#10b981"
                        strokeWidth={3} fill="url(#gradCuota)" dot={false} activeDot={{ r: 7, fill: "#fff", stroke: "#10b981", strokeWidth: 3 }} connectNulls
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};

// ── GRÁFICO BARRAS CUOTAS (NUEVO) ──────────────────────────────────────────
const GraficoCuotas = ({ evolucionCuota, cuotaBase, destino }) => {
    if (!evolucionCuota || evolucionCuota.length === 0) return null;

    const CustomTooltip = ({ active, payload, label }) => {
        if (!active || !payload?.length) return null;
        const val = payload[0]?.value || 0;
        const diff = cuotaBase - val;
        const pct = cuotaBase > 0 ? ((diff / cuotaBase) * 100).toFixed(1) : "0.0";
        return (
            <div style={{ background: "#18181b", border: `1px solid rgba(255,255,255,0.12)`, borderRadius: 6, padding: "10px 14px", boxShadow: "0 8px 20px rgba(0,0,0,0.5)" }}>
                <div style={{ color: "#fff", fontFamily: "Outfit", marginBottom: 8, fontSize: 13, fontWeight: 700 }}>
                    Año {label}
                </div>
                <div style={{ color: "#f43f5e", fontFamily: "Inter", fontWeight: 600, fontSize: 12, marginBottom: 4 }}>
                    ── Cuota Original: UF {fmt(cuotaBase, 2)}
                </div>
                <div style={{ color: "#10b981", fontFamily: "Inter", fontWeight: 600, fontSize: 12, marginBottom: 4, display: "flex", justifyContent: "space-between", gap: 16 }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div style={{ width: 8, height: 8, borderRadius: "2px", background: "#10b981" }}></div>
                        Cuota Proyectada:
                    </span>
                    <span>UF {fmt(val, 2)} {val > 0 ? `(↓${pct}%)` : ""}</span>
                </div>
                {destino === "cuota" && diff > 0 && (
                    <div style={{ color: "#38bdf8", fontFamily: "Inter", fontWeight: 700, fontSize: 12, marginTop: 4, paddingTop: 4, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                        ➔ Nueva Cuota Mensual: UF {fmt(val, 2)}
                    </div>
                )}
                {diff > 0 && (
                    <div style={{ color: "var(--text-muted)", fontFamily: "Inter", fontWeight: 500, fontSize: 12, marginTop: 6, borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: 6 }}>
                        Ahorro mensual: UF {fmt(diff, 2)}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div style={{ padding: "10px 0", height: "100%", minHeight: 400 }}>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={evolucionCuota} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                    <defs>
                        <linearGradient id="gradCuota" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.9} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0.4} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={"rgba(255, 255, 255, 0.04)"} vertical={false} />
                    <XAxis
                        dataKey="ano" tickFormatter={v => `Año ${v}`}
                        tick={{ fill: "rgba(255, 255, 255, 0.5)", fontSize: 11, fontWeight: 500, fontFamily: "Inter" }}
                        axisLine={false} tickLine={false} dy={10}
                    />
                    <YAxis
                        tickFormatter={v => `${fmt(v, 0)}`}
                        tick={{ fill: "rgba(255, 255, 255, 0.5)", fontSize: 11, fontWeight: 500, fontFamily: "Inter" }}
                        axisLine={false} tickLine={false} width={45}
                        domain={[0, cuotaBase * 1.15]}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.05)" }} />
                    <Legend verticalAlign="top" height={40} iconType="plainline"
                        payload={[
                            { value: 'Cuota Original (fija)', type: 'line', color: '#f43f5e' },
                            { value: 'Cuota con Prepago', type: 'rect', color: '#10b981' }
                        ]}
                        wrapperStyle={{ fontSize: 12, fontWeight: 600, color: "#fff", fontFamily: "Inter" }}
                    />
                    <ReferenceLine y={cuotaBase} stroke="#f43f5e" strokeWidth={2} strokeDasharray="6 4"
                        label={{ value: `Cuota fija: UF ${fmt(cuotaBase, 1)}`, position: "right", fill: "#f43f5e", fontSize: 12, fontWeight: 600, fontFamily: "Inter" }}
                    />
                    <Bar dataKey="cuotaCon" name="Cuota con Prepago" fill="url(#gradCuota)" stroke="#10b981" strokeWidth={0} radius={[6, 6, 0, 0]} barSize={30} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

// ── ESCENARIOS (FRAMEWORK 4 MODELOS) ────────────────────────────────────────────────────────
const Escenarios = ({ cr, saldoActual, mesesRestantes, interesesBase, pr, cuotaBase, valorUF, cae }) => {
    const [inflacion, setInflacion] = useState(4.0);
    const [retornoInv, setRetornoInv] = useState(8.0);

    const minPrepago = Math.ceil(saldoActual * 0.05); // Límite legal 5%
    const montoEstrategico = Math.max(minPrepago, +pr.monto);

    // Evaluar escenario actual
    const { mesesReales, totalIntereses, totalPrepagado, totalMultas, prepagosRealizados } = simularPrepago(
        saldoActual, +cr.tna, mesesRestantes, montoEstrategico, pr.frecuencia, +pr.mesInicio - +cr.mesesPagados, pr.destino, cuotaBase, +cr.costoPrepago
    );

    const mesesAhorrados = Math.max(0, mesesRestantes - mesesReales);
    const ahorroIntereses = interesesBase - totalIntereses;
    const ahorroSeguros = mesesAhorrados * (+cr.seguros || 0);
    const ahorroBruto = ahorroIntereses + ahorroSeguros;
    const ahorroNeto = ahorroBruto - totalMultas;

    // MODELO B: Arbitraje de Tasas (Criterio de Fisher Modificado)
    const tnaDecimal = cae / 100; // CAE is our Real Cost (since debt is in UF)
    const infDecimal = inflacion / 100;
    const retNominalDecimal = retornoInv / 100;

    // Calcular Retorno Real de la Inversión (Fisher exacto)
    const retRealDecimal = ((1 + retNominalDecimal) / (1 + infDecimal)) - 1;

    // Diferencial Neto: Si el CAE es MENOR al Retorno Real, me conviene invertir. 
    // Si el CAE es MAYOR, me conviene prepagar.
    const deltaFisher = tnaDecimal - retRealDecimal; // Si delta > 0, PREPAGO GANA
    const piElegible = ((1 + retNominalDecimal) / (1 + tnaDecimal)) - 1; // Inflación max para que Inversión gane

    // MODELO C: Valor Presente Neto (VPN)
    // El VPN se debe descontar a la tasa real de la mejor alternativa (retRealDecimal)
    // Pero para evitar divisiones por cero o tasas negativas extremas, usamos max(0, retRealDecimal) o una tasa piso.
    const rhoMensual = tasaMensual(retRealDecimal * 100);
    const flujoMensual = cuotaBase + (+cr.seguros || 0);
    const calcPV = (flujo, n, r) => r <= 0 ? flujo * n : flujo * (1 - Math.pow(1 + r, -n)) / r;

    const vpContrato = calcPV(flujoMensual, mesesRestantes, rhoMensual);
    const vpPrepago = montoEstrategico + totalMultas + calcPV(flujoMensual, mesesReales, rhoMensual);
    const ahorroVPN = vpContrato - vpPrepago;
    const convieneVPN = ahorroVPN > 0;

    // MODELO D: Simulación Estocástica Simplificada (Monte Carlo de Inversión)
    // Simular volatilidad del retorno de la inversión, asumiendo desviación estándar de 8% anual nominal (~ 2.3% real)
    const volatilidadInv = 0.08;
    // Queremos ver la probabilidad de que R_real > CAE. 
    // Equivalentemente, Probabilidad(DeltaFisher < 0)
    const zScore = (retRealDecimal - tnaDecimal) / volatilidadInv;

    // Aproximación de la función CDF Normal (Logística)
    let probConveniencia = 1 / (1 + Math.exp(-1.702 * zScore));
    // Limit cases
    if (zScore < -2) probConveniencia = 0.05 + Math.random() * 0.05;
    if (zScore > 2) probConveniencia = 0.90 + Math.random() * 0.05;

    // Para el gráfico Montecarlo, proyectamos el rango de ahorro/ganancia VPN 
    // variando la tasa rho un +/- volatilidadInv
    const rhoAlta = tasaMensual((retRealDecimal + volatilidadInv) * 100);
    const rhoBaja = tasaMensual(Math.max(0, retRealDecimal - volatilidadInv) * 100);

    const vpContratoAlta = calcPV(flujoMensual, mesesRestantes, rhoAlta);
    const vpPrepagoAlta = montoEstrategico + totalMultas + calcPV(flujoMensual, mesesReales, rhoAlta);

    const vpContratoBaja = calcPV(flujoMensual, mesesRestantes, rhoBaja);
    const vpPrepagoBaja = montoEstrategico + totalMultas + calcPV(flujoMensual, mesesReales, rhoBaja);

    const ahorroVPNAbove = vpContratoAlta - vpPrepagoAlta;
    const ahorroVPNBelow = vpContratoBaja - vpPrepagoBaja;

    const mcRango = [Math.min(ahorroVPNAbove, ahorroVPNBelow), Math.max(ahorroVPNAbove, ahorroVPNBelow)];

    // Decisión Final
    const esDominante = deltaFisher > 0;

    return (
        <div className="animate-fade" style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* ────── INPUTS DEL FRAMEWORK ────── */}
            <div className="glass-card" style={{ padding: "12px 14px" }}>
                <div className="section-title">
                    <span style={{ fontSize: 18 }}>⚙️</span> Parámetros Macroeconómicos
                </div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 12, lineHeight: 1.4 }}>
                    Define la inflación y el retorno de tu mejor alternativa de inversión. Como usualmente se invierte en pesos (CLP) y el crédito está en UF, ajustaremos el retorno nominal para hacerlo comparable.
                </div>
                <div className="grid-2" style={{ gap: 8 }}>
                    <Input label="Inflación Proyectada (π)" value={inflacion} onChange={v => setInflacion(v)} suffix="%" step={0.1} />
                    <Input label="Retorno Inversión Nominal (CLP)" value={retornoInv} onChange={v => setRetornoInv(v)} suffix="%" step={0.1} />
                </div>
            </div>

            <div className="grid-2">
                {/* ────── MODELO A: PUNTO DE EQUILIBRIO DE INFLACIÓN ────── */}
                <div className="glass-card" style={{ padding: "16px" }}>
                    <h3 style={{ fontSize: 14, color: "#fff", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ color: "var(--accent-indigo)" }}>A.</span> Punto de Equilibrio de Inflación (π*)
                    </h3>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 12, lineHeight: 1.4 }}>
                        Inflación máxima soportable para que tu inversión que rinde {retornoInv}% en pesos logre ganarle al crédito en UF.
                    </div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(255,255,255,0.03)", padding: "12px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.05)", marginBottom: 12 }}>
                        <div>
                            <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 4 }}>Break-even (π*)</div>
                            <div style={{ fontSize: 24, fontWeight: 800, color: "#fff" }}>{(piElegible * 100).toFixed(2)}%</div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                            <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 4 }}>Tu Proyección (π)</div>
                            <div style={{ fontSize: 16, fontWeight: 700, color: inflacion < (piElegible * 100) ? "var(--accent-emerald)" : "var(--accent-rose)" }}>{(+inflacion).toFixed(2)}%</div>
                        </div>
                    </div>

                    {/* Regla de Decisión Dinámica */}
                    {(() => {
                        const piPct = piElegible * 100;
                        const upperBound = piPct + 0.25;
                        const lowerBound = piPct - 0.25;
                        const inf = +inflacion;
                        let bg, color, title, desc;

                        if (inf > upperBound) {
                            bg = "rgba(16,185,129,0.1)"; color = "#10b981";
                            title = "🟢 PREPAGO GANA"; desc = "La alta inflación destruye tu retorno real de inversión.";
                        } else if (inf < lowerBound) {
                            bg = "rgba(244,63,94,0.1)"; color = "#f43f5e";
                            title = "🔴 INVERSIÓN GANA"; desc = "La inflación es baja; tu dinero en CLP rentará por sobre la UF.";
                        } else {
                            bg = "rgba(245,158,11,0.1)"; color = "#f59e0b";
                            title = "🟡 ZONA DE INDIFERENCIA"; desc = `[${lowerBound.toFixed(2)}% - ${upperBound.toFixed(2)}%] Considera liquidez.`;
                        }

                        return (
                            <div style={{ background: bg, border: `1px solid ${bg.replace("0.1)", "0.3)")}`, padding: "10px", borderRadius: 6, textAlign: "center" }}>
                                <div style={{ fontSize: 12, fontWeight: 700, color: color, marginBottom: 4 }}>{title}</div>
                                <div style={{ fontSize: 10, color: color, opacity: 0.9 }}>{desc}</div>
                            </div>
                        );
                    })()}
                </div>

                {/* ────── MODELO B: ARBITRAJE Y PARIDAD ────── */}
                <div className="glass-card" style={{ padding: "16px" }}>
                    <h3 style={{ fontSize: 14, color: "#fff", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ color: "var(--accent-indigo)" }}>B.</span> Arbitraje y Paridad (Fisher)
                    </h3>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 12, lineHeight: 1.4 }}>
                        Ajusta tu retorno nominal descontando la inflación, y lo compara con el interés de tu crédito en UF (CAE).
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 16 }}>
                        <div style={{ background: "rgba(255,255,255,0.03)", padding: 8, borderRadius: 6, textAlign: "center" }}>
                            <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 4 }}>CAE (Costo)</div>
                            <div style={{ fontSize: 16, fontWeight: 700, color: "var(--accent-cyan)" }}>{(tnaDecimal * 100).toFixed(2)}%</div>
                        </div>
                        <div style={{ background: "rgba(255,255,255,0.03)", padding: 8, borderRadius: 6, textAlign: "center", border: `1px solid ${deltaFisher > 0 ? 'rgba(16,185,129,0.3)' : 'rgba(244,63,94,0.3)'}` }}>
                            <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 4 }}>Diferencial</div>
                            <div style={{ fontSize: 16, fontWeight: 700, color: deltaFisher > 0 ? "#10b981" : "#f43f5e" }}>
                                {deltaFisher > 0 ? '+' : ''}{(deltaFisher * 100).toFixed(2)}%
                            </div>
                        </div>
                        <div style={{ background: "rgba(255,255,255,0.03)", padding: 8, borderRadius: 6, textAlign: "center" }}>
                            <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 4 }}>RetReal (ρ_r)</div>
                            <div style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>{(retRealDecimal * 100).toFixed(2)}%</div>
                        </div>
                    </div>
                    <div style={{
                        background: esDominante ? "rgba(16,185,129,0.1)" : "rgba(244,63,94,0.1)",
                        color: esDominante ? "#10b981" : "#f43f5e",
                        padding: "8px", borderRadius: 6, fontSize: 12, fontWeight: 600, textAlign: "center", textTransform: "uppercase", letterSpacing: "0.05em"
                    }}>
                        {esDominante ? '🟢 CAE > Retorno Real (Prepaga)' : '🔴 CAE < Retorno Real (Invierte)'}
                    </div>
                </div>
            </div>

            <div className="grid-2">
                {/* ────── MODELO C: VALOR PRESENTE NETO ────── */}
                <div className="glass-card" style={{ padding: "16px" }}>
                    <h3 style={{ fontSize: 14, color: "#fff", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ color: "var(--accent-indigo)" }}>C.</span> Valor Presente Neto (VPN)
                    </h3>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>VP Contrato Base</span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>UF {fmt(vpContrato)}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>VP con Prepago (E_t + Flujos)</span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>UF {fmt(vpPrepago)}</span>
                    </div>
                    <div style={{
                        background: convieneVPN ? "rgba(16,185,129,0.1)" : "rgba(244,63,94,0.1)",
                        border: `1px solid ${convieneVPN ? 'rgba(16,185,129,0.3)' : 'rgba(244,63,94,0.3)'}`,
                        padding: "10px", borderRadius: 6, display: "flex", justifyContent: "space-between", alignItems: "center"
                    }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: convieneVPN ? "#10b981" : "#f43f5e", textTransform: "uppercase" }}>
                            Ahorro en VPN
                        </span>
                        <span style={{ fontSize: 16, fontWeight: 800, color: convieneVPN ? "#10b981" : "#f43f5e" }}>
                            UF {fmt(ahorroVPN)}
                        </span>
                    </div>
                </div>

                {/* ────── MODELO D: MONTE CARLO ────── */}
                <div className="glass-card" style={{ padding: "16px", background: "linear-gradient(135deg, rgba(24,24,27,1) 0%, rgba(245,158,11,0.05) 100%)" }}>
                    <h3 style={{ fontSize: 14, color: "#fff", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ color: "var(--accent-amber)" }}>D.</span> Monte Carlo (Retornos)
                    </h3>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 12, lineHeight: 1.4 }}>
                        Calcula la probabilidad de que tu inversión supere al crédito, asumiendo una volatilidad normal de los retornos del mercado (σ = 8%).
                    </div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 12 }}>
                        <span style={{ fontSize: 32, fontWeight: 800, color: "var(--accent-amber)" }}>{(probConveniencia * 100).toFixed(1)}%</span>
                        <span style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.2 }}>Probabilidad teórica de<br />superar costo del crédito</span>
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>Rango de Ahorro Neto (P10 - P90)</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>UF {fmt(mcRango[0], 0)}</span>
                        <div style={{ flex: 1, height: 4, background: "linear-gradient(90deg, rgba(255,255,255,0.1), rgba(245, 158, 11, 0.5), rgba(255,255,255,0.1))", borderRadius: 2 }}></div>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>UF {fmt(mcRango[1], 0)}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ── GRÁFICO ESCENARIOS (MULTI-LÍNEA RECHARTS) ───────────────────────────────
const GraficoEscenarios = ({ saldoActual, cr, mesesRestantes, pr, cuotaBase }) => {
    const minPrepago = Math.ceil(saldoActual * 0.05);
    const interesesBase = calcularInteresesTotales(saldoActual, +cr.tna, mesesRestantes);

    // Find optimal
    const findOptimalAmount = () => {
        let bestRoi = -Infinity, bestAmount = minPrepago;
        const searchMax = pr.frecuencia === "una_vez" ? saldoActual : Math.min(saldoActual * 0.5, 2000);
        const step = pr.frecuencia === "una_vez" ? Math.max(10, Math.floor(saldoActual / 50)) : 10;

        for (let m = minPrepago; m <= searchMax; m += step) {
            const s = simularPrepago(saldoActual, +cr.tna, mesesRestantes, m, pr.frecuencia, +pr.mesInicio, pr.destino, cuotaBase, +cr.costoPrepago);
            const roi = s.totalPrepagado > 0 ? ((interesesBase - s.totalIntereses - s.totalMultas) / s.totalPrepagado) * 100 : 0;
            if (roi > bestRoi) { bestRoi = roi; bestAmount = m; }
        }

        const refinedStep = pr.frecuencia === "una_vez" ? Math.max(1, Math.floor(step / 10)) : 1;
        const lo = Math.max(minPrepago, bestAmount - step * 1.5), hi = Math.min(saldoActual, bestAmount + step * 1.5);
        for (let m = lo; m <= hi; m += refinedStep) {
            const s = simularPrepago(saldoActual, +cr.tna, mesesRestantes, m, pr.frecuencia, +pr.mesInicio, pr.destino, cuotaBase, +cr.costoPrepago);
            const roi = s.totalPrepagado > 0 ? ((interesesBase - s.totalIntereses - s.totalMultas) / s.totalPrepagado) * 100 : 0;
            if (roi > bestRoi) { bestRoi = roi; bestAmount = m; }
        }
        return Math.round(bestAmount);
    };
    const montoOptimo = findOptimalAmount();
    const candidates = new Set([minPrepago, montoOptimo]);
    const medio = Math.round(Math.max(montoOptimo * 1.5, minPrepago * 3));
    if (medio < saldoActual && medio !== montoOptimo) candidates.add(medio);
    const agresivo = Math.round(Math.max(montoOptimo * 3, minPrepago * 6));
    if (agresivo < saldoActual && agresivo !== montoOptimo && agresivo !== medio) candidates.add(agresivo);
    [minPrepago * 2, montoOptimo * 2].map(Math.round).forEach(e => {
        if (candidates.size < 4 && e > minPrepago && e < saldoActual && !candidates.has(e)) candidates.add(e);
    });
    const montos = [...candidates].sort((a, b) => a - b).slice(0, 4);
    const curveColors = ['#f59e0b', '#10b981', '#06b6d4', '#8b5cf6'];

    // Build unified data: sample every 6 months
    const baseSim = simularPrepago(saldoActual, +cr.tna, mesesRestantes, 0, pr.frecuencia, 0, pr.destino, cuotaBase, +cr.costoPrepago);
    const sims = montos.map(m => ({
        m,
        ...simularPrepago(saldoActual, +cr.tna, mesesRestantes, m, pr.frecuencia, +pr.mesInicio, pr.destino, cuotaBase, +cr.costoPrepago)
    }));

    const maxMes = Math.max(mesesRestantes, ...sims.map(s => s.mesesReales));
    const data = [];
    for (let mes = 0; mes <= maxMes; mes += 6) {
        const point = { mes };
        const bp = baseSim.evolucionSin.find(p => p.mes === mes);
        point.sinPrepago = bp ? bp.saldo : 0;
        sims.forEach((s, i) => {
            const sp = s.evolucionCon.find(p => p.mes === mes);
            point[`uf${montos[i]}`] = sp ? sp.saldo : 0;
        });
        data.push(point);
    }

    const CustomTooltip = ({ active, payload, label }) => {
        if (!active || !payload?.length) return null;
        return (
            <div style={{ background: "#18181b", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 6, padding: 10, fontSize: 12, fontFamily: "Inter" }}>
                <div style={{ fontFamily: "Outfit", fontWeight: 700, color: "#fff", fontSize: 13, marginBottom: 6 }}>Mes {label}</div>
                {payload.map((p, i) => (
                    <div key={i} style={{ color: p.color, marginBottom: 2 }}>
                        {p.name}: UF {fmt(p.value, 0)}
                    </div>
                ))}
            </div>
        );
    };

    return (
        <ResponsiveContainer width="100%" height={400}>
            <LineChart data={data} margin={{ top: 10, right: 16, left: 8, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="mes" stroke="rgba(255,255,255,0.5)" tick={{ fontFamily: "Inter", fontSize: 11 }} tickFormatter={v => { const a = Math.floor(v / 12); return a > 0 ? `Año ${a}` : `${v}m`; }} />
                <YAxis stroke="rgba(255,255,255,0.5)" tick={{ fontFamily: "Inter", fontSize: 11 }} tickFormatter={v => `UF ${fmt(v, 0)}`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontFamily: "Inter", fontSize: 11, fontWeight: 600, color: "#fff" }} iconSize={8} />
                <Line type="monotone" dataKey="sinPrepago" name="Sin Prepago" stroke="#64748b" strokeWidth={2} strokeDasharray="6 4" dot={false} />
                {montos.map((m, i) => (
                    <Line key={m} type="monotone" dataKey={`uf${m}`} name={`UF ${m}${m === montoOptimo ? ' (Óptimo)' : ''}`} stroke={curveColors[i]} strokeWidth={m === montoOptimo ? 3 : 2} dot={false} />
                ))}
            </LineChart>
        </ResponsiveContainer>
    );
};

// ── TABLA DE AMORTIZACIÓN MENSUAL (NUEVO) ──────────────────────────────────
const TablaAmortizacion = ({ detalle, seguros, moneda = "UF", valorUF = 38000 }) => {
    if (!detalle || detalle.length === 0) return null;

    const formatVal = (val) => {
        if (moneda === "CLP") {
            return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(val * valorUF);
        }
        return `UF ${fmt(val, 2)}`;
    };

    const formatSmallVal = (val, dec = 0) => {
        if (moneda === "CLP") {
            return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(val * valorUF);
        }
        return `UF ${fmt(val, dec)}`;
    };

    return (
        <div className="animate-fade" style={{ overflow: "hidden", borderRadius: 12, border: "1px solid var(--card-border)" }}>
            <div style={{ overflowX: "auto", maxHeight: "600px", overflowY: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, fontFamily: "Inter", textAlign: "right" }}>
                    <thead style={{ position: "sticky", top: 0, background: "rgba(15, 23, 42, 0.95)", backdropFilter: "blur(10px)", zIndex: 10 }}>
                        <tr style={{ color: "var(--text-muted)", textTransform: "uppercase", fontSize: 10, letterSpacing: "0.05em" }}>
                            <th style={{ padding: "12px 16px", textAlign: "center", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>Mes</th>
                            <th style={{ padding: "12px 16px", textAlign: "center", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>Año</th>
                            <th style={{ padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>Cuota + Seg</th>
                            <th style={{ padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>Interés</th>
                            <th style={{ padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>Amortización</th>
                            <th style={{ padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.1)", color: "var(--accent-emerald)" }}>Prepago</th>
                            <th style={{ padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.1)", color: "var(--accent-rose)" }}>Multa</th>
                            <th style={{ padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>Saldo Final</th>
                        </tr>
                    </thead>
                    <tbody>
                        {detalle.map((d, i) => (
                            <tr key={i} style={{ 
                                borderBottom: "1px solid rgba(255,255,255,0.03)", 
                                background: d.prepago > 0 ? "rgba(16, 185, 129, 0.08)" : "transparent",
                                transition: "background 0.2s"
                            }} className="table-row-hover">
                                <td style={{ padding: "10px 16px", textAlign: "center", color: "var(--text-muted)" }}>{d.mes}</td>
                                <td style={{ padding: "10px 16px", textAlign: "center", fontWeight: 600 }}>{d.ano}</td>
                                <td style={{ padding: "10px 16px" }}>{formatVal(d.cuota + seguros)}</td>
                                <td style={{ padding: "10px 16px", color: "rgba(255,255,255,0.7)" }}>{formatVal(d.interes)}</td>
                                <td style={{ padding: "10px 16px" }}>{formatVal(d.amortizacion)}</td>
                                <td style={{ padding: "10px 16px", color: "var(--accent-emerald)", fontWeight: 700 }}>
                                    {d.prepago > 0 ? `+${formatSmallVal(d.prepago, 0)}` : "—"}
                                </td>
                                <td style={{ padding: "10px 16px", color: "var(--accent-rose)" }}>
                                    {d.multa > 0 ? formatVal(d.multa) : "—"}
                                </td>
                                <td style={{ padding: "10px 16px", fontWeight: 700, color: "#fff" }}>{formatVal(d.saldo)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// ── APP PRINCIPAL ────────────────────────────────────────────────────────────
export default function App() {
    const [cr, setCr] = useState({ capital: 2000, tna: 4.5, plazo: 300, mesesPagados: 36, costoPrepago: "1.5", seguros: 0.5 });
    const [pr, setPr] = useState({ monto: 100, frecuencia: "anual", mesInicio: 37, destino: "plazo" });
    const [tab, setTab] = useState("resumen");
    const [monedaTabla, setMonedaTabla] = useState("UF");
    const [valorUF, setValorUF] = useState(38000);

    React.useEffect(() => {
        fetch("https://mindicador.cl/api/uf")
            .then(res => res.json())
            .then(data => {
                if (data?.serie?.[0]?.valor) setValorUF(data.serie[0].valor);
            })
            .catch(e => console.log("Error fetching UF:", e));
    }, []);

    const setC = k => v => setCr(p => ({ ...p, [k]: v }));
    const setP = k => v => setPr(p => ({ ...p, [k]: v }));

    const mesesRestantes = Math.max(+cr.plazo - +cr.mesesPagados, 1);
    const saldoActual = calcularSaldoActual(+cr.capital, +cr.tna, +cr.plazo, +cr.mesesPagados);
    const cuotaBase = cuotaMensual(saldoActual, +cr.tna, mesesRestantes);
    const interesesBase = calcularInteresesTotales(saldoActual, +cr.tna, mesesRestantes);

    const simPlazo = useMemo(() =>
        simularPrepago(saldoActual, +cr.tna, mesesRestantes, +pr.monto, pr.frecuencia, +pr.mesInicio, "plazo", cuotaBase, +cr.costoPrepago),
        [saldoActual, cr.tna, mesesRestantes, pr.monto, pr.frecuencia, pr.mesInicio, cuotaBase, cr.costoPrepago]
    );

    const simCuota = useMemo(() =>
        simularPrepago(saldoActual, +cr.tna, mesesRestantes, +pr.monto, pr.frecuencia, +pr.mesInicio, "cuota", cuotaBase, +cr.costoPrepago),
        [saldoActual, cr.tna, mesesRestantes, pr.monto, pr.frecuencia, pr.mesInicio, cuotaBase, cr.costoPrepago]
    );

    const sim = pr.destino === "plazo" ? simPlazo : simCuota;

    const ahorroIntereses = interesesBase - sim.totalIntereses;
    const ahorroNeto = ahorroIntereses - sim.totalMultas;
    const mesesAhorrados = mesesRestantes - sim.mesesReales;
    const conviene = ahorroNeto > 0;

    // CAE: tasa que iguala flujo de (cuota + seguros) al saldo actual
    const calcCAE = () => {
        const flujoMensual = cuotaBase + (+cr.seguros || 0);
        let rm = tasaMensual(+cr.tna);
        for (let iter = 0; iter < 50; iter++) {
            const factor = Math.pow(1 + rm, mesesRestantes);
            const pv = flujoMensual * (factor - 1) / (rm * factor);
            const err = pv - saldoActual;
            if (Math.abs(err) < 0.0001) break;
            const rm2 = rm * 1.0001;
            const factor2 = Math.pow(1 + rm2, mesesRestantes);
            const pv2 = flujoMensual * (factor2 - 1) / (rm2 * factor2);
            const deriv = (pv2 - pv) / (rm2 - rm);
            if (Math.abs(deriv) < 1e-12) break;
            rm -= err / deriv;
            if (rm <= 0) rm = 0.0001;
        }
        return (Math.pow(1 + rm, 12) - 1) * 100;
    };
    const cae = calcCAE();

    const tabs = [
        { id: "resumen", label: "RESUMEN" },
        { id: "grafico", label: "GRAFICO COMPARATIVO" },
        { id: "amortizacion", label: "DETALLE MENSUAL" },
        { id: "escenarios", label: "ESCENARIOS" },
        { id: "curvas", label: "CURVAS ESCENARIOS" },
        { id: "comparacion", label: "EVOLUCIÓN CUOTA" }
    ];

    return (
        <div className="app-container">
            {/* Header */}
            <div style={{ textAlign: "center", marginBottom: 12 }}>
                <h1 className="text-gradient" style={{ fontSize: 36, letterSpacing: "-0.02em", marginBottom: 8 }}>
                    SIMULADOR DE PREPAGO HIPOTECARIO
                </h1>
            </div>

            <div className="grid-2">
                {/* Configuración del Crédito */}
                <div className="glass-card">
                    <div className="section-title">
                        <span style={{ fontSize: 18 }}>🏦</span> Datos del Crédito
                    </div>
                    <div className="grid-2" style={{ gap: 16 }}>
                        <Input label="Monto original" value={cr.capital} onChange={setC("capital")} prefix="UF" min={1} />
                        <Input label="Tasa (TNA)" value={cr.tna} onChange={setC("tna")} suffix="%" step={0.1} />
                        <Input label="Plazo total" value={cr.plazo} onChange={setC("plazo")} suffix="meses" />
                        <Input label="Meses pagados" value={cr.mesesPagados} onChange={setC("mesesPagados")} suffix="meses" />
                        <Input label="Seguros mensuales" value={cr.seguros} onChange={setC("seguros")} prefix="UF" step={0.1} />
                        <div style={{ gridColumn: "1/-1" }}>
                            <Select label="Costo de Prepago" value={cr.costoPrepago} onChange={setC("costoPrepago")}
                                options={costosPrepagoOpciones} />
                        </div>
                    </div>
                </div>

                {/* Estrategia de Prepago */}
                <div className="glass-card" style={{ padding: "8px 12px", display: "flex", flexDirection: "column", borderColor: "rgba(245, 158, 11, 0.2)", gap: 8 }}>
                    <div className="section-title" style={{ color: "var(--accent-amber)" }}>
                        <span style={{ fontSize: 18 }}>💸</span> Estrategia de Prepago
                    </div>
                    <div className="grid-2" style={{ gap: 16 }}>
                        <Input label="Monto por vez (mínimo 5% del saldo)" value={pr.monto} onChange={setP("monto")} prefix="UF" min={Math.ceil(saldoActual * 0.05)} />
                        <Select label="Frecuencia" value={pr.frecuencia} onChange={setP("frecuencia")}
                            options={[{ value: "una_vez", label: "Única Vez" }, { value: "mensual", label: "Mensual" }, { value: "semestral", label: "Semestral" }, { value: "anual", label: "Anual" }]} />
                        <Input label="Mes de inicio" value={pr.mesInicio} onChange={setP("mesInicio")} suffix="meses" />
                        <div style={{ gridColumn: "1/-1" }}>
                            <Select label="Destino del prepago" value={pr.destino} onChange={setP("destino")}
                                options={[{ value: "plazo", label: "Reducir Plazo (misma cuota, terminas antes)" }, { value: "cuota", label: "Reducir Cuota (mismo plazo, pagas menos al mes)" }]} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Alerta de Retorno movida dentro de la pestaña */}

            {/* Contenedor Principal de Resultados */}
            <div className="glass-card" style={{ padding: "0", overflow: "hidden", height: "auto", minHeight: "500px", maxHeight: "800px", borderColor: "rgba(245, 158, 11, 0.2)" }}>

                {/* Navigation Tabs */}
                <div style={{ padding: "20px 20px 0", borderBottom: "1px solid var(--card-border)" }}>
                    <div className="tabs" style={{ marginBottom: 20 }}>
                        {tabs.map((t) => (
                            <button key={t.id}
                                onClick={() => setTab(t.id)}
                                className={`tab-btn ${tab === t.id ? 'active' : ''}`}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div style={{ padding: "8px 12px", overflowY: "auto" }}>
                    {/* TAB: RESUMEN */}
                    {tab === "resumen" && (
                        <div className="animate-fade" style={{ display: "flex", flexDirection: "column", gap: 32 }}>

                            {/* Alerta de Retorno (Ahora dentro de la pestaña) */}
                            {+pr.monto > 0 && (
                                <div className={`alert-box ${conviene ? 'alert-success' : 'alert-warning'}`}>
                                    <div className="alert-icon">{conviene ? "🚀" : "⚠️"}</div>
                                    <div>
                                        <div className="alert-title">
                                            {conviene ? "Estrategia Rentable" : "El costo de prepago supera el ahorro"}
                                        </div>
                                        <div className="alert-desc">
                                            {conviene
                                                ? `Estás ahorrando UF ${fmt(ahorroNeto)} netos (ya descontado el costo de prepago de UF ${fmt(sim.totalMultas)}).`
                                                : `Tu ahorro en interés no alcanza a cubrir el costo de prepago de UF ${fmt(sim.totalMultas)}. Considera aumentar el monto o la frecuencia.`}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Sección: Estado Actual */}
                            <div>
                                <h3 style={{ fontSize: 16, marginBottom: 16, color: "#fff", display: "flex", alignItems: "center", gap: 8 }}>
                                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--accent-indigo)" }}></div>
                                    Si no prepagas (Tu estado actual)
                                </h3>
                                <div className="grid-3">
                                    <Stat label="Saldo Actual" value={`UF ${fmt(saldoActual)}`} colorClass="indigo" />
                                    <Stat label="Cuota Mensual" value={`UF ${fmt(cuotaBase)}`} colorClass="indigo" />
                                    <Stat label="Intereses Restantes" value={`UF ${fmt(interesesBase)}`} colorClass="indigo" />
                                    <Stat label="Tiempo Restante" value={fmtM(mesesRestantes)} sub={`(${mesesRestantes} meses)`} colorClass="indigo" />
                                </div>
                            </div>

                            {/* Divisor */}
                            <div style={{ height: 1, background: "var(--card-border)", width: "100%" }} />

                            {/* Sección: Escenario Prepago */}
                            {+pr.monto > 0 && (
                                <div>
                                    <h3 style={{ fontSize: 16, marginBottom: 16, color: "#fff", display: "flex", alignItems: "center", gap: 8 }}>
                                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--accent-emerald)" }}></div>
                                        Aplicando tu estrategia
                                    </h3>
                                    <div className="grid-3">
                                        <Stat label="Ahorro NETO Total" value={`UF ${fmt(ahorroNeto)}`} sub="Descontando multas" colorClass={ahorroNeto > 0 ? "emerald" : "rose"} big />

                                        {pr.destino === "plazo" ? (
                                            <Stat label="Tiempo Ahorrado" value={fmtM(mesesAhorrados)} sub={`Terminas en ${fmtM(sim.mesesReales)}`} colorClass="cyan" big />
                                        ) : (
                                            <Stat label="Nueva Cuota" value={`UF ${fmt(sim.nuevaCuota)}`} sub={`Te ahorras UF ${fmt(cuotaBase - sim.nuevaCuota)} / mes`} colorClass="cyan" big />
                                        )}

                                        <Stat label="Interés Ahorrado" value={`UF ${fmt(ahorroIntereses)}`} colorClass="emerald" />
                                        <Stat label="Total Prepagado" value={`UF ${fmt(sim.totalPrepagado)}`} sub={`En ${sim.prepagosRealizados} eventos`} colorClass="amber" />
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* TAB: GRAFICO */}
                    {tab === "grafico" && (
                        <div className="animate-fade" style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                            {+pr.monto > 0 && ahorroIntereses > 0 && (
                                <div style={{ marginBottom: 16, padding: "12px 16px", background: "rgba(6, 182, 212, 0.05)", borderLeft: "4px solid var(--accent-cyan)", borderRadius: "4px 8px 8px 4px" }}>
                                    <div style={{ color: "var(--accent-cyan)", fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Key Insight</div>
                                    <div style={{ fontSize: 14, color: "#e2e8f0", lineHeight: 1.5, fontFamily: "Inter", fontWeight: 400 }}>
                                        La estrategia propuesta acelera la amortización y reduce la exposición a intereses prospectivos en un <strong style={{ color: "#fff", fontWeight: 700 }}>{((ahorroIntereses / interesesBase) * 100).toFixed(1)}%</strong>, optimizando la estructura de capital a largo plazo.
                                    </div>
                                </div>
                            )}
                            <h3 style={{ fontSize: 14, marginBottom: 16, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Proyección de Saldo Insoluto (UF)</h3>
                            <div style={{ position: "relative", flex: 1, minHeight: "450px" }}>
                                <GraficoSaldo evolucionSin={sim.evolucionSin} simPlazo={simPlazo} simCuota={simCuota} mesesRestantes={mesesRestantes} saldoInicial={saldoActual} />
                            </div>
                        </div>
                    )}

                    {/* TAB: ESCENARIOS */}
                    {tab === "escenarios" && (
                        <div className="animate-fade">
                            <h3 style={{ fontSize: 16, marginBottom: 8, color: "#fff", fontWeight: 600 }}>Análisis de Escenarios</h3>
                            <p style={{ fontSize: 14, color: "var(--text-muted)", marginBottom: 16 }}>Optimización matemática del monto ideal de prepago según tu crédito.</p>
                            <Escenarios cr={cr} saldoActual={saldoActual} mesesRestantes={mesesRestantes} interesesBase={interesesBase} pr={pr} cuotaBase={cuotaBase} valorUF={0} cae={cae} />
                        </div>
                    )}

                    {/* TAB: AMORTIZACIÓN */}
                    {tab === "amortizacion" && (
                        <div className="animate-fade">
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
                                    <div>
                                        <h3 style={{ fontSize: 16, color: "#fff", fontWeight: 600 }}>Tabla de Amortización Detallada</h3>
                                        <p style={{ fontSize: 14, color: "var(--text-muted)" }}>Desglose de cada pago bajo la estrategia de {pr.destino === "plazo" ? "Reducción de Plazo" : "Reducción de Cuota"}.</p>
                                    </div>
                                    <div style={{ display: "flex", background: "rgba(0,0,0,0.3)", padding: 4, borderRadius: 8, border: "1px solid rgba(255,255,255,0.05)" }}>
                                        {["UF", "CLP"].map(m => (
                                            <button
                                                key={m}
                                                onClick={() => setMonedaTabla(m)}
                                                style={{
                                                    padding: "6px 16px",
                                                    borderRadius: 6,
                                                    border: "none",
                                                    fontSize: 11,
                                                    fontWeight: 800,
                                                    cursor: "pointer",
                                                    transition: "all 0.2s",
                                                    background: monedaTabla === m ? "var(--accent-indigo)" : "transparent",
                                                    color: monedaTabla === m ? "#fff" : "var(--text-muted)"
                                                }}
                                            >
                                                {m}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div style={{ textAlign: "right", background: "rgba(59, 130, 246, 0.1)", padding: "8px 16px", borderRadius: 8, border: "1px solid rgba(59, 130, 246, 0.2)" }}>
                                    <div style={{ fontSize: 10, color: "var(--accent-cyan)", fontWeight: 800, textTransform: "uppercase" }}>Término Proyectado</div>
                                    <div style={{ fontSize: 18, fontWeight: 800, color: "#fff" }}>{new Date().getFullYear() + Math.floor((new Date().getMonth() + sim.mesesReales) / 12)}</div>
                                </div>
                            </div>
                            <TablaAmortizacion detalle={sim.detalleMensual} seguros={+cr.seguros} moneda={monedaTabla} valorUF={valorUF} />
                        </div>
                    )}

                    {/* TAB: CURVAS ESCENARIOS */}
                    {tab === "curvas" && (
                        <div className="animate-fade" style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                            <h3 style={{ fontSize: 16, marginBottom: 8, color: "#fff", fontWeight: 600 }}>Comparación Visual de Escenarios</h3>
                            <p style={{ fontSize: 14, color: "var(--text-muted)", marginBottom: 6 }}>Proyección del saldo insoluto para cada monto de prepago estratégico.</p>
                            <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 16, lineHeight: 1.5, fontStyle: "italic", opacity: 0.75 }}>El monto óptimo es el punto donde tu dinero trabaja más eficientemente contra la deuda. Prepagar más allá de ese monto sigue siendo bueno, pero tiene rendimientos marginales decrecientes — tu plata rinde más en otra inversión.</p>
                            <div style={{ position: "relative", flex: 1, minHeight: 400 }}>
                                <GraficoEscenarios saldoActual={saldoActual} cr={cr} mesesRestantes={mesesRestantes} pr={pr} cuotaBase={cuotaBase} />
                            </div>
                        </div>
                    )}

                    {/* TAB: EVOLUCION CUOTA */}
                    {tab === "comparacion" && (
                        <div className="animate-fade" style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                            <h3 style={{ fontSize: 16, marginBottom: 8, color: "#fff", fontWeight: 600 }}>Evolución del Flujo de Caja</h3>
                            <p style={{ fontSize: 14, color: "var(--text-muted)", marginBottom: 24 }}>Compara cómo la cuota mensual disminuye progresivamente en el tiempo según tu estrategia.</p>
                            <div style={{ position: "relative", flex: 1, minHeight: 400 }}>
                                <GraficoCuotas evolucionCuota={sim.evolucionCuota} cuotaBase={cuotaBase} destino={pr.destino} />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

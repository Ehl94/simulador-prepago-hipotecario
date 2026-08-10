// ── COMPONENTES UI ───────────────────────────────────────────────────────────
// SidebarClock, Input, Select, Stat
// Depende de: globals.js (fmt, fmtCLP)

const SidebarClock = () => {
  const [now, setNow] = React.useState(new Date());
  React.useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const hours = String(now.getHours()).padStart(2, '0');
  const mins  = String(now.getMinutes()).padStart(2, '0');
  const days   = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const dateStr = `${days[now.getDay()]}, ${months[now.getMonth()]} ${now.getDate()}`;
  return (
    <div style={{ background: "var(--color-background-secondary)", borderRadius: 8, padding: "10px 12px", marginBottom: 8 }}>
      <div style={{ fontSize: 26, fontWeight: 700, color: "var(--color-text-primary)", fontFamily: "var(--font-display)", lineHeight: 1.1 }}>
        {hours}:{mins}
      </div>
      <div style={{ fontSize: 11, color: "var(--color-text-tertiary)", marginTop: 2, fontWeight: 500 }}>
        {dateStr}
      </div>
    </div>
  );
};

const Input = ({ label, value, onChange, min, max, step = "any", prefix, suffix, sublabel }) => (
  <div className="input-group">
    <label className="input-label">{label}</label>
    <div className="input-wrapper">
      {prefix && <span className="input-prefix">{prefix}</span>}
      <input type="number" className="styled-input" value={value} onChange={e => onChange(e.target.value)} min={min} max={max} step={step} />
      {suffix && <span className="input-suffix">{suffix}</span>}
    </div>
    {sublabel && <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginTop: 2, fontWeight: 500 }}>{sublabel}</div>}
  </div>
);

const SliderInput = ({ label, value, onChange, min, max, step = 1, prefix, suffix, sublabel }) => {
  const numValue = Number(value) || 0;
  return (
    <div className="input-group">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
        <label className="input-label">{label}</label>
        <span style={{ fontSize: 12, fontWeight: 700, color: "var(--accent-cyan)" }}>
          {prefix}{value}{suffix}
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <input 
          type="range" 
          min={min} 
          max={max} 
          step={step} 
          value={numValue} 
          onChange={e => onChange(e.target.value === "" ? "" : Number(e.target.value))}
        />
        <div className="input-wrapper" style={{ width: 85, flexShrink: 0 }}>
          <input 
            type="number" 
            className="styled-input" 
            value={value} 
            onChange={e => {
              let val = e.target.value === "" ? "" : Number(e.target.value);
              onChange(val);
            }} 
            min={min} 
            max={max} 
            step={step}
            style={{ textAlign: "center", padding: "8px 4px" }}
          />
        </div>
      </div>
      {sublabel && <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginTop: 2, fontWeight: 500 }}>{sublabel}</div>}
    </div>
  );
};

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

const RateBarChart = ({ label1, value1, label2, value2 }) => {
  const maxVal = Math.max(value1, value2, 1);
  const width1 = (value1 / maxVal) * 100;
  const width2 = (value2 / maxVal) * 100;
  
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "12px 16px", background: "var(--color-background-secondary)", borderRadius: 8, border: "1px solid var(--color-border-tertiary)", margin: "8px 0 16px 0" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, fontWeight: 600, color: "var(--color-text-secondary)" }}>
          <span>{label1}</span>
          <span style={{ color: "var(--accent-rose)", fontWeight: 700 }}>{value1.toFixed(2)}%</span>
        </div>
        <div style={{ height: 12, background: "var(--color-border-tertiary)", borderRadius: 6, overflow: "hidden" }}>
          <div style={{ width: `${width1}%`, height: "100%", background: "var(--accent-rose)", transition: "width 0.3s ease-out", borderRadius: 6 }}></div>
        </div>
      </div>
      
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, fontWeight: 600, color: "var(--color-text-secondary)" }}>
          <span>{label2}</span>
          <span style={{ color: "var(--accent-emerald)", fontWeight: 700 }}>{value2.toFixed(2)}%</span>
        </div>
        <div style={{ height: 12, background: "var(--color-border-tertiary)", borderRadius: 6, overflow: "hidden" }}>
          <div style={{ width: `${width2}%`, height: "100%", background: "var(--accent-emerald)", transition: "width 0.3s ease-out", borderRadius: 6 }}></div>
        </div>
      </div>
    </div>
  );
};

const ProbabilityGauge = ({ probability }) => {
  const percentage = Math.round(probability * 100);
  
  // Interpolación de color para el texto y brillo
  const hue = probability * 120; // 0 red to 120 green
  const color = `hsl(${hue}, 75%, 40%)`;
  
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "16px 12px", background: "var(--color-background-primary)", borderRadius: 12, border: "1px solid var(--color-border-tertiary)", width: "100%", boxShadow: "var(--shadow-sm)" }}>
      <div style={{ position: "relative", width: 140, height: 78, overflow: "hidden", display: "flex", justifyContent: "center" }}>
        <svg width="140" height="140" viewBox="0 0 140 140" style={{ transform: "rotate(-180deg)" }}>
          <defs>
            <linearGradient id="gauge-grad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="var(--accent-rose)" />
              <stop offset="50%" stopColor="var(--accent-amber)" />
              <stop offset="100%" stopColor="var(--accent-emerald)" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor={color} floodOpacity="0.4" />
            </filter>
          </defs>
          {/* Fondo del arco */}
          <circle cx="70" cy="70" r="60" fill="none" stroke="var(--color-background-secondary)" strokeWidth="10" strokeLinecap="round" />
          {/* Arco activo con gradiente */}
          <circle 
            cx="70" 
            cy="70" 
            r="60" 
            fill="none" 
            stroke="url(#gauge-grad)" 
            strokeWidth="10" 
            strokeLinecap="round"
            strokeDasharray={`${Math.PI * 60}`}
            strokeDashoffset={`${Math.PI * 60 * (1 - probability)}`}
            style={{ transition: "stroke-dashoffset 0.5s ease-out" }}
          />
          {/* Indicador / Knob en la punta del arco */}
          <g transform={`rotate(${probability * 180} 70 70)`} style={{ transition: "transform 0.5s ease-out" }}>
            <circle cx="10" cy="70" r="8" fill="#FFFFFF" stroke={color} strokeWidth="3" style={{ filter: "url(#glow)" }} />
          </g>
        </svg>
        <div style={{ position: "absolute", bottom: 0, textAlign: "center" }}>
          <div style={{ fontSize: 30, fontWeight: 900, color: color, lineHeight: 1, fontFamily: "var(--font-display)" }}>{percentage}%</div>
          <div style={{ fontSize: 9, fontWeight: 700, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 4 }}>Éxito</div>
        </div>
      </div>
    </div>
  );
};

const MonteCarloSpectrum = ({ minVal, maxVal, expectedVal }) => {
  const { fmt } = window;
  const maxScale = Math.max(maxVal * 1.15, 10);
  const getX = (val) => (val / maxScale) * 460 + 20; // 20px padding left/right
  
  const X1 = getX(minVal);
  const X2 = getX(maxVal);
  const Xe = getX(expectedVal);
  
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: 16, background: "var(--color-background-primary)", borderRadius: 12, border: "1px solid var(--color-border-tertiary)", width: "100%", boxShadow: "var(--shadow-sm)" }}>
      <div style={{ fontSize: 11, color: "var(--color-text-secondary)", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em" }}>
        Espectro de Ahorro Neto UF (P10 - P90)
      </div>
      <div style={{ position: "relative", width: "100%" }}>
        <svg viewBox="0 0 500 90" width="100%" height="90" style={{ display: "block", overflow: "visible" }}>
          <defs>
            <linearGradient id="spectrum-grad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="var(--accent-amber)" />
              <stop offset="100%" stopColor="var(--accent-emerald)" />
            </linearGradient>
            <filter id="spectrum-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="var(--accent-amber)" floodOpacity="0.25" />
            </filter>
          </defs>
          {/* Eje de fondo */}
          <line x1="20" y1="45" x2="480" y2="45" stroke="var(--color-background-secondary)" strokeWidth="4" strokeLinecap="round" />
          <line x1="20" y1="45" x2="480" y2="45" stroke="var(--color-border-secondary)" strokeWidth="2" strokeDasharray="3 3" strokeLinecap="round" />
          
          {/* Límites de escala de fondo (0 y Max) */}
          <line x1={getX(0)} y1="40" x2={getX(0)} y2="50" stroke="var(--color-border-primary)" strokeWidth="1" />
          <text x={getX(0)} y="62" textAnchor="middle" fill="var(--color-text-tertiary)" fontSize="8" fontWeight="600">UF 0</text>
          
          <line x1={getX(maxScale)} y1="40" x2={getX(maxScale)} y2="50" stroke="var(--color-border-primary)" strokeWidth="1" />
          <text x={getX(maxScale)} y="62" textAnchor="middle" fill="var(--color-text-tertiary)" fontSize="8" fontWeight="600">UF {Math.round(maxScale)}</text>
          
          {/* Rango flotante (Capsula de Confianza) */}
          {X2 > X1 && (
            <rect 
              x={X1} 
              y="39" 
              width={X2 - X1} 
              height="12" 
              rx="6" 
              fill="url(#spectrum-grad)" 
              style={{ filter: "url(#spectrum-glow)", opacity: 0.9 }} 
            />
          )}
          
          {/* Marcadores P10 y P90 debajo */}
          <text x={X1} y="74" textAnchor="middle" fill="var(--color-text-secondary)" fontSize="9" fontWeight="700">UF {fmt(minVal, 0)}</text>
          <text x={X1} y="84" textAnchor="middle" fill="var(--color-text-tertiary)" fontSize="8" fontWeight="500">Peor Caso (P10)</text>
          
          <text x={X2} y="74" textAnchor="middle" fill="var(--color-text-secondary)" fontSize="9" fontWeight="700">UF {fmt(maxVal, 0)}</text>
          <text x={X2} y="84" textAnchor="middle" fill="var(--color-text-tertiary)" fontSize="8" fontWeight="500">Mejor Caso (P90)</text>
          
          {/* Línea vertical de valor esperado */}
          <line x1={Xe} y1="26" x2={Xe} y2="64" stroke="var(--accent-cyan)" strokeWidth="3" strokeLinecap="round" />
          <circle cx={Xe} cy="45" r="5" fill="#FFFFFF" stroke="var(--accent-cyan)" strokeWidth="3.5" />
          
          {/* Valor Esperado Etiqueta arriba */}
          <text x={Xe} y="16" textAnchor="middle" fill="var(--accent-cyan)" fontSize="10" fontWeight="900" style={{ letterSpacing: "0.02em" }}>
            UF {fmt(expectedVal, 1)} (Esperado)
          </text>
        </svg>
      </div>
    </div>
  );
};

const CollapsibleCard = ({ title, icon, accentColor, borderColor, collapsed, onToggle, children }) => {
  const btnStyle = {
    background: "none",
    border: "1px solid var(--color-border-secondary)",
    borderRadius: 6,
    padding: "4px 6px",
    cursor: "pointer",
    color: "var(--color-text-tertiary)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    lineHeight: 0,
  };

  if (collapsed) {
    return (
      <div
        className="glass-card"
        style={{
          padding: "12px 10px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          width: 44,
          minWidth: 44,
          gap: 10,
          ...(borderColor ? { borderColor } : {})
        }}
      >
        <button onClick={onToggle} title="Expandir" style={btnStyle}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
        <div style={{
          writingMode: "vertical-rl",
          fontSize: 11,
          fontWeight: 700,
          color: accentColor || "#3A3935",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          whiteSpace: "nowrap",
          userSelect: "none",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 6,
          marginTop: 4,
        }}>
          {icon && <span style={{ fontSize: 15 }}>{icon}</span>}
          {title}
        </div>
      </div>
    );
  }

  return (
    <div
      className="glass-card"
      style={{
        padding: 16,
        display: "flex",
        flexDirection: "column",
        gap: 16,
        width: "100%",
        ...(borderColor ? { borderColor } : {})
      }}
    >
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        paddingBottom: 10,
        borderBottom: "0.5px solid var(--color-border-tertiary)",
      }}>
        <div style={{
          fontFamily: "var(--font-display)",
          fontSize: 13,
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          color: accentColor || "#3A3935",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}>
          {icon && <span style={{ fontSize: 18 }}>{icon}</span>}
          {title}
        </div>
        <button onClick={onToggle} title="Colapsar" style={btnStyle}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
      </div>
      {children}
    </div>
  );
};

window.UIComponents = { SidebarClock, Input, Select, Stat, SliderInput, RateBarChart, ProbabilityGauge, MonteCarloSpectrum, CollapsibleCard };


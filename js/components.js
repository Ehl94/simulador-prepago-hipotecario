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
  const hue = probability * 120; // 0 red to 120 green
  const color = `hsl(${hue}, 70%, 40%)`;
  
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: 12, background: "var(--color-background-secondary)", borderRadius: 8, border: "1px solid var(--color-border-tertiary)", width: "100%" }}>
      <div style={{ position: "relative", width: 140, height: 75, overflow: "hidden", display: "flex", justifyContent: "center" }}>
        <svg width="140" height="140" viewBox="0 0 140 140" style={{ transform: "rotate(-180deg)" }}>
          <circle cx="70" cy="70" r="60" fill="none" stroke="var(--color-border-tertiary)" strokeWidth="12" />
          <circle 
            cx="70" 
            cy="70" 
            r="60" 
            fill="none" 
            stroke={color} 
            strokeWidth="12" 
            strokeDasharray={`${Math.PI * 60}`}
            strokeDashoffset={`${Math.PI * 60 * (1 - probability)}`}
            style={{ transition: "stroke-dashoffset 0.5s ease-out, stroke 0.5s ease-out" }}
          />
        </svg>
        <div style={{ position: "absolute", bottom: 0, textAlign: "center" }}>
          <div style={{ fontSize: 28, fontWeight: 900, color: color, lineHeight: 1 }}>{percentage}%</div>
          <div style={{ fontSize: 9, fontWeight: 700, color: "var(--color-text-secondary)", textTransform: "uppercase", marginTop: 2 }}>Éxito</div>
        </div>
      </div>
    </div>
  );
};

window.UIComponents = { SidebarClock, Input, Select, Stat, SliderInput, RateBarChart, ProbabilityGauge };


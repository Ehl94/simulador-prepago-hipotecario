// ── GLOBALS ─────────────────────────────────────────────────────────────────
// Variables compartidas por todos los componentes de la app.
// Este archivo debe cargarse como el primer <script type="text/babel">.

const { useState, useMemo, useEffect } = React;

// ── FORMATEADORES ────────────────────────────────────────────────────────────
const fmt = (n, d = 1) => n?.toLocaleString("es-CL", { minimumFractionDigits: d, maximumFractionDigits: d });
const fmtM = (m) => {
  const a = Math.floor(m / 12), mo = m % 12;
  return a > 0 ? `${a} ${a === 1 ? "Año" : "Años"} ${mo > 0 ? mo + " " + (mo === 1 ? "Mes" : "Meses") : ""}`.trim() : `${mo} ${mo === 1 ? "Mes" : "Meses"}`;
};
const fmtCLP = (n) => n?.toLocaleString("es-CL", { style: "currency", currency: "CLP", minimumFractionDigits: 0, maximumFractionDigits: 0 });

// ── CHART COLOR TOKENS ────────────────────────────────────────────────────────
const chartColors = {
  sinPrepago:      "#AEACA6", // Gray 400
  conPrepagoPlazo: "#185FA5", // Blue 600 institutional
  conPrepagoCuota: "#3B6D11", // Emerald 600 BlackRock green
  grid:  "rgba(0,0,0,0.06)",
  text:  "#6B6860",
  card:  "#FAFAF9",
};

// ── OPCIONES DE SELECTS ───────────────────────────────────────────────────────
const costosPrepagoOpciones = [
  { value: "1.5", label: "1,5 meses de interés por prepago" },
  { value: "0",   label: "Sin costo de prepago" }
];

// Attach to window for global availability
window.fmt = fmt;
window.fmtM = fmtM;
window.fmtCLP = fmtCLP;
window.chartColors = chartColors;
window.costosPrepagoOpciones = costosPrepagoOpciones;
window.useState = useState;
window.useMemo = useMemo;
window.useEffect = useEffect;


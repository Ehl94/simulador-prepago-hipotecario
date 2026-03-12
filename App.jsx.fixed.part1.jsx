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

const Stat = ({ label, value, sub, colorClass = "cyan", isBig = false }) => (
    <div className={`stat-box ${colorClass}`}>
        <span className="stat-label">{label}</span>
        <span className={`stat-value ${isBig ? "big" : ""}`}>{value}</span>
        {sub && <span className="stat-sub">{sub}</span>}
    </div>
);

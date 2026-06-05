// ── TABLA DE AMORTIZACIÓN MENSUAL ────────────────────────────────────────────
// Depende de: globals.js (fmt, fmtCLP)

const { fmt, fmtCLP } = window;

const TablaAmortizacion = ({ detalle, historial = [], mesesPagados = 0, startYear, startMonth, seguros, moneda = "UF", valorUF = 38000 }) => {
  const filaVigenteRef     = React.useRef(null);
  const scrollContainerRef = React.useRef(null);

  // Unir historia ya pagada + filas futuras del detalleMensual
  const todasLasFilas = React.useMemo(() => [
    ...historial,
    ...(detalle || []).map(d => ({ ...d, mes: mesesPagados + d.mes }))
  ], [historial, detalle, mesesPagados]);

  // Calcular año calendario para cada fila
  const getCalYear = (mesAbsoluto) => {
    if (!startYear) return Math.floor((mesAbsoluto - 1) / 12) + 1;
    const d = new Date(startYear, (startMonth || 1) - 1);
    d.setMonth(d.getMonth() + mesAbsoluto - 1);
    return d.getFullYear();
  };

  // Scroll solo dentro del contenedor — no mueve la página
  React.useEffect(() => {
    const fila      = filaVigenteRef.current;
    const contenedor = scrollContainerRef.current;
    if (fila && contenedor) {
      const offset = fila.offsetTop - contenedor.clientHeight / 2 + fila.clientHeight / 2;
      contenedor.scrollTop = Math.max(0, offset);
    }
  }, [mesesPagados]);

  if (!todasLasFilas.length) return null;

  const formatVal      = (val)       => moneda === "CLP" ? fmtCLP(val * valorUF) : `UF ${fmt(val, 2)}`;
  const formatSmallVal = (val, dec = 0) => moneda === "CLP" ? fmtCLP(val * valorUF) : `UF ${fmt(val, dec)}`;

  return (
    <div className="animate-fade" style={{ overflow: "hidden", borderRadius: 12, border: "1px solid #ECEAE6" }}>
      <div ref={scrollContainerRef} style={{ overflowX: "auto", maxHeight: "calc(100vh - 300px)", overflowY: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, fontFamily: "Inter", textAlign: "right" }}>
          <thead style={{ position: "sticky", top: 0, background: "#F3F2F0", zIndex: 10 }}>
            <tr style={{ color: "#6B6860", textTransform: "uppercase", fontSize: 10, letterSpacing: "0.05em" }}>
              <th style={{ padding: "12px 16px", textAlign: "center", borderBottom: "2px solid #E5E7EB" }}>Mes</th>
              <th style={{ padding: "12px 16px", textAlign: "center", borderBottom: "2px solid #E5E7EB" }}>Año</th>
              <th style={{ padding: "12px 16px", borderBottom: "2px solid #E5E7EB" }}>Dividendo Total</th>
              <th style={{ padding: "12px 16px", borderBottom: "2px solid #E5E7EB" }}>Interés</th>
              <th style={{ padding: "12px 16px", borderBottom: "2px solid #E5E7EB" }}>Amortización</th>
              <th style={{ padding: "12px 16px", borderBottom: "2px solid #E5E7EB", color: "#3B6D11" }}>Prepago</th>
              <th style={{ padding: "12px 16px", borderBottom: "2px solid #E5E7EB", color: "#A32D2D" }}>Multa</th>
              <th style={{ padding: "12px 16px", borderBottom: "2px solid #E5E7EB" }}>Saldo Final</th>
            </tr>
          </thead>
          <tbody>
            {todasLasFilas.map((d) => {
              const mesAbs    = d.mes;
              const esVigente = mesAbs === mesesPagados + 1;
              const esPagado  = d.esPagado === true;
              const calYear   = getCalYear(mesAbs);

              let rowBg = "transparent";
              if (esVigente)       rowBg = "#EDE8E0";
              else if (esPagado)   rowBg = "#F3F2F0";
              else if (d.prepago > 0) rowBg = "rgba(59, 109, 17, 0.04)";

              return (
                <tr
                  key={mesAbs}
                  ref={esVigente ? filaVigenteRef : null}
                  style={{
                    borderBottom: esVigente ? "2px solid #185FA5" : "1px solid #ECEAE6",
                    borderTop:    esVigente ? "2px solid #185FA5" : "none",
                    background: rowBg,
                    color:   esPagado ? "#AEACA6" : "#1A1915",
                    opacity: esPagado ? 0.7 : 1,
                    transition: "background 0.15s",
                    position: "relative"
                  }}
                >
                  <td style={{ padding: "10px 16px", textAlign: "center", color: esVigente ? "#185FA5" : esPagado ? "#D1D5DB" : "#AEACA6", fontWeight: esVigente ? 800 : 400 }}>
                    {mesAbs}
                    {esVigente && <span style={{ marginLeft: 4, fontSize: 9, background: "#185FA5", color: "#FFFFFF", borderRadius: 4, padding: "1px 4px", fontWeight: 800 }}>HOY</span>}
                  </td>
                  <td style={{ padding: "10px 16px", textAlign: "center", fontWeight: 600 }}>{calYear}</td>
                  <td style={{ padding: "10px 16px" }}>{formatVal(d.dividendoTotal ?? (d.cuotaBase + seguros))}</td>
                  <td style={{ padding: "10px 16px", color: esPagado ? "inherit" : "#6B6860" }}>{formatVal(d.interes)}</td>
                  <td style={{ padding: "10px 16px" }}>{formatVal(d.amortizacion)}</td>
                  <td style={{ padding: "10px 16px", color: "#3B6D11", fontWeight: 700 }}>
                    {d.prepago > 0 ? `+${formatSmallVal(d.prepago, 0)}` : "—"}
                  </td>
                  <td style={{ padding: "10px 16px", color: "#A32D2D" }}>
                    {d.multa > 0 ? formatVal(d.multa) : "—"}
                  </td>
                  <td style={{ padding: "10px 16px", fontWeight: 700 }}>{formatVal(d.saldo)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

window.Tabla = { TablaAmortizacion };


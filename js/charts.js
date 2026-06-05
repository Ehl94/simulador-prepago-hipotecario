// ── GRÁFICO SALDO, GRÁFICO CUOTAS, GRÁFICO ESCENARIOS ──────────────────────────────────
// Depende de: globals.js (fmt, chartColors), financial_logic.js

const { fmt, chartColors } = window;

    // ── GRÁFICO (NATIVE CHART.JS) ────────────────────────────────────────────────
    const GraficoSaldo = ({ evolucionSin, evolucionPlazo, evolucionCuota, mesesRestantes, saldoInicial, cr }) => {
      const chartRef = React.useRef(null);
      const chartInstance = React.useRef(null);

      React.useEffect(() => {
        if (!chartRef.current || !cr) return;
        const { tasaMensual, cuotaMensual } = window.FinancialLogic;

        const dataMap = {};
        const mp = +cr.mesesPagados;
        const r = tasaMensual(+cr.tna);
        const cuota = cuotaMensual(+cr.capital, +cr.tna, +cr.plazo);

        let saldoHist = +cr.capital;
        for (let i = 0; i <= mp; i++) {
          dataMap[i] = { mes: i, sinPrepago: Math.round(saldoHist), conPrepagoPlazo: Math.round(saldoHist), conPrepagoCuota: Math.round(saldoHist) };
          if (i < mp) saldoHist -= Math.min(cuota - saldoHist * r, saldoHist);
        }

        evolucionSin.forEach(p => {
          const m = p.mes + mp;
          if (!dataMap[m]) dataMap[m] = { mes: m };
          dataMap[m].sinPrepago = Math.round(p.saldo);
        });

        if (evolucionPlazo) {
          evolucionPlazo.forEach(p => {
            const m = p.mes + mp;
            if (!dataMap[m]) dataMap[m] = { mes: m };
            dataMap[m].conPrepagoPlazo = Math.round(p.saldo);
          });
        }

        if (evolucionCuota) {
          evolucionCuota.forEach(p => {
            const m = p.mes + mp;
            if (!dataMap[m]) dataMap[m] = { mes: m };
            dataMap[m].conPrepagoCuota = Math.round(p.saldo);
          });
        }

        const rawData = Object.values(dataMap).sort((a, b) => a.mes - b.mes);
        const labels = rawData.map(d => {
          if (d.mes === 0) return "Inicio";
          if (d.mes === mp) return "Hoy";
          if (d.mes % 12 === 0) return `Año ${d.mes / 12}`;
          return d.mes;
        });

        if (chartInstance.current) {
          chartInstance.current.destroy();
        }

        const ctx = chartRef.current.getContext('2d');

        // Create Gradients for Corporate Look
        const gradSin = ctx.createLinearGradient(0, 0, 0, 400);
        gradSin.addColorStop(0, 'rgba(174, 172, 166, 0.12)');
        gradSin.addColorStop(1, 'rgba(174, 172, 166, 0.01)');

        const gradPlazo = ctx.createLinearGradient(0, 0, 0, 400);
        gradPlazo.addColorStop(0, 'rgba(24, 95, 165, 0.14)');
        gradPlazo.addColorStop(1, 'rgba(24, 95, 165, 0.01)');

        const gradCuota = ctx.createLinearGradient(0, 0, 0, 400);
        gradCuota.addColorStop(0, 'rgba(59, 109, 17, 0.14)');
        gradCuota.addColorStop(1, 'rgba(59, 109, 17, 0.01)');

        const endLinesPlugin = {
          id: 'endLines',
          afterDatasetsDraw(chart) {
            const { ctx: c, chartArea: { top, bottom, left, right }, scales: { x } } = chart;

            const drawVertical = (mes, color, text, yOffset = 0) => {
              const index = rawData.findIndex(d => d.mes === mes);
              if (index === -1) return;
              const xPos = x.getPixelForValue(index);
              if (xPos < left || xPos > right) return;

              const yBase = top + (bottom - top) * 0.2;
              const yPos = yBase + yOffset;

              c.save();

              // Shadow for the badge
              c.shadowColor = 'rgba(0, 0, 0, 0.12)';
              c.shadowBlur = 4;
              c.shadowOffsetY = 1;

              // Badge Background (Pill shape) - Glassmorphism
              const padding = 10;
              c.font = '700 10.5px Inter';
              const fullText = `Termino del Credito ${text}`;
              const textWidth = c.measureText(fullText).width;
              const badgeWidth = textWidth + (padding * 2);
              const badgeHeight = 22;

              c.beginPath();
              c.roundRect(xPos - badgeWidth / 2, yPos - badgeHeight / 2, badgeWidth, badgeHeight, 11);
              // semi-transparent background
              c.fillStyle = color.replace(')', ', 0.82)').replace('rgb', 'rgba');
              if (!color.includes('rgba')) {
                // Fallback if chartColors are hex
                c.fillStyle = color + 'D1';
              }
              c.fill();

              // Border for the badge
              c.strokeStyle = '#ffffff';
              c.lineWidth = 1.5;
              c.stroke();

              // Reset shadow for text and line
              c.shadowColor = 'transparent';

              // Vertical Line (Starts at bottom, ends at badge) - Subtler
              c.beginPath();
              c.lineWidth = 1;
              c.setLineDash([3, 3]);
              c.strokeStyle = color;
              c.globalAlpha = 0.6;
              c.moveTo(xPos, bottom);
              c.lineTo(xPos, yPos + badgeHeight / 2);
              c.stroke();
              c.globalAlpha = 1.0;

              // Text
              c.fillStyle = '#fff';
              c.textAlign = 'center';
              c.textBaseline = 'middle';
              c.fillText(fullText, xPos, yPos);

              c.restore();
            };

            const mpVal = +cr.mesesPagados;
            const currentYear = new Date().getFullYear();
            const currentMonth = new Date().getMonth();

            const simResults = [];
            if (evolucionPlazo && evolucionPlazo.length) {
              const simMes = evolucionPlazo[evolucionPlazo.length - 1].mes || 0;
              simResults.push({ mes: mpVal + simMes, type: 'plazo', color: chartColors.conPrepagoPlazo, year: currentYear + Math.floor((currentMonth + simMes) / 12) });
            }
            if (evolucionCuota && evolucionCuota.length) {
              const simMes = evolucionCuota[evolucionCuota.length - 1].mes || 0;
              simResults.push({ mes: mpVal + simMes, type: 'cuota', color: chartColors.conPrepagoCuota, year: currentYear + Math.floor((currentMonth + simMes) / 12) });
            }

            // Sort by month to handle collision detection predictably
            simResults.sort((a, b) => a.mes - b.mes);

            simResults.forEach((res, i) => {
              let offset = 0;
              // Increased threshold to 84 months (7 years) to account for badge width overlap
              if (i > 0 && Math.abs(res.mes - simResults[i - 1].mes) < 84) {
                offset = 55; // Increased staggering distance for maximum clarity
              }
              drawVertical(res.mes, res.color, res.year, offset);
            });
          }
        };

        chartInstance.current = new window.Chart(ctx, {
          type: 'line',
          plugins: [endLinesPlugin],
          data: {
            labels,
            datasets: [
              {
                label: 'Sin Prepago',
                data: rawData.map(d => d.sinPrepago),
                borderColor: chartColors.sinPrepago,
                backgroundColor: gradSin,
                borderWidth: 2,
                borderDash: [5, 5],
                fill: true,
                pointRadius: 0,
                pointHoverRadius: 6,
                pointHoverBorderWidth: 3,
                pointHoverBackgroundColor: '#FAFAF9',
                tension: 0.4
              },
              {
                label: 'Reduce Plazo',
                data: rawData.map(d => d.conPrepagoPlazo),
                borderColor: chartColors.conPrepagoPlazo,
                backgroundColor: gradPlazo,
                borderWidth: 3,
                fill: true,
                pointRadius: 0,
                pointHoverRadius: 8,
                pointHoverBorderWidth: 3,
                pointHoverBackgroundColor: '#FAFAF9',
                tension: 0.4
              },
              {
                label: 'Reduce Cuota',
                data: rawData.map(d => d.conPrepagoCuota),
                borderColor: chartColors.conPrepagoCuota,
                backgroundColor: gradCuota,
                borderWidth: 3,
                fill: true,
                pointRadius: 0,
                pointHoverRadius: 8,
                pointHoverBorderWidth: 3,
                pointHoverBackgroundColor: '#FAFAF9',
                tension: 0.4
              }
            ],
          },
          options: {
            layout: { padding: { top: 10, right: 20 } },
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'top',
                align: 'end',
                labels: {
                  color: '#6B6860',
                  font: { family: 'Inter', size: 12, weight: '600' },
                  usePointStyle: true,
                  boxWidth: 8,
                  boxHeight: 8
                }
              },
              tooltip: {
                mode: 'index',
                intersect: false,
                backgroundColor: '#FAFAF9',
                titleColor: '#1A1915',
                titleFont: { family: 'Inter', size: 14, weight: '700' },
                bodyColor: '#6B6860',
                bodyFont: { family: 'Inter', size: 13 },
                borderColor: '#DDDAD3',
                borderWidth: 1,
                padding: 12,
                cornerRadius: 8,
                boxPadding: 6,
                usePointStyle: true,
                callbacks: {
                  label: (context) => ` ${context.dataset.label}: UF ${fmt(context.parsed.y, 0)}`
                }
              },
              hoyLine: {
                color: '#A32D2D',
                dash: [4, 4],
                width: 2
              }
            },
            scales: {
              x: {
                grid: {
                  display: true,
                  color: 'rgba(0, 0, 0, 0.04)',
                  drawBorder: false
                },
                ticks: {
                  color: '#AEACA6',
                  font: { family: 'Inter', size: 11 },
                  maxTicksLimit: 12,
                  callback: function (value, index) {
                    const mes = rawData[index].mes;
                    if (mes === 0) return "Inicio";
                    if (mes === +cr.mesesPagados) return "Hoy";
                    if (mes % 12 === 0) return `Año ${mes / 12}`;
                    return null;
                  }
                }
              },
              y: {
                border: { display: false },
                grid: {
                  color: 'rgba(0, 0, 0, 0.05)',
                  drawTicks: false
                },
                ticks: {
                  color: '#6B6860',
                  font: { family: 'Inter', size: 13, weight: '500' },
                  padding: 14,
                  callback: (v) => `UF ${fmt(v, 0)}`
                }
              }
            },
            interaction: { mode: 'nearest', axis: 'x', intersect: false }
          }
        });

        return () => {
          if (chartInstance.current) {
            chartInstance.current.destroy();
          }
        };
      }, [evolucionSin, evolucionPlazo, evolucionCuota, mesesRestantes, saldoInicial, cr]);

      return (
        <div style={{ height: 400, padding: "10px 0", position: 'relative' }}>
          <canvas ref={chartRef}></canvas>
        </div>
      );
    };

    // ── GRÁFICO BARRAS CUOTAS (NUEVO) ──────────────────────────────────────────
    const GraficoCuotas = ({ evolucionCuota, cuotaBase, destino, valorUF, moneda = "UF" }) => {
      const chartRef = React.useRef(null);
      const chartInstance = React.useRef(null);

      React.useEffect(() => {
        if (!chartRef.current || !evolucionCuota || evolucionCuota.length === 0) return;

        if (chartInstance.current) {
          chartInstance.current.destroy();
        }

        const isCLP = moneda === "CLP" && valorUF;
        const conv = (v) => isCLP ? v * valorUF : v;
        const fmtVal = (v) => isCLP ? `$${Math.round(v).toLocaleString('es-CL')}` : `UF ${fmt(v, 1)}`;
        const fmtVal2 = (v) => isCLP ? `$${Math.round(v).toLocaleString('es-CL')}` : `UF ${fmt(v, 2)}`;
        const prefix = isCLP ? "CLP" : "UF";
        const cuotaBaseConv = conv(cuotaBase);

        const ctx = chartRef.current.getContext('2d');
        const labels = evolucionCuota.map(d => `Año ${d.ano}`);

        // Gradient fill for the prepago bars (Corporate Blue)
        const gradCon = ctx.createLinearGradient(0, 0, 0, 400);
        gradCon.addColorStop(0, 'rgba(24, 95, 165, 0.75)');
        gradCon.addColorStop(1, 'rgba(24, 95, 165, 0.15)');

        // Custom plugin: draw horizontal reference line + value labels on bars
        const refLinePlugin = {
          id: 'refLine',
          afterDatasetsDraw(chart) {
            const { ctx: c, chartArea: { left, right, top, bottom }, scales: { y } } = chart;
            if (!cuotaBaseConv || !y) return;

            const yPos = y.getPixelForValue(cuotaBaseConv);
            c.save();
            c.beginPath();
            c.setLineDash([6, 4]);
            c.strokeStyle = '#A32D2D';
            c.lineWidth = 2;
            c.moveTo(left, yPos);
            c.lineTo(right, yPos);
            c.stroke();
            c.setLineDash([]);

            c.fillStyle = '#A32D2D';
            c.font = '600 12px Inter';
            c.textAlign = 'right';
            c.fillText(`Cuota fija: ${fmtVal(cuotaBaseConv)}`, right - 4, yPos - 8);
            c.restore();
          }
        };

        chartInstance.current = new window.Chart(ctx, {
          type: 'bar',
          plugins: [refLinePlugin],
          data: {
            labels,
            datasets: [
              {
                label: 'Cuota con Prepago',
                data: evolucionCuota.map(d => conv(d.cuotaCon)),
                backgroundColor: gradCon,
                borderColor: '#185FA5',
                borderWidth: 0,
                borderRadius: 6,
                borderSkipped: false,
                barPercentage: 0.55,
                categoryPercentage: 0.7
              }
            ],
          },
          options: {
            layout: { padding: { top: 30, right: 16, left: 16 } },
            responsive: true,
            maintainAspectRatio: false,
            animation: {
              duration: 800,
              easing: 'easeOutQuart'
            },
            plugins: {
              legend: {
                display: true,
                position: 'top',
                align: 'end',
                labels: {
                  color: '#6B6860',
                  font: { family: 'Inter', size: 12, weight: '600' },
                  usePointStyle: true,
                  boxWidth: 10,
                  generateLabels: () => [
                    { text: 'Cuota Original (fija)', fillStyle: '#A32D2D', strokeStyle: '#A32D2D', lineWidth: 2, lineDash: [6, 4], pointStyle: 'line', fontColor: '#6B6860' },
                    { text: 'Cuota con Prepago', fillStyle: 'rgba(24, 95, 165, 0.75)', strokeStyle: '#185FA5', lineWidth: 0, pointStyle: 'rect', fontColor: '#6B6860' }
                  ]
                }
              },
              tooltip: {
                mode: 'index',
                intersect: false,
                backgroundColor: '#FAFAF9',
                titleColor: '#1A1915',
                titleFont: { family: 'Inter', size: 13, weight: '700' },
                bodyColor: '#6B6860',
                bodyFont: { family: 'Inter', size: 12 },
                borderColor: '#DDDAD3',
                borderWidth: 1,
                padding: 10,
                cornerRadius: 6,
                boxPadding: 4,
                displayColors: false,
                callbacks: {
                  title: (items) => items[0]?.label || '',
                  beforeBody: () => [`Cuota Original: ${fmtVal2(cuotaBaseConv)}`],
                  label: (context) => {
                    const val = context.parsed.y;
                    const diff = cuotaBaseConv - val;
                    const pct = ((diff / cuotaBaseConv) * 100).toFixed(1);
                    if (val <= 0) return 'Crédito liquidado';
                    return [`Cuota Proyectada: ${fmtVal2(val)}  (↓${pct}%)`];
                  },
                  afterBody: (items) => {
                    const val = items[0]?.parsed?.y || 0;
                    const diff = cuotaBaseConv - val;
                    return diff > 0 ? [`Ahorro mensual: ${fmtVal2(diff)}`] : [];
                  }
                }
              }
            },
            scales: {
              x: {
                grid: { display: false },
                border: { display: false },
                ticks: {
                  color: '#AEACA6',
                  font: { family: 'Inter', size: 11, weight: '500' },
                  maxRotation: 0
                }
              },
              y: {
                border: { display: false },
                beginAtZero: true,
                suggestedMax: cuotaBaseConv * 1.15,
                grid: { color: 'rgba(0, 0, 0, 0.05)', drawTicks: false },
                ticks: {
                  color: '#6B6860',
                  font: { family: 'Inter', size: 13, weight: '500' },
                  padding: 14,
                  callback: (v) => isCLP ? `$${Math.round(v/1000)}k` : `UF ${fmt(v, 1)}`
                }
              }
            },
            interaction: { mode: 'index', axis: 'x', intersect: false }
          }
        });

        return () => {
          if (chartInstance.current) chartInstance.current.destroy();
        };
      }, [evolucionCuota, cuotaBase, moneda, valorUF]);

      return (
        <div style={{ height: "100%", position: "relative" }}>
          <canvas ref={chartRef}></canvas>
        </div>
      );
    };

    // ── GRÁFICO ESCENARIOS (MULTI-LÍNEA) ─────────────────────────────────────────
    const GraficoEscenarios = ({ saldoActual, cr, mesesRestantes, pr, cuotaBase }) => {
      const chartRef = React.useRef(null);
      const chartInstance = React.useRef(null);

      React.useEffect(() => {
        if (!chartRef.current) return;
        if (chartInstance.current) chartInstance.current.destroy();

        const ctx = chartRef.current.getContext('2d');
        const { simularPrepago, calcularInteresesTotales, findOptimalAmount } = window.FinancialLogic;
        const minPrepago = Math.ceil(saldoActual * 0.05);

        const montoOptimo = findOptimalAmount(saldoActual, +cr.tna, mesesRestantes, pr.frecuencia, +pr.mesInicio - +cr.mesesPagados, pr.destino, cuotaBase, +cr.costoPrepago, +cr.seguros);

        const candidates = new Set([minPrepago, montoOptimo]);
        const medio = Math.round(Math.max(montoOptimo * 1.5, minPrepago * 3));
        if (medio < saldoActual && medio !== montoOptimo) candidates.add(medio);
        const agresivo = Math.round(Math.max(montoOptimo * 3, minPrepago * 6));
        if (agresivo < saldoActual && agresivo !== montoOptimo && agresivo !== medio) candidates.add(agresivo);
        [minPrepago * 2, montoOptimo * 2].map(Math.round).forEach(e => {
          if (candidates.size < 4 && e > minPrepago && e < saldoActual && !candidates.has(e)) candidates.add(e);
        });
        const montos = [...candidates].sort((a, b) => a - b).slice(0, 4);

        // Colors for the 4 curves
        const curveColors = ['#BA7517', '#3B6D11', '#185FA5', '#534AB7'];

        // Generate datasets: baseline + 4 scenarios
        // Baseline: sin prepago
        const baseSim = simularPrepago(saldoActual, +cr.tna, mesesRestantes, 0, pr.frecuencia, 0, pr.destino, cuotaBase, +cr.costoPrepago, +cr.seguros);
        const basePoints = baseSim.evolucionSin.filter((_, i) => i % 6 === 0 || i === baseSim.evolucionSin.length - 1)
          .map(p => ({ x: p.mes, y: p.saldo }));

        const datasets = [{
          label: 'Sin Prepago',
          data: basePoints,
          borderColor: '#AEACA6',
          borderWidth: 2,
          borderDash: [6, 4],
          pointRadius: 0,
          tension: 0.3,
          fill: false
        }];

        montos.forEach((m, i) => {
          const s = simularPrepago(saldoActual, +cr.tna, mesesRestantes, m, pr.frecuencia, +pr.mesInicio - +cr.mesesPagados, pr.destino, cuotaBase, +cr.costoPrepago, +cr.seguros);
          const points = s.evolucionCon.filter((_, j) => j % 6 === 0 || j === s.evolucionCon.length - 1)
            .map(p => ({ x: p.mes, y: p.saldo }));
          datasets.push({
            label: `UF ${m}${m === montoOptimo ? ' (Óptimo)' : ''}`,
            data: points,
            borderColor: curveColors[i],
            borderWidth: m === montoOptimo ? 3 : 2,
            pointRadius: 0,
            tension: 0.3,
            fill: false
          });
        });

        chartInstance.current = new window.Chart(ctx, {
          type: 'line',
          data: { datasets },
          options: {
            layout: { padding: { top: 10, right: 16, left: 8 } },
            responsive: true,
            maintainAspectRatio: false,
            animation: { duration: 600, easing: 'easeOutQuart' },
            plugins: {
              legend: {
                position: 'top', align: 'end',
                labels: {
                  color: '#6B6860',
                  font: { family: 'Inter', size: 11, weight: '600' },
                  usePointStyle: true, boxWidth: 8, padding: 16
                }
              },
              tooltip: {
                mode: 'nearest',
                intersect: false,
                backgroundColor: '#FAFAF9',
                titleColor: '#1A1915',
                titleFont: { family: 'Inter', size: 13, weight: '700' },
                bodyColor: '#6B6860',
                bodyFont: { family: 'Inter', size: 12 },
                borderColor: '#DDDAD3',
                borderWidth: 1,
                padding: 10,
                cornerRadius: 6,
                displayColors: true,
                callbacks: {
                  title: (items) => `Mes ${items[0]?.parsed?.x || 0}`,
                  label: (ctx) => ` ${ctx.dataset.label}: UF ${fmt(ctx.parsed.y, 0)}`
                }
              }
            },
            scales: {
              x: {
                type: 'linear',
                title: { display: true, text: 'Meses', color: '#AEACA6', font: { family: 'Inter', size: 11 } },
                grid: { display: false },
                border: { display: false },
                ticks: {
                  color: '#AEACA6',
                  font: { family: 'Inter', size: 11 },
                  maxRotation: 0,
                  callback: (v) => {
                    const a = Math.floor(v / 12);
                    return a > 0 ? `Año ${a}` : `${v}m`;
                  }
                }
              },
              y: {
                border: { display: false },
                beginAtZero: true,
                grid: { color: 'rgba(0, 0, 0, 0.05)', drawTicks: false },
                ticks: {
                  color: '#AEACA6',
                  font: { family: 'Inter', size: 11 },
                  padding: 10,
                  callback: (v) => `UF ${fmt(v, 0)}`
                }
              }
            },
            interaction: { mode: 'nearest', axis: 'x', intersect: false }
          }
        });

        return () => { if (chartInstance.current) chartInstance.current.destroy(); };
      }, [saldoActual, cr, mesesRestantes, pr, cuotaBase]);

      return (
        <div style={{ height: "100%", position: "relative" }}>
          <canvas ref={chartRef}></canvas>
        </div>
      );
    };

window.Charts = { GraficoSaldo, GraficoCuotas, GraficoEscenarios };


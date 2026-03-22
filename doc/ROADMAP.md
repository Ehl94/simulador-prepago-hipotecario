# Roadmap — Simulador de Prepago Hipotecario
**Actualizado:** 2026-03-22
**Archivo activo:** `index.html` (React 18 CDN + Chart.js, sin build tool)

---

> Cada fase es **independiente** y puede implementarse en cualquier orden sin afectar las demás.
> Para activar una fase basta con indicar: *"implementa la fase N"*.

---

## Fase 1 — Tabla de Amortización Completa (Historial + Proyección)

**Objetivo:** Mostrar una tabla mensual unificada que combine los meses ya pagados (historial) con los meses futuros (con y sin prepago), dentro de una nueva pestaña "Detalle".

**Alcance:**
- Usar `FinancialLogic.calcularHistorial()` (ya existe) para las filas pasadas, marcadas como "Pagado".
- Concatenar con `detalleMensual` de `simularPrepago()` para las filas futuras.
- Columnas: Mes, Año, Cuota, Interés, Amortización, Prepago, Multa, Saldo.
- Filtros: "Todos / Solo histórico / Solo proyección / Con prepago".
- Botón de descarga CSV (exportación nativa con `Blob` + `<a download>`).
- Paginación de 24 filas por vista (sin librería externa).

**Archivos a modificar:** `index.html` únicamente (nueva pestaña + componente `TablaDetalle`).
**Dependencias externas:** Ninguna.

---

## Fase 2 — Persistencia con localStorage

**Objetivo:** Guardar y restaurar automáticamente el estado del simulador entre sesiones de navegador.

**Alcance:**
- Al cambiar cualquier input, serializar el estado a `localStorage` con clave `simHipotecario_v1`.
- Al cargar la página, leer el estado guardado y pre-rellenar el formulario.
- Botón "Limpiar sesión" en la barra lateral que resetea a valores por defecto.
- Manejo de versión: si el esquema cambia, ignorar datos incompatibles (migración silenciosa).
- No guardar resultados calculados, solo los inputs del usuario.

**Archivos a modificar:** `index.html` únicamente (hook `useEffect` en el componente `App`).
**Dependencias externas:** Ninguna.

---

## Fase 3 — Comparador de Escenarios (Hasta 3 Estrategias)

**Objetivo:** Permitir definir hasta 3 configuraciones de prepago distintas y comparar sus resultados en paralelo en una nueva pestaña "Comparar".

**Alcance:**
- Panel lateral con tabs "Escenario A / B / C", cada uno con sus propios inputs de prepago.
- Todos los escenarios comparten los datos base del crédito (capital, tasa, plazo).
- Tabla resumen side-by-side: meses ahorrados, intereses ahorrados, costo multas, ahorro neto.
- Gráfico de barras agrupadas (Chart.js) comparando intereses totales de cada escenario vs línea base.
- Indicador visual del escenario óptimo (menor costo total).

**Archivos a modificar:** `index.html` únicamente (nueva pestaña + estado adicional).
**Dependencias externas:** Ninguna (usa Chart.js ya cargado).

---

## Fase 4 — Mapa de Calor de Sensibilidad

**Objetivo:** Mostrar una grilla interactiva donde el eje X es el monto de prepago y el eje Y es la tasa de interés, y cada celda muestra el ahorro neto total.

**Alcance:**
- Rango de prepago: 0 a 2× el monto actual, en 8 pasos.
- Rango de tasa: TNA actual ± 3 puntos, en 7 pasos.
- Cada celda calculada con `FinancialLogic.simularPrepago()`.
- Color gradient: verde oscuro (máximo ahorro) → rojo (mínimo ahorro / pérdida).
- Al hacer hover sobre una celda, mostrar tooltip con desglose: intereses ahorrados, multas, meses reducidos.
- La celda de los parámetros actuales del usuario se resalta con borde navy.

**Archivos a modificar:** `index.html` únicamente (nueva pestaña + componente `MapaCalor`).
**Dependencias externas:** Ninguna.

---

## Fase 5 — Calculadora de Punto de Equilibrio (Break-Even)

**Objetivo:** Determinar en qué mes el ahorro acumulado por prepagar supera el costo de la multa, respondiendo: *"¿Cuándo vale la pena prepagar?"*.

**Alcance:**
- Gráfico de líneas (Chart.js): "Ahorro acumulado por prepago" vs "Costo acumulado (multa + costo oportunidad)".
- La intersección de ambas líneas = punto de equilibrio → anotado con una línea vertical y etiqueta.
- Si no hay intersección dentro del plazo restante, mostrar alerta "El prepago no se recupera en este plazo".
- Slider interactivo para ajustar la tasa de retorno de inversión alternativa y ver cómo cambia el break-even.
- Tabla resumen: mes break-even, ahorro a término, rentabilidad neta.

**Archivos a modificar:** `index.html` únicamente (nueva pestaña + componente `BreakEven`).
**Dependencias externas:** Ninguna.

---

## Fase 6 — Simulador de Refinanciamiento

**Objetivo:** Comparar si conviene refinanciar el crédito (nueva tasa + costos de refinanciamiento) versus mantener el crédito actual con prepagos.

**Alcance:**
- Nuevos inputs: tasa nueva (TNA %), costo de refinanciamiento (UF fijo), plazo nuevo (meses).
- Calcula el costo total del crédito refinanciado vs el costo total del crédito actual con prepago configurado.
- Gráfico de área (Chart.js): evolución del saldo comparando ambas opciones.
- Tabla comparativa: cuota mensual, intereses totales, costo total (intereses + refinanciamiento), meses.
- Recomendación automática con umbral: refinanciar si el ahorro neto > 10× el costo de refinanciamiento.

**Archivos a modificar:** `index.html` únicamente (nueva pestaña + componente `Refinanciamiento`).
**Dependencias externas:** Ninguna.

---

## Fase 7 — Exportador Excel / CSV Avanzado

**Objetivo:** Generar un archivo `.xlsx` o `.csv` multi-hoja con todos los datos de la simulación.

**Alcance:**
- **Opción A (CSV):** Un CSV por pestaña de datos (historial, proyección, cuotas anuales). Descarga nativa con `Blob`.
- **Opción B (XLSX):** Un único archivo Excel con múltiples hojas usando la librería SheetJS (CDN, ~800 KB), sin build tool.
  Hojas: "Resumen", "Historial", "Proyección con prepago", "Proyección sin prepago", "Escenarios".
- Botón en sidebar "Exportar Excel" independiente del PDF.
- Formato de celdas: moneda UF con 2 decimales, porcentajes, fechas relativas.

**Archivos a modificar:** `index.html` (nuevo botón + función `exportarExcel`).
**Dependencias externas:** SheetJS vía CDN (solo para opción B).

---

## Fase 8 — Dashboard de KPIs en Tiempo Real

**Objetivo:** Reemplazar o complementar el panel de resultados actual con tarjetas de métricas que se recalculan mientras el usuario mueve los sliders.

**Alcance:**
- 6 KPI cards con animación de número al cambiar (CSS transition): Ahorro Total, Meses Reducidos, Multa Total, Tasa Efectiva, Dividendo Nuevo, ROI Prepago %.
- Indicadores de tendencia (flecha ↑↓) comparando con la última simulación guardada.
- Mini-sparkline de saldo (SVG inline, sin librería) dentro de cada card.
- Actualización en tiempo real con `useMemo` sin necesidad de presionar "Calcular".
- Modo "comparación rápida": hover sobre una card muestra el valor de la situación sin prepago.

**Archivos a modificar:** `index.html` únicamente (nuevo componente `KPIDashboard`, refactor de estado a `useMemo`).
**Dependencias externas:** Ninguna.

---

## Resumen de Fases

| Fase | Nombre | Dificultad | Impacto Usuario |
|------|--------|-----------|-----------------|
| 1 | Tabla de Amortización Completa | Media | Alto |
| 2 | Persistencia localStorage | Baja | Alto |
| 3 | Comparador de Escenarios | Media | Alto |
| 4 | Mapa de Calor de Sensibilidad | Media | Medio |
| 5 | Calculadora Punto de Equilibrio | Media | Alto |
| 6 | Simulador de Refinanciamiento | Alta | Medio |
| 7 | Exportador Excel / CSV | Media | Medio |
| 8 | Dashboard KPIs Tiempo Real | Media | Alto |

**Orden sugerido por valor/esfuerzo:** 2 → 1 → 8 → 5 → 3 → 4 → 7 → 6

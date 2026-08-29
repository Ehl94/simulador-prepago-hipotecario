# OptiHAUZ — Simulador de Prepago Hipotecario

OptiHAUZ es una herramienta interactiva de grado profesional diseñada para ayudar a propietarios de viviendas, inversionistas y asesores financieros a evaluar el impacto real de realizar pagos anticipados (prepagos) en créditos hipotecarios en Chile.

A diferencia de los simuladores bancarios tradicionales, esta herramienta ofrece una visualización profunda del ahorro en intereses, la reducción de plazos y el comportamiento de la deuda bajo distintos escenarios económicos, integrando variables complejas como la inflación (UF), el costo impositivo y el análisis estocástico.

---

## 🚀 Características Principales

*   🎛️ **Controles Interactivos: Incluye selector de fecha de inicio de crédito sincronizado con los meses transcurridos y etiquetas dinámicas del mínimo legal chileno (5% del saldo insoluto).
*   💵 **Soporte UF/CLP Dinámico**: Conversión automática y visualización en tiempo real de valores en Pesos Chilenos (CLP) basados en el valor diario de la UF.
*   🔍 **Análisis de Arbitraje de Tasas (Escenario 1)**: Criterio de Fisher Modificado para calcular la inflación exacta de equilibrio (*break-even* $\pi^*$) donde amortizar deuda equivale a invertir en pesos (paridad nominal vs. real). Cuenta con un gráfico de barras comparativo (`RateBarChart`).
*   ⚖️ **Valoración & Riesgo Estocástico (Escenario 2)**:
    *   **Valor Presente Neto (VPN)**: Descuenta los dividendos futuros a valor de hoy utilizando tu tasa de inversión alternativa como costo de oportunidad del capital.
    *   **Simulación Monte Carlo Estabilizada**: Proyección determinista basada en sigmoides ante estrés de mercado (volatilidad $\sigma$), graficando el espectro de ahorros P10-P90 y un indicador de aguja semicircular (`ProbabilityGauge`) interactivo.
*   📈 **Evolución Detallada**: Gráficos interactivos de saldos y dividendos construidos sobre **Chart.js** y **react-chartjs-2**, junto con una tabla completa de amortización mensual (conmutador UF/CLP).
*   💼 **Beneficio Tributario (Art. 55 bis)**: Módulo integrado que calcula la rebaja de impuestos sobre los intereses pagados, ajustándose según tramos de renta bruta y límites en Unidades Tributarias Anuales (UTA).

---

## 🛠️ Stack Tecnológico y Arquitectura

La aplicación está diseñada bajo una arquitectura **Zero-Build/Serverless**, cargando de forma directa en el navegador sin necesidad de herramientas de compilación pesadas como Webpack o Vite en desarrollo local:

*   **Core**: React 18 (Carga directa vía unpkg CDN).
*   **Transpilador**: Babel Standalone (Para compilación JIT de JSX en el navegador).
*   **Gráficos**: Chart.js + react-chartjs-2.
*   **Reportes**: html2pdf.js (Exportación local del DOM a PDF).
*   **Diseño Visual**: Estilos CSS Vanilla con variables dinámicas (`:root`) y diseño *Warm Neutral / Glassmorphism* de alto contraste.
*   **Modularización (Fase 1)**: Código fragmentado en responsabilidades únicas para evitar bugs y optimizar el mantenimiento del estado React.

---

## 📁 Estructura del Proyecto

```bash
simulador-prepago-hipotecario/
├── index.html              # Shell HTML mínimo, imports CDN y carga modular de scripts con cache-busting.
├── css/
│   ├── app.css             # Estilos de la aplicación, variables y controles premium.
│   └── pdf-report.css      # Estilos del reporte PDF estilo McKinsey.
├── js/
│   ├── app.js              # Inicialización de React, orquestación del estado unificado (Fase 2) y vistas.
│   ├── financial_logic.js  # Motor matemático (amortización francesa, Fisher, VPN, tributario).
│   ├── components.js       # Componentes atómicos de UI (Input, Select, SliderInput, Gráficos visuales).
│   ├── escenarios.js       # Módulos de análisis "Arbitraje de Tasas" y "Valoración & Riesgo".
│   ├── charts.js           # Wrappers de gráficos dinámicos de Chart.js.
│   ├── tabla.js            # Componente de la tabla de amortización detallada.
│   ├── pdf-report.js       # Estructura del PDF McKinsey para impresión.
│   └── globals.js          # Helpers de formateo, colores y variables globales.
└── backups/                # Backups de seguridad del proyecto.
```

---

## 💻 Instalación y Uso Local

Al no requerir compilación previa de Node.js, puedes levantar el proyecto instantáneamente con cualquier servidor estático local:

1.  Clona el repositorio:
    ```bash
    git clone https://github.com/Ehl94/simulador-prepago-hipotecario.git
    cd simulador-prepago-hipotecario
    ```
2.  Levanta un servidor web estático (ejemplo con Python):
    ```bash
    python -m http.server 8080
    ```
3.  Abre tu navegador e ingresa a:
    `http://localhost:8080`

---

## 📜 Log de Cambios Recientes (Refactorización Completa)

### Versión 5.0 (Actual)
*   **Desacoplamiento Estético e Inyección CSS**: Eliminación de estilos inline ad-hoc y unificación bajo clases semánticas (`.segmented-control`, `.decision-box`, `.detail-row-group`, etc.).
*   **Sliders Premium & Homogeneización**: Sincronización y altura unificada de todos los inputs a `42px`. Sliders nativos estilizados con hit-boxes ergonómicos de `32px`.
*   **Monte Carlo Determinista**: Eliminación de números pseudoaleatorios en el render para prevenir parpadeos en React. Probabilidades estables basadas en sigmoides normales.
*   **Modularización Extrema**: División del archivo index monolítico de 3,500+ líneas en archivos `.js` y `.css` independientes expuestos mediante namespaces seguros en el objeto global `window`.
*   **Centralización Matemática**: Fórmulas de Fisher y VPN unificadas en `js/financial_logic.js` para asegurar consistencia perfecta entre la interfaz y el PDF impreso.

---

**Autor:** @Ehl94
**Licencia:** Libre para uso personal y educativo.

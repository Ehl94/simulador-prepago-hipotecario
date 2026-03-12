# Simulador de Prepago Hipotecario v4.0

Una herramienta interactiva profesional para simular escenarios de prepago en créditos hipotecarios, permitiendo evaluar el impacto financiero de diferentes estrategias de pago anticipado con precisión y visualizaciones modernas.

## 🚀 Novedades de la Versión 4.0

Esta versión representa una evolución significativa en la interfaz y capacidad de análisis de la herramienta:

- 📱 **Nueva Navegación Sidebar**: Interfaz moderna con controles agrupados en una barra lateral para una mejor experiencia de usuario.
- 💱 **Soporte Multimoneda (UF/CLP)**: Conversión dinámica entre Unidades de Fomento y Pesos Chilenos en todas las tablas y gráficos.
- 📈 **Modelos Financieros Avanzados**: Incorporación de 4 nuevos escenarios de análisis:
    - **Dinámica de Deuda**: Análisis profundo de la amortización.
    - **Arbitraje de Tasas (Fisher Modificado)**: Comparación entre tasa de crédito y rentabilidad de inversión.
    - **Valor Presente Neto (VPN)**: Evaluación del valor del dinero en el tiempo.
    - **Monte Carlo**: Simulación de variaciones de tasa.
- 📄 **Reportes PDF McKinsey-Style**: Generación de informes profesionales en PDF con gráficos vectoriales y diseño ejecutivo.
- ⚡ **Optimización de Cálculos**: Refactorización de la lógica financiera para mayor precisión y rendimiento.

## Características Principales

- 💰 **Cálculo de múltiples escenarios** - Simula prepagos únicos, mensuales, semestrales y anuales.
- 📊 **Visualización de datos** - Gráficos comparativos interactivos con Recharts.
- 🎯 **Análisis de costos** - Incluye costos de prepago, seguros y gastos operacionales.
- ⚙️ **Parámetros flexibles** - Ajusta tasa, plazo, monto, frecuencia y valor de la UF.

## Uso

1. Abre `index.html` en tu navegador.
2. Configura los parámetros de tu crédito en el panel lateral.
3. Elige el escenario de prepago deseado.
4. Exporta tu análisis profesional mediante el botón "Exportar PDF".

## Tecnología

- **React 18** - Framework principal.
- **Recharts** - Motor de visualización de datos.
- **CSS3 Moderno** - Diseño Glassmorphism y variables CSS.
- **html2pdf.js** - Motor de exportación de documentos.
- **Vanilla JavaScript** - Lógica financiera robusta.

## Archivos Clave

- `App.jsx` - Núcleo de la aplicación y componentes.
- `App.css` - Sistema de diseño y estilos.
- `financial_logic.js` - Funciones de cálculo financiero.
- `index.html` - Punto de entrada y estructura base.

---

**Autor:** @Ehl94
**Licencia:** Libre para uso personal y educativo.

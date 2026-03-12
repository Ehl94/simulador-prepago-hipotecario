# Simulador de Prepago Hipotecario

El **Simulador de Prepago Hipotecario** es una herramienta interactiva de grado profesional diseñada para ayudar a propietarios de viviendas y asesores financieros a evaluar el impacto real de realizar pagos anticipados en créditos hipotecarios. 

A diferencia de los simuladores bancarios tradicionales, esta herramienta ofrece una visualización profunda del ahorro en intereses, la reducción de plazos y el comportamiento de la deuda bajo distintos escenarios económicos, permitiendo tomar decisiones informadas sobre la gestión del patrimonio y la deuda.

## 🛠️ Características Principales

- 💰 **Simulación Multiescenario**: Evalúa prepagos únicos, mensuales recurrentes, semestrales o anuales.
- 📊 **Visualización Avanzada**: Gráficos interactivos que comparan el escenario original vs. el escenario con prepago.
- 🎯 **Análisis de Costos Reales**: Incluye en el cálculo los costos de prepago (intereses de prepago), seguros asociados y gastos operacionales.
- ⚙️ **Flexibilidad Total**: Ajuste dinámico de parámetros como tasa de interés (anual/mensual), plazo restante, monto y valor de la moneda.

## 🚀 Uso y Navegación

1.  **Configuración Lateral**: Utiliza el panel izquierdo para ingresar los datos base de tu crédito y el valor actual de la UF si aplica.
2.  **Definición de Estrategia**: Ingresa el monto y la frecuencia de tus prepagos.
3.  **Análisis de Impacto**: Revisa las pestañas de gráficos para ver la reducción de la deuda y el ahorro proyectado.
4.  **Exportación**: Genera un informe profesional en PDF para guardar o compartir tus resultados.

## 💻 Stack Tecnológico

-   **Frontend**: React 18 con Vite.
-   **Gráficos**: Recharts para visualizaciones dinámicas.
-   **Estilos**: CSS3 Moderno con un sistema de diseño Glassmorphism y variables dinámicas.
-   **Exportación**: html2pdf.js para la generación de reportes ejecutivos.
-   **Lógica**: JavaScript puro optimizado para cálculos financieros complejos.

---

## 📜 Log de Cambios Recientes

### Versión 4.0 (Actual)
-   **Interfaz Renovada**: Implementación de navegación sidebar para mejorar el espacio de trabajo.
-   **Soporte UF/CLP**: Conversión automática y visualización dinámica entre Unidades de Fomento y Pesos Chilenos.
-   **Nuevos Modelos de Análisis**:
    -   *Dinámica de Deuda*: Desglose pormenorizado de la amortización.
    -   *Arbitraje de Tasas (Fisher)*: Evaluación de rentabilidad comparada.
    -   *Valor Presente Neto (VPN)*: Análisis financiero del ahorro a valor actual.
    -   *Simulación Monte Carlo*: Proyecciones con variabilidad de tasas.
-   **Reportes MCK**: Nuevo generador de PDFs con diseño premium estilo consultoría McKinsey.

---

**Autor:** @Ehl94
**Licencia:** Libre para uso personal y educativo.

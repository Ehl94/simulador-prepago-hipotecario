/**
 * Núcleo de Lógica Financiera - Simulador de Prepago Hipotecario
 * Este archivo centraliza los cálculos para evitar discrepancias entre versiones.
 *
 * Versión mejorada:
 *  - O(1) en calcularSaldoActual (fórmula directa sistema francés)
 *  - Seguros mensuales integrados en detalleMensual y evolucionSin
 *  - Fix en nuevaCuota: usa cuotaActual real (no recálculo desde saldo inicial)
 *  - Añade nuevoDividendo y capitalInvertidoEstrategiaA al retorno
 *  - tasaMensual mantiene fórmula de equivalencia (correcta para TNA en UF, Chile)
 */

const FinancialLogic = {

    // TNA/12 simple — método que usan los bancos para amortización hipotecaria 
    tasaMensual: (tna) => tna / 100 / 12,

    cuotaMensual: (capital, tna, meses) => {
        const r = FinancialLogic.tasaMensual(tna);
        if (r === 0) return capital / meses;
        return (capital * r * Math.pow(1 + r, meses)) / (Math.pow(1 + r, meses) - 1);
    },

    // O(1): Fórmula directa del sistema francés — sin iteraciones
    calcularSaldoActual: (capital, tna, plazoTotal, mesesPagados) => {
        const r = FinancialLogic.tasaMensual(tna);
        if (r === 0) return Math.max(capital - (capital / plazoTotal) * mesesPagados, 0);

        const factorTotal = Math.pow(1 + r, plazoTotal);
        const factorPagado = Math.pow(1 + r, mesesPagados);
        const saldo = capital * ((factorTotal - factorPagado) / (factorTotal - 1));

        return Math.max(saldo, 0);
    },

    calcularInteresesTotales: (saldo, tna, meses) => {
        if (meses <= 0 || saldo <= 0) return 0;
        return FinancialLogic.cuotaMensual(saldo, tna, meses) * meses - saldo;
    },

    /**
     * Simula la evolución del crédito con y sin prepago.
     *
     * @param {number} saldoActual
     * @param {number} tna                   - Tasa Nominal Anual (%)
     * @param {number} mesesRestantes
     * @param {number} montoPrepago          - Monto en UF por evento de prepago
     * @param {string} frecuencia            - "una_vez" | "mensual" | "semestral" | "anual"
     * @param {number} mesInicio             - Mes relativo al inicio de la sim. en que empieza el prepago
     * @param {string} destino               - "plazo" | "cuota"
     * @param {number} cuotaBase             - Cuota mensual sin prepago
     * @param {number} costoPrepago          - Factor de multa (e.g. 1.5 = 1.5 meses de interés)
     * @param {number} segurosMensuales      - Costo mensual de seguros en UF (default 0)
     * @param {number} retornoEstrategiaA    - Retorno anual esperado % de inversión alternativa (default 0)
     */
    simularPrepago: (
        saldoActual,
        tna,
        mesesRestantes,
        montoPrepago,
        frecuencia,
        mesInicio,
        destino,
        cuotaBase,
        costoPrepago = 0,
        segurosMensuales = 0,
        retornoEstrategiaA = 0
    ) => {
        const r = FinancialLogic.tasaMensual(tna);
        let saldo = saldoActual;
        let mes = 0;
        let totalIntereses = 0;
        let totalPrepagado = 0;
        let totalMultas = 0;
        let prepagosRealizados = 0;
        const evolucionSin = [];
        const evolucionCon = [];
        const cuotasAnualesSin = {};
        const cuotasAnualesCon = {};
        const detalleMensual = [];

        // ── Evolución SIN prepago ──────────────────────────────────────────────
        let saldoSin = saldoActual;
        for (let i = 0; i < mesesRestantes; i++) {
            const intSin = saldoSin * r;
            const amortSin = Math.min(cuotaBase - intSin, saldoSin);
            saldoSin -= amortSin;

            evolucionSin.push({
                mes: i + 1,
                saldo: Math.max(saldoSin, 0),
                cuotaBase,
                seguros: segurosMensuales,
                dividendoTotal: cuotaBase + segurosMensuales
            });

            const ano = Math.floor(i / 12) + 1;
            cuotasAnualesSin[ano] = cuotaBase + segurosMensuales;
        }

        // ── Evolución CON prepago ──────────────────────────────────────────────
        let cuotaActual = cuotaBase;

        while (saldo > 0.01 && mes < mesesRestantes + 1) {
            const mesRelativo = mes - mesInicio;
            let prepagoMensual = 0;
            let multaMes = 0;

            const esPrepago =
                mesRelativo >= 0 &&
                montoPrepago > 0 && (
                    (frecuencia === "una_vez" && mesRelativo === 0) ||
                    frecuencia === "mensual" ||
                    (frecuencia === "semestral" && mesRelativo % 6 === 0) ||
                    (frecuencia === "anual" && mesRelativo % 12 === 0)
                );

            if (esPrepago) {
                prepagoMensual = Math.min(montoPrepago, saldo);
                multaMes = costoPrepago * prepagoMensual * r;

                saldo -= prepagoMensual;
                totalPrepagado += prepagoMensual;
                totalMultas += multaMes;
                prepagosRealizados++;

                if (destino === "cuota" && saldo > 0.01) {
                    const mesesRest = Math.max(mesesRestantes - mes, 1);
                    cuotaActual = FinancialLogic.cuotaMensual(saldo, tna, mesesRest);
                }
            }

            if (saldo <= 0.01 && !esPrepago) break;

            const intMes = saldo * r;
            const amortMes = Math.min(cuotaActual - intMes, saldo);
            saldo -= amortMes;
            totalIntereses += intMes;
            mes++;

            evolucionCon.push({ mes, saldo: Math.max(saldo, 0) });

            detalleMensual.push({
                mes,
                ano: Math.floor((mes - 1) / 12) + 1,
                cuotaBase: cuotaActual,
                seguros: segurosMensuales,
                dividendoTotal: cuotaActual + segurosMensuales,
                interes: intMes,
                amortizacion: amortMes,
                prepago: prepagoMensual,
                multa: multaMes,
                saldo: Math.max(saldo, 0)
            });

            const ano = Math.floor((mes - 1) / 12) + 1;
            cuotasAnualesCon[ano] = cuotaActual + segurosMensuales;
        }

        // ── Evolución de cuota anual ───────────────────────────────────────────
        const maxAno = Math.max(...Object.keys(cuotasAnualesSin).map(Number));
        const evolucionCuota = [];
        for (let i = 1; i <= maxAno; i++) {
            evolucionCuota.push({
                ano: i,
                cuotaSin: cuotasAnualesSin[i] || 0,
                cuotaCon: cuotasAnualesCon[i] || 0
            });
        }

        // ── Proyección de inversión con meses liberados por prepago anticipado ─
        const mesesLibres = mesesRestantes - mes;
        const tasaInvMensual = retornoEstrategiaA > 0
            ? Math.pow(1 + retornoEstrategiaA / 100, 1 / 12) - 1
            : 0;
        const capitalInvertidoEstrategiaA =
            mesesLibres > 0 && totalPrepagado > 0
                ? totalPrepagado * Math.pow(1 + tasaInvMensual, mesesLibres)
                : 0;

        // Cuota resultante fija (usada en modo "cuota"): cuotaActual real tras últimos prepagos
        const nuevaCuotaBase = destino === "cuota" ? cuotaActual : cuotaBase;

        return {
            mesesReales: mes,
            totalIntereses,
            totalPrepagado,
            totalMultas,
            prepagosRealizados,
            evolucionSin,
            evolucionCon,
            evolucionCuota,
            detalleMensual,
            // Alias mantenido para compatibilidad con UI existente
            nuevaCuota: nuevaCuotaBase,
            // Nuevos campos
            nuevaCuotaBase,
            nuevoDividendo: nuevaCuotaBase + segurosMensuales,
            capitalInvertidoEstrategiaA
        };
    },
    /**
     * Genera el detalle mensual histórico (meses ya pagados) desde el inicio del crédito.
     * Retorna un array de filas con la misma estructura que detalleMensual.
     */
    calcularHistorial: (capital, tna, plazoTotal, mesesPagados, segurosMensuales = 0) => {
        if (mesesPagados <= 0) return [];
        const r = FinancialLogic.tasaMensual(tna);
        const cuota = FinancialLogic.cuotaMensual(capital, tna, plazoTotal);
        const historial = [];
        let saldo = capital;
        for (let i = 1; i <= mesesPagados; i++) {
            const intMes = saldo * r;
            const amortMes = Math.min(cuota - intMes, saldo);
            saldo -= amortMes;
            historial.push({
                mes: i,
                ano: Math.floor((i - 1) / 12) + 1,
                cuotaBase: cuota,
                seguros: segurosMensuales,
                dividendoTotal: cuota + segurosMensuales,
                interes: intMes,
                amortizacion: amortMes,
                prepago: 0,
                multa: 0,
                saldo: Math.max(saldo, 0),
                esPagado: true
            });
        }
        return historial;
    }
};

// Exportar para que sea visible globalmente en el navegador
window.FinancialLogic = FinancialLogic;

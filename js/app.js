/**
 * RendaSoberana - Investimentos Simples & Simulador de Renda Fixa
 * Simulação mensal com juros compostos, aportes e tabela regressiva de IR.
 */

class RendaSoberanaSimulator {
    constructor() {
        this.OPTIONS = {
            cdb: {
                name: 'CDB 100% CDI',
                annualRate: 0.1065,
                taxable: true
            },
            selic: {
                name: 'Tesouro Selic',
                annualRate: 0.1075,
                taxable: true
            },
            lci: {
                name: 'LCI / LCA 90% CDI',
                annualRate: 0.09585,
                taxable: false
            },
            poupanca: {
                name: 'Poupança',
                annualRate: 0.0617,
                taxable: false
            }
        };

        this.chartInstance = null;
        this.init();
    }

    init() {
        this.bindEvents();
        this.initChart();
        this.updateSimulator();
    }

    bindEvents() {
        const ids = ['sim-type', 'sim-initial', 'sim-monthly', 'sim-months'];
        ids.forEach((id) => {
            const el = document.getElementById(id);
            if (!el) return;
            const eventName = el.tagName === 'SELECT' ? 'change' : 'input';
            el.addEventListener(eventName, () => this.updateSimulator());
        });
    }

    formatMoney(value) {
        return (value || 0).toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        });
    }

    formatMonthsLabel(months) {
        if (months === 1) return '1 mês';
        if (months < 12) return `${months} meses`;
        const years = Math.floor(months / 12);
        const rem = months % 12;
        const yearText = years === 1 ? '1 ano' : `${years} anos`;
        if (rem === 0) return `${months} meses (${yearText})`;
        return `${months} meses (${yearText} e ${rem}m)`;
    }

    getRegressiveIR(months) {
        const days = months * 30;
        if (days <= 180) return 0.225;
        if (days <= 360) return 0.20;
        if (days <= 720) return 0.175;
        return 0.15;
    }

    simulateSeries(optionKey, initial, monthly, months) {
        const opt = this.OPTIONS[optionKey] || this.OPTIONS.cdb;
        const monthlyRate = Math.pow(1 + opt.annualRate, 1 / 12) - 1;

        const netSeries = [];
        const investedSeries = [];

        let grossBalance = initial;
        let totalInvested = initial;

        for (let m = 0; m <= months; m++) {
            if (m > 0) {
                grossBalance = grossBalance * (1 + monthlyRate) + monthly;
                totalInvested += monthly;
            }

            const grossProfit = Math.max(0, grossBalance - totalInvested);
            const irRate = opt.taxable && m > 0 ? this.getRegressiveIR(m) : 0;
            const netProfit = grossProfit * (1 - irRate);
            const netBalance = totalInvested + netProfit;

            netSeries.push(Number(netBalance.toFixed(2)));
            investedSeries.push(Number(totalInvested.toFixed(2)));
        }

        const finalIR = opt.taxable ? this.getRegressiveIR(months) : 0;

        return {
            netSeries,
            investedSeries,
            finalNet: netSeries[netSeries.length - 1],
            totalInvested: investedSeries[investedSeries.length - 1],
            netProfit: netSeries[netSeries.length - 1] - investedSeries[investedSeries.length - 1],
            irRate: finalIR,
            taxable: opt.taxable,
            name: opt.name
        };
    }

    initChart() {
        const ctx = document.getElementById('yieldChart');
        if (!ctx) return;

        this.chartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [
                    {
                        label: 'Selecionado (Líquido)',
                        data: [],
                        borderColor: '#10b981',
                        backgroundColor: 'rgba(16, 185, 129, 0.10)',
                        borderWidth: 2.5,
                        fill: true,
                        tension: 0.25,
                        pointRadius: 2,
                        pointBackgroundColor: '#10b981'
                    },
                    {
                        label: 'Poupança',
                        data: [],
                        borderColor: '#fbbf24',
                        backgroundColor: 'transparent',
                        borderDash: [5, 5],
                        borderWidth: 2,
                        fill: false,
                        tension: 0.25,
                        pointRadius: 0
                    },
                    {
                        label: 'Total Investido',
                        data: [],
                        borderColor: '#6b7280',
                        backgroundColor: 'transparent',
                        borderDash: [2, 3],
                        borderWidth: 1.5,
                        fill: false,
                        tension: 0,
                        pointRadius: 0
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: '#111827',
                        titleColor: '#9CA3AF',
                        bodyColor: '#F9FAFB',
                        borderColor: '#1F2937',
                        borderWidth: 1,
                        padding: 10,
                        callbacks: {
                            label: (context) => ` ${context.dataset.label}: ${this.formatMoney(context.parsed.y)}`
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { color: 'rgba(31, 41, 55, 0.5)' },
                        ticks: {
                            color: '#6B7280',
                            font: { family: 'JetBrains Mono', size: 10 },
                            maxTicksLimit: 10
                        }
                    },
                    y: {
                        grid: { color: 'rgba(31, 41, 55, 0.5)' },
                        ticks: {
                            color: '#6B7280',
                            font: { family: 'JetBrains Mono', size: 10 },
                            callback: (val) => 'R$ ' + val.toLocaleString('pt-BR')
                        }
                    }
                }
            }
        });
    }

    updateSimulator() {
        const typeEl = document.getElementById('sim-type');
        const initialEl = document.getElementById('sim-initial');
        const monthlyEl = document.getElementById('sim-monthly');
        const monthsEl = document.getElementById('sim-months');

        if (!typeEl || !initialEl || !monthlyEl || !monthsEl) return;

        const optionKey = typeEl.value;
        const initial = Math.max(0, parseFloat(initialEl.value) || 0);
        const monthly = Math.max(0, parseFloat(monthlyEl.value) || 0);
        const months = Math.max(1, parseInt(monthsEl.value, 10) || 12);

        document.getElementById('sim-months-display').textContent = this.formatMonthsLabel(months);

        const selected = this.simulateSeries(optionKey, initial, monthly, months);
        const poupanca = this.simulateSeries('poupanca', initial, monthly, months);

        // Atualizar cards de resumo
        document.getElementById('res-invested').textContent = this.formatMoney(selected.totalInvested);
        document.getElementById('res-profit').textContent = `+ ${this.formatMoney(selected.netProfit)}`;
        document.getElementById('res-total').textContent = this.formatMoney(selected.finalNet);

        const taxInfo = document.getElementById('res-tax-info');
        if (selected.taxable) {
            taxInfo.textContent = `IR descontado: ${(selected.irRate * 100).toFixed(1).replace('.', ',')}%`;
        } else {
            taxInfo.textContent = 'Isento de Imposto de Renda';
        }

        // Atualizar legenda e comparação com a Poupança
        document.getElementById('chart-selected-label').textContent = selected.name;
        const diff = selected.finalNet - poupanca.finalNet;
        const comparisonEl = document.getElementById('comparison-text');

        if (optionKey === 'poupanca') {
            comparisonEl.innerHTML = `Você selecionou a <strong class="text-amber-400">Poupança</strong>. Experimente selecionar CDB 100% CDI ou Tesouro Selic para ver a diferença no rendimento.`;
        } else if (diff > 0.01) {
            comparisonEl.innerHTML = `Nessa simulação, o <strong class="text-white">${selected.name}</strong> rende <strong class="text-brand-400">${this.formatMoney(diff)} a mais</strong> do que a Poupança no mesmo período.`;
        } else {
            comparisonEl.innerHTML = `O rendimento líquido está equivalente ao da Poupança para os parâmetros informados.`;
        }

        // Atualizar Gráfico
        if (this.chartInstance) {
            const labels = Array.from({ length: months + 1 }, (_, i) => (i === 0 ? 'Hoje' : `Mês ${i}`));
            this.chartInstance.data.labels = labels;
            this.chartInstance.data.datasets[0].label = `${selected.name} (Líquido)`;
            this.chartInstance.data.datasets[0].data = selected.netSeries;
            this.chartInstance.data.datasets[1].data = poupanca.netSeries;
            this.chartInstance.data.datasets[2].data = selected.investedSeries;
            this.chartInstance.update();
        }
    }

    setInitialAmount(val) {
        const el = document.getElementById('sim-initial');
        if (el) {
            el.value = val;
            this.updateSimulator();
        }
    }

    setMonthlyAmount(val) {
        const el = document.getElementById('sim-monthly');
        if (el) {
            el.value = val;
            this.updateSimulator();
        }
    }

    setMonths(val) {
        const el = document.getElementById('sim-months');
        if (el) {
            el.value = val;
            this.updateSimulator();
        }
    }

    selectOption(optionKey) {
        const typeEl = document.getElementById('sim-type');
        const simSection = document.getElementById('simulador');
        if (typeEl && this.OPTIONS[optionKey]) {
            typeEl.value = optionKey;
            this.updateSimulator();
        }
        if (simSection) {
            simSection.scrollIntoView({ behavior: 'smooth' });
        }
    }
}

const app = new RendaSoberanaSimulator();

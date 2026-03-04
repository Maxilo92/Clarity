(function() {
    let transactions = [];
    let categorySpendingChart = null;
    let incomeExpenseChart = null;

    // Consistent color palette
    const appColors = {
        primary: '#6f42c1',
        income: '#27ae60',
        expense: '#e74c3c',
        neutral: '#3498db',
        accent1: '#f39c12',
        accent2: '#9b59b6'
    };

    function generateColorPalette(count) {
        const palette = [appColors.primary, appColors.income, appColors.neutral, appColors.accent1, appColors.accent2, appColors.expense];
        const colors = [];
        for (let i = 0; i < count; i++) {
            colors.push(palette[i % palette.length]);
        }
        return colors;
    }

    /**
     * Get colors for categories using CategoryManager if available, fallback to palette.
     */
    async function getCategoryColors(categoryNames) {
        if (window.CategoryManager) {
            try {
                const cats = await window.CategoryManager.fetchCategories();
                const colorMap = {};
                cats.forEach(c => colorMap[c.name.toLowerCase()] = c.color);
                return categoryNames.map(name => colorMap[name.toLowerCase()] || appColors.neutral);
            } catch {}
        }
        return generateColorPalette(categoryNames.length);
    }

    function setProfileName() {
        try {
            const user = JSON.parse(localStorage.getItem('clarityUser'));
            if (user && user.full_name) {
                document.querySelectorAll('.header-profile-link .name-text').forEach(el => {
                    el.textContent = user.full_name;
                });
            }
        } catch(e) {}
    }
    
    async function init() {
        if (!localStorage.getItem('clarityUser')) {
            window.location.href = '/login';
            return;
        }

        setProfileName();

        // Use IndexManager for fast, persistent data access
        if (window.IndexManager) {
            try {
                await window.IndexManager.ensureIndex();
                transactions = await window.IndexManager.getAllTransactions();
                console.log(`[Insights] Loaded ${transactions.length} transactions from index`);
            } catch (err) {
                console.warn('[Insights] IndexManager failed, falling back to DataManager:', err);
                transactions = await window.DataManager.fetchTransactions();
            }
        } else {
            try {
                transactions = await window.DataManager.fetchTransactions();
            } catch (error) {
                console.error("Failed to fetch transactions:", error);
            }
        }

        updateInsightsUI();
    }

    async function updateInsightsUI() {
        let totalIncome, totalExpenses, netSurplus, expensesByCategory, sortedCategories;

        // Try using pre-computed aggregations from IndexManager
        if (window.IndexManager) {
            try {
                const agg = await window.IndexManager.getAggregations();
                if (agg && agg.transactionCount > 0) {
                    totalIncome = agg.totalIncome;
                    totalExpenses = agg.totalExpenses;
                    netSurplus = agg.netSurplus;
                    
                    // Convert byCategory to sorted array
                    expensesByCategory = {};
                    for (const [cat, data] of Object.entries(agg.byCategory)) {
                        if (data.expense > 0) expensesByCategory[cat] = data.expense;
                    }
                    sortedCategories = Object.entries(expensesByCategory).sort(([,a],[,b]) => b - a);
                    
                    console.log('[Insights] Using pre-computed aggregations');
                }
            } catch (err) {
                console.warn('[Insights] Aggregation failed, computing manually:', err);
            }
        }

        // Fallback: compute from raw transactions
        if (totalIncome === undefined) {
            totalIncome = transactions.filter(t => t.wert > 0).reduce((sum, t) => sum + t.wert, 0);
            totalExpenses = transactions.filter(t => t.wert < 0).reduce((sum, t) => sum + t.wert, 0);
            netSurplus = totalIncome + totalExpenses;

            expensesByCategory = transactions
                .filter(t => t.wert < 0)
                .reduce((acc, t) => {
                    const category = t.kategorie || 'Uncategorized';
                    const amount = Math.abs(t.wert);
                    acc[category] = (acc[category] || 0) + amount;
                    return acc;
                }, {});
            sortedCategories = Object.entries(expensesByCategory).sort(([, a], [, b]) => b - a);
        }

        let subscriptions = [];
        if (window.ForecastEngine && transactions.length > 0) {
            try {
                subscriptions = window.ForecastEngine.detectSubscriptions(transactions);
            } catch (err) {
                console.error("Error detecting subscriptions:", err);
            }
        }

        updateMetrics(subscriptions, sortedCategories, transactions.length, netSurplus);
        renderSubscriptions(subscriptions);
        renderCategorySpendingChart(sortedCategories);
        renderIncomeExpenseChart(totalIncome, Math.abs(totalExpenses));
    }

    function updateMetrics(subscriptions, sortedCategories, transactionCount, netSurplus) {
        // Net Surplus
        const surplusCard = document.getElementById('metric-net-surplus');
        surplusCard.querySelector('p').textContent = `€${netSurplus.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        surplusCard.querySelector('p').style.color = netSurplus >= 0 ? appColors.income : appColors.expense;
        
        // Total monthly subscription cost
        const totalSubCost = subscriptions.reduce((sum, sub) => sum + (sub.monthlyAmount || Math.abs(sub.amount)), 0);
        const metricSubCost = document.getElementById('metric-total-subscriptions');
        metricSubCost.querySelector('p').textContent = `€${totalSubCost.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        metricSubCost.querySelector('.metric-description').textContent = `${subscriptions.length} subscriptions`;

        // Top spending category
        const topCategory = sortedCategories.length > 0 ? sortedCategories[0][0] : 'N/A';
        const metricTopCategory = document.getElementById('metric-top-category');
        metricTopCategory.querySelector('p').textContent = topCategory;

        // Transactions analyzed
        const metricTransactions = document.getElementById('metric-transactions-analyzed');
        metricTransactions.querySelector('p').textContent = transactionCount;
    }
    
    function renderSubscriptions(subscriptions) {
        const subList = document.getElementById('subscriptions-list');
        if (subscriptions.length === 0) {
            subList.innerHTML = '<p class="loading-text">No recurring subscriptions detected.</p>';
            return;
        }

        const freqLabels = {
            weekly: 'Weekly', biweekly: 'Biweekly', monthly: 'Monthly',
            quarterly: 'Quarterly', yearly: 'Yearly'
        };
        
        subList.innerHTML = subscriptions.map(sub => {
            let changeHtml = '';
            if (sub.priceChange) {
                const isIncrease = sub.priceChange > 0;
                const changeClass = isIncrease ? 'change-increase' : 'change-decrease';
                const changeIcon = isIncrease ? '▲' : '▼';
                changeHtml = `<span class="change ${changeClass}">${changeIcon} €${Math.abs(sub.priceChange).toFixed(2)}</span>`;
            }

            const freqLabel = freqLabels[sub.frequency] || sub.frequency;
            const monthlyStr = sub.monthlyAmount ? `~€${Math.abs(sub.monthlyAmount).toLocaleString('de-DE', {minimumFractionDigits: 2})}/mo` : '';

            return `
                <div class="subscription-item" data-name="${sub.name}" style="cursor:pointer">
                    <div class="subscription-info">
                        <span class="name">${sub.name}</span>
                        <span class="details">${sub.category || 'Uncategorized'} • ${freqLabel}${sub.occurrences ? ` • ${sub.occurrences}x` : ''}</span>
                    </div>
                    <div class="subscription-amount">
                        <span class="amount">€${Math.abs(sub.amount).toLocaleString('de-DE', {minimumFractionDigits: 2})}</span>
                        ${changeHtml}
                        ${monthlyStr && sub.frequency !== 'monthly' ? `<span class="monthly-equiv">${monthlyStr}</span>` : ''}
                    </div>
                </div>
            `;
        }).join('');

        // Navigate to dashboard filtered by subscription name on click
        subList.querySelectorAll('.subscription-item').forEach(item => {
            item.addEventListener('click', () => {
                window.location.href = `/dashboard?search=${encodeURIComponent(item.dataset.name)}`;
            });
        });
    }

    async function renderCategorySpendingChart(sortedCategories) {
        const ctx = document.getElementById('categorySpendingChart')?.getContext('2d');
        if (!ctx) return;

        const labels = sortedCategories.map(item => item[0]);
        const data = sortedCategories.map(item => item[1]);
        const colors = await getCategoryColors(labels);

        if (categorySpendingChart) categorySpendingChart.destroy();

        categorySpendingChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Spending',
                    data: data,
                    backgroundColor: colors,
                    borderWidth: 0,
                    hoverOffset: 10
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '70%',
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: (c) => `${c.label}: €${c.raw.toLocaleString('de-DE', { minimumFractionDigits: 2 })}`
                        }
                    }
                }
            }
        });
    }

    function renderIncomeExpenseChart(income, expenses) {
        const ctx = document.getElementById('incomeExpenseChart')?.getContext('2d');
        if (!ctx) return;

        if (incomeExpenseChart) incomeExpenseChart.destroy();
        
        incomeExpenseChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Finances'],
                datasets: [
                    {
                        label: 'Income',
                        data: [income],
                        backgroundColor: appColors.income,
                        borderRadius: 6
                    },
                    {
                        label: 'Expenses',
                        data: [expenses],
                        backgroundColor: appColors.expense,
                        borderRadius: 6
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'y',
                scales: {
                    x: {
                        stacked: true,
                        display: false,
                    },
                    y: {
                        stacked: true,
                        display: false
                    }
                },
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            usePointStyle: true,
                            boxWidth: 8,
                            padding: 20
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: (c) => `${c.dataset.label}: €${c.raw.toLocaleString('de-DE', { minimumFractionDigits: 2 })}`
                        }
                    }
                }
            }
        });
    }

    document.addEventListener('DOMContentLoaded', init);
})();


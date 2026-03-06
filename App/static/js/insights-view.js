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
        const palette = [
            '#6f42c1', // Primary Purple
            '#27ae60', // Emerald Green
            '#3498db', // Bright Blue
            '#f39c12', // Orange
            '#e74c3c', // Alizarin Red
            '#9b59b6', // Amethyst Purple
            '#1abc9c', // Turquoise
            '#34495e', // Wet Asphalt
            '#d35400', // Pumpkin
            '#7f8c8d'  // Asbestos Gray
        ];
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
                // Map both original name and lowercase for reliability
                cats.forEach(c => {
                    colorMap[c.name] = c.color;
                    colorMap[c.name.toLowerCase()] = c.color;
                });
                
                return categoryNames.map(name => {
                    return colorMap[name] || colorMap[name.toLowerCase()] || appColors.neutral;
                });
            } catch (e) {
                console.warn('[Insights] Failed to fetch category colors:', e);
            }
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
    
    let currentSubscriptions = [];
    let currentBudgetStats = [];

    function renderSmartAlerts() {
        const container = document.getElementById('smart-alerts-content');
        if (!container) return;

        const alerts = [];

        // 1. Subscription Price Changes
        if (currentSubscriptions && currentSubscriptions.length > 0) {
            currentSubscriptions.forEach(sub => {
                if (sub.priceChange && sub.priceChange > 0) {
                    alerts.push({
                        type: 'warning',
                        icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#e74c3c" stroke-width="2"><path d="M23 6l-9.5 9.5-5-5L1 18"/><path d="M17 6h6v6"/></svg>',
                        message: `<strong>Subscription Alert:</strong> The price for <em>${sub.name}</em> recently increased by €${sub.priceChange.toFixed(2)} (now €${sub.amount.toFixed(2)}).`
                    });
                }
            });
        }

        // 2. Budget Overspending
        if (currentBudgetStats && currentBudgetStats.length > 0) {
            currentBudgetStats.forEach(s => {
                const spent = s.spent || 0;
                const budget = s.budget || 0;
                if (budget > 0) {
                    const ratio = spent / budget;
                    if (ratio > 1) {
                        alerts.push({
                            type: 'danger',
                            icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
                            message: `<strong>Budget Exceeded:</strong> You've spent €${spent.toFixed(2)} on <em>${s.name}</em>, exceeding your €${budget.toFixed(2)} budget.`
                        });
                    } else if (ratio > 0.8) {
                        alerts.push({
                            type: 'warning',
                            icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>',
                            message: `<strong>Near Budget Limit:</strong> You've spent ${(ratio*100).toFixed(0)}% of your <em>${s.name}</em> budget.`
                        });
                    }
                }
            });
        }

        if (alerts.length === 0) {
            container.innerHTML = '<div style="color: #15803d; font-weight: 500; display: flex; align-items: center; gap: 8px;"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> Looking good! No anomalies or budget issues detected.</div>';
            return;
        }

        container.innerHTML = alerts.map(a => `
            <div style="background: ${a.type === 'danger' ? '#fef2f2' : '#fefce8'}; border-left: 4px solid ${a.type === 'danger' ? '#dc2626' : '#f59e0b'}; padding: 12px 15px; border-radius: 4px; display: flex; align-items: flex-start; gap: 10px;">
                <div style="margin-top: 2px;">${a.icon}</div>
                <div style="color: #1e293b; line-height: 1.4; font-size: 0.95rem;">${a.message}</div>
            </div>
        `).join('');
    }

    async function init() {
        if (!localStorage.getItem('clarityUser')) {
            window.location.href = '/login';
            return;
        }

        if (window.CategoryManager) window.CategoryManager.invalidateCache();
        setProfileName();

        // Timeframe selector
        const timeframeSelect = document.getElementById('insightsTimeframe');
        if (timeframeSelect) {
            timeframeSelect.addEventListener('change', () => {
                updateInsightsUI();
            });
        }

        const refreshBtn = document.getElementById('refreshInsights');
        if (refreshBtn) {
            refreshBtn.onclick = async () => {
                if (window.IndexManager) {
                    refreshBtn.style.transform = 'rotate(360deg)';
                    refreshBtn.style.transition = 'transform 0.6s ease';
                    await window.IndexManager.forceRebuild();
                    transactions = await window.IndexManager.getAllTransactions();
                    setTimeout(() => refreshBtn.style.transform = 'none', 600);
                    updateInsightsUI();
                    loadBudgets();
                }
            };
        }

        // Use IndexManager for fast, persistent data access
        if (window.IndexManager) {
            try {
                await window.IndexManager.ensureIndex();
                transactions = await window.IndexManager.getAllTransactions();
                console.log(`[Insights] Loaded ${transactions.length} transactions from index`);
            } catch (err) {
                console.warn('[Insights] IndexManager failed');
            }
        }

        // Listen for updates (e.g., from Clair AI)
        document.addEventListener('dataUpdated', async () => {
            console.log("[Insights] Data update received, syncing index...");
            if (window.IndexManager) {
                await window.IndexManager.ensureIndex();
                transactions = await window.IndexManager.getAllTransactions();
                updateInsightsUI();
                loadBudgets();
            }
        });

        updateInsightsUI();
        loadBudgets();
    }

    async function loadBudgets() {
        const user = JSON.parse(localStorage.getItem('clarityUser'));
        const now = new Date();
        const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        const container = document.getElementById('budget-table-body');
        const monthDisplay = document.getElementById('budget-month-display');

        if (monthDisplay) {
            monthDisplay.textContent = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        }

        try {
            const res = await fetch(`/api/categories/stats?company_id=${user.company_id}&month=${monthStr}&requester_id=${user.id}`);
            const data = await res.json();
            
            if (!data.stats || data.stats.length === 0) {
                container.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px;">No categories found.</td></tr>';
                return;
            }

            // Exclude Income from budget planning
            const spendingStats = data.stats.filter(s => s.name !== 'Income');
            currentBudgetStats = spendingStats;

            container.innerHTML = spendingStats.map(s => {
                const spent = s.spent || 0;
                const budget = s.budget || 0;
                let statusHtml = '<span class="status-badge" style="background: #e2e8f0; color: #64748b;">Not Set</span>';
                
                if (budget > 0) {
                    const ratio = spent / budget;
                    if (ratio > 1) {
                        statusHtml = '<span class="status-badge" style="background: #fee2e2; color: #dc2626;">Over Budget</span>';
                    } else if (ratio > 0.8) {
                        statusHtml = '<span class="status-badge" style="background: #fef3c7; color: #d97706;">Near Limit</span>';
                    } else {
                        statusHtml = '<span class="status-badge" style="background: #dcfce7; color: #15803d;">Under Budget</span>';
                    }
                }

                return `
                    <tr>
                        <td style="font-weight: 600;">
                            <span style="display:inline-block; width:10px; height:10px; border-radius:50%; background:${s.color}; margin-right:8px;"></span>
                            ${s.name}
                        </td>
                        <td>€${budget.toLocaleString('de-DE', {minimumFractionDigits: 2})}</td>
                        <td>€${spent.toLocaleString('de-DE', {minimumFractionDigits: 2})}</td>
                        <td>${statusHtml}</td>
                        <td style="text-align: right;">
                            <button class="btn-budget-action" onclick="window.openBudgetModal('${s.id}', '${s.name}', ${budget})" title="Set Budget">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"></path></svg>
                            </button>
                        </td>
                    </tr>
                `;
            }).join('');
            
            renderSmartAlerts();
        } catch (err) {
            console.error('[Budgets] Failed to load:', err);
            container.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px; color: #dc2626;">Error loading budgets.</td></tr>';
        }
    }

    let activeBudgetId = null;

    window.openBudgetModal = (id, name, current) => {
        activeBudgetId = id;
        document.getElementById('modal-category-name').textContent = name;
        document.getElementById('budgetInput').value = current || 0;
        document.getElementById('budgetModal').classList.add('active');
        document.getElementById('budgetInput').focus();
    };

    function closeBudgetModal() {
        document.getElementById('budgetModal').classList.remove('active');
        activeBudgetId = null;
    }

    async function saveBudget() {
        const budgetValue = parseFloat(document.getElementById('budgetInput').value);
        if (isNaN(budgetValue)) return alert("Please enter a valid number.");

        const user = JSON.parse(localStorage.getItem('clarityUser'));
        try {
            const res = await fetch(`/api/categories/${encodeURIComponent(activeBudgetId)}/budget`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ company_id: user.company_id, budget: budgetValue, requester_id: user.id })
            });
            if (res.ok) {
                closeBudgetModal();
                loadBudgets();
            } else {
                const data = await res.json();
                alert("Failed to update budget: " + (data.error || "Unknown error"));
            }
        } catch (e) {
            alert("Error updating budget.");
        }
    }

    async function updateInsightsUI() {
        let filteredTransactions = [...transactions];
        const timeframe = document.getElementById('insightsTimeframe')?.value || 'all';
        const now = new Date();

        if (timeframe === 'month') {
            const currentMonth = now.toISOString().substring(0, 7);
            filteredTransactions = transactions.filter(t => t.timestamp.startsWith(currentMonth));
        } else if (timeframe === 'year') {
            const currentYear = now.getFullYear().toString();
            filteredTransactions = transactions.filter(t => t.timestamp.startsWith(currentYear));
        }

        let totalIncome, totalExpenses, netSurplus, expensesByCategory, sortedCategories;

        // Compute from filtered transactions
        totalIncome = filteredTransactions.filter(t => t.wert > 0).reduce((sum, t) => sum + t.wert, 0);
        totalExpenses = filteredTransactions.filter(t => t.wert < 0).reduce((sum, t) => sum + t.wert, 0);
        netSurplus = totalIncome + totalExpenses;

        expensesByCategory = filteredTransactions
            .filter(t => t.wert < 0)
            .reduce((acc, t) => {
                const category = t.kategorie || 'Uncategorized';
                const amount = Math.abs(t.wert);
                acc[category] = (acc[category] || 0) + amount;
                return acc;
            }, {});
        sortedCategories = Object.entries(expensesByCategory).sort(([, a], [, b]) => b - a);

        let subscriptions = [];
        if (window.ForecastEngine && transactions.length > 0) {
            try {
                // Subscription detection still works better on all transactions to see patterns
                subscriptions = window.ForecastEngine.detectSubscriptions(transactions);
            } catch (err) {
                console.error("Error detecting subscriptions:", err);
            }
        }
        
        currentSubscriptions = subscriptions;

        // Generate Forecast for reasoning
        let reasoning = null;
        if (window.ForecastEngine && transactions.length > 0) {
            const data = { revenue: [totalIncome], expenses: [Math.abs(totalExpenses)] };
            const labels = ["Actual", "Forecast"];
            const forecast = window.ForecastEngine.applyForecast(data, transactions, timeframe, now, now, labels, 1);
            reasoning = forecast.reasoning;
        }

        updateMetrics(subscriptions, sortedCategories, filteredTransactions.length, netSurplus);
        renderSubscriptions(subscriptions);
        renderCategorySpendingChart(sortedCategories);
        renderIncomeExpenseChart(totalIncome, Math.abs(totalExpenses));
        renderSmartAlerts();
        renderForecastReasoning(reasoning);
    }

    function renderForecastReasoning(reasoning) {
        const container = document.getElementById('forecast-reasoning');
        const list = document.getElementById('forecast-reasoning-list');
        if (!container || !list) return;

        if (!reasoning || !reasoning.factors || reasoning.factors.length === 0) {
            container.style.display = 'none';
            return;
        }

        container.style.display = 'block';
        list.innerHTML = reasoning.factors.map(f => {
            let icon = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>';
            if (f.type === 'trend') {
                icon = f.direction === 'up' 
                    ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#e74c3c" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>'
                    : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#27ae60" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg>';
            } else if (f.type === 'subscription') {
                icon = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6f42c1" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 2v6h-6M3 12a9 9 0 0 1 15-6.7L21 8M3 22v-6h6M21 12a9 9 0 0 1-15 6.7L3 16"/></svg>';
            }

            return `
                <li style="display: flex; align-items: flex-start; gap: 8px; font-size: 0.88rem; color: #475569; line-height: 1.4;">
                    <span style="margin-top: 2px; flex-shrink: 0;">${icon}</span>
                    <span>${f.message}</span>
                </li>
            `;
        }).join('');
    }

    function updateMetrics(subscriptions, sortedCategories, transactionCount, netSurplus) {
        // Net Surplus
        const surplusCard = document.getElementById('metric-net-surplus');
        surplusCard.querySelector('p').textContent = `€${netSurplus.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        surplusCard.querySelector('p').style.color = netSurplus >= 0 ? appColors.income : appColors.expense;
        surplusCard.style.cursor = 'pointer';
        surplusCard.onclick = () => window.location.href = '/dashboard';
        
        // Total monthly subscription cost
        const totalSubCost = subscriptions.reduce((sum, sub) => sum + (sub.monthlyAmount || Math.abs(sub.amount)), 0);
        const metricSubCost = document.getElementById('metric-total-subscriptions');
        metricSubCost.querySelector('p').textContent = `€${totalSubCost.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        metricSubCost.querySelector('.metric-description').textContent = `${subscriptions.length} subscriptions`;
        metricSubCost.style.cursor = 'pointer';
        metricSubCost.onclick = () => {
            if (subscriptions.length > 0) {
                // Focus on the first subscription as a starting point
                window.location.href = `/dashboard?search=${encodeURIComponent(subscriptions[0].name)}`;
            }
        };

        // Top spending category
        const topCategory = sortedCategories.length > 0 ? sortedCategories[0][0] : 'N/A';
        const metricTopCategory = document.getElementById('metric-top-category');
        metricTopCategory.querySelector('p').textContent = topCategory;
        metricTopCategory.style.cursor = topCategory !== 'N/A' ? 'pointer' : 'default';
        if (topCategory !== 'N/A') {
            metricTopCategory.onclick = () => window.location.href = `/dashboard?category=${encodeURIComponent(topCategory)}`;
        }

        // Transactions analyzed
        const metricTransactions = document.getElementById('metric-transactions-analyzed');
        metricTransactions.querySelector('p').textContent = transactionCount;
        metricTransactions.style.cursor = 'pointer';
        metricTransactions.onclick = () => window.location.href = '/dashboard';
    }
    
    function renderSubscriptions(subscriptions) {
        const subList = document.getElementById('subscriptions-list');
        if (subscriptions.length === 0) {
            subList.innerHTML = '<p class="loading-text">No recurring subscriptions detected.</p>';
            return;
        }

        const freqLabels = {
            daily: 'Daily', weekly: 'Weekly', biweekly: 'Biweekly', monthly: 'Monthly',
            quarterly: 'Quarterly', yearly: 'Yearly'
        };
        
        subList.innerHTML = subscriptions.map(sub => {
            let changeHtml = '';
            if (sub.priceChange) {
                const isIncrease = sub.priceChange > 0;
                const changeClass = isIncrease ? 'change-increase' : 'change-decrease';
                const changeIcon = isIncrease ? (isIncrease > 0 ? '▲' : '▼') : ''; 
                // Fix: sub.priceChange is already the diff
                const icon = sub.priceChange > 0 ? '▲' : '▼';
                changeHtml = `<span class="change ${changeClass}" style="font-size: 0.7rem; margin-left: 4px; font-weight: bold; color: ${isIncrease ? '#e74c3c' : '#27ae60'}">${icon} €${Math.abs(sub.priceChange).toFixed(2)}</span>`;
            }

            const variableTag = sub.isVariable ? `<span style="font-size: 0.65rem; background: #f1f5f9; color: #64748b; padding: 1px 5px; border-radius: 4px; margin-left: 5px; border: 1px solid #e2e8f0; font-weight: 600;">VARIABLE</span>` : '';
            const freqLabel = freqLabels[sub.frequency] || sub.frequency;
            const monthlyStr = sub.monthlyAmount ? `~€${Math.abs(sub.monthlyAmount).toLocaleString('de-DE', {minimumFractionDigits: 2})}/mo` : '';

            return `
                <div class="subscription-item" data-name="${sub.name}" style="cursor:pointer; display: flex; justify-content: space-between; align-items: center; padding: 12px 15px; border-bottom: 1px solid #f8fafc; transition: background 0.2s;">
                    <div class="subscription-info" style="display: flex; flex-direction: column; gap: 4px;">
                        <span class="name" style="font-weight: 600; color: #1e293b; display: flex; align-items: center;">${sub.name} ${variableTag}</span>
                        <span class="details" style="font-size: 0.8rem; color: #64748b;">${sub.category || 'Uncategorized'} • ${freqLabel}${sub.occurrences ? ` • ${sub.occurrences}x` : ''}</span>
                    </div>
                    <div class="subscription-amount" style="display: flex; flex-direction: column; align-items: flex-end; gap: 2px;">
                        <div style="display: flex; align-items: center;">
                            <span class="amount" style="font-weight: 700; color: #1e293b;">€${Math.abs(sub.amount).toLocaleString('de-DE', {minimumFractionDigits: 2})}</span>
                            ${changeHtml}
                        </div>
                        ${monthlyStr && sub.frequency !== 'monthly' ? `<span class="monthly-equiv" style="font-size: 0.75rem; color: #94a3b8; font-style: italic;">${monthlyStr}</span>` : ''}
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
                onClick: (evt, elements) => {
                    if (elements.length > 0) {
                        const index = elements[0].index;
                        const label = labels[index];
                        window.location.href = `/dashboard?category=${encodeURIComponent(label)}`;
                    }
                },
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

    // Modal Events
    document.addEventListener('DOMContentLoaded', () => {
        const cancelBtn = document.getElementById('cancelBtn');
        const saveBtn = document.getElementById('saveBudgetBtn');
        const modal = document.getElementById('budgetModal');
        const input = document.getElementById('budgetInput');

        if (cancelBtn) cancelBtn.onclick = closeBudgetModal;
        if (saveBtn) saveBtn.onclick = saveBudget;
        
        if (modal) {
            modal.onclick = (e) => {
                if (e.target === modal) closeBudgetModal();
            };
        }

        if (input) {
            input.onkeydown = (e) => {
                if (e.key === 'Enter') saveBudget();
                if (e.key === 'Escape') closeBudgetModal();
            };
        }
        
        init();
    });
})();


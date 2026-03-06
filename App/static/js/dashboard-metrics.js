(function() {
    let myChart = null;
    let transactions = [];
    let currentCategory = 'all';
    let currentSearchQuery = '';

    function init() {
        const timeframeSelect = document.getElementById('chartTimeframeSelect');
        const customRange = document.getElementById('customDateRange');
        const startDateInput = document.getElementById('chartStartDate');
        const endDateInput = document.getElementById('chartEndDate');

        if (timeframeSelect) {
            timeframeSelect.addEventListener('change', () => {
                if (timeframeSelect.value === 'custom') {
                    customRange.style.display = 'flex';
                } else {
                    customRange.style.display = 'none';
                    
                    // Sync transaction list with the chart timeframe
                    const timeframe = timeframeSelect.value;
                    const datePrefix = (timeframe === 'month') ? new Date().toISOString().substring(0, 7) : 
                                     (timeframe === 'year') ? new Date().toISOString().substring(0, 4) : 
                                     (timeframe === 'last_year') ? (new Date().getFullYear() - 1).toString() : '';
                    
                    if (datePrefix) {
                        document.dispatchEvent(new CustomEvent('forceFilter', { 
                            detail: { date: datePrefix, category: currentCategory } 
                        }));
                    }
                    
                    updateDashboard();
                }
            });
        }

        [startDateInput, endDateInput].forEach(input => {
            if (input) input.addEventListener('change', updateDashboard);
        });

        document.addEventListener('categoryChanged', (e) => {
            currentCategory = e.detail.category;
            fetchAndRefresh();
        });

        document.addEventListener('forceFilter', (e) => {
            const { category, search } = e.detail;
            if (category !== undefined) currentCategory = category;
            if (search !== undefined) currentSearchQuery = search;
            fetchAndRefresh();
        });

        document.addEventListener('dataUpdated', fetchAndRefresh);

        // Add click listeners to cards for chart filtering
        const cards = document.querySelectorAll('.card[data-card-type]');
        cards.forEach(card => {
            card.style.cursor = 'pointer';
            card.addEventListener('click', () => {
                const type = card.dataset.cardType;
                toggleChartDataset(type);
            });
        });

        fetchAndRefresh();
    }

    function toggleChartDataset(type) {
        if (!myChart) return;
        
        const typeMap = { 'revenue': 4, 'expenses': 5, 'surplus': 6 };
        const index = typeMap[type];
        
        if (index !== undefined) {
            const meta = myChart.getDatasetMeta(index);
            const isCurrentlyHidden = meta.hidden;
            const newHiddenState = !isCurrentlyHidden;
            
            meta.hidden = newHiddenState;

            // Sync range visibility
            if (index === 4) { // Revenue
                myChart.getDatasetMeta(0).hidden = newHiddenState;
                myChart.getDatasetMeta(1).hidden = newHiddenState;
            } else if (index === 5) { // Expenses
                myChart.getDatasetMeta(2).hidden = newHiddenState;
                myChart.getDatasetMeta(3).hidden = newHiddenState;
            }

            myChart.update();
            updateCardStyles();
        }
    }

    function updateCardStyles() {
        if (!myChart) return;
        const cards = document.querySelectorAll('.card[data-card-type]');
        const typeMap = { 'revenue': 4, 'expenses': 5, 'surplus': 6 };

        cards.forEach(card => {
            const type = card.dataset.cardType;
            const index = typeMap[type];
            const isHidden = myChart.getDatasetMeta(index).hidden;
            
            if (isHidden) {
                card.style.opacity = '0.4';
                card.style.transform = 'scale(0.95)';
                card.style.filter = 'grayscale(0.5)';
            } else {
                card.style.opacity = '1';
                card.style.transform = 'scale(1)';
                card.style.filter = 'none';
            }
            card.style.transition = 'all 0.3s ease';
        });
    }

    function fetchAndRefresh() {
        // Ensure index is fresh before fetching
        if (window.IndexManager) {
            window.IndexManager.ensureIndex().then(() => {
                return window.IndexManager.getAllTransactions();
            }).then(entries => {
                let filtered = entries;
                if (currentCategory !== 'all') {
                    filtered = filtered.filter(t => t.kategorie === currentCategory);
                }
                if (currentSearchQuery) {
                    const q = currentSearchQuery.toLowerCase();
                    filtered = filtered.filter(t => 
                        (t.name && t.name.toLowerCase().includes(q)) ||
                        (t.sender && t.sender.toLowerCase().includes(q)) ||
                        (t.empfaenger && t.empfaenger.toLowerCase().includes(q)) ||
                        (t.beschreibung && t.beschreibung.toLowerCase().includes(q))
                    );
                }
                transactions = filtered;
                updateTimeframeSelect();
                updateDashboard();
            }).catch(() => fetchFromAPI());
        } else {
            fetchFromAPI();
        }
    }

    function fetchFromAPI() {
        const userStr = localStorage.getItem('clarityUser');
        let companyIdQuery = '';
        if (userStr) {
            const user = JSON.parse(userStr);
            if (user.company_id) companyIdQuery = `&company_id=${user.company_id}`;
        }
        let url = `/api/transactions?limit=10000${companyIdQuery}`;
        if (currentCategory !== 'all') url += '&category=' + encodeURIComponent(currentCategory);
        if (currentSearchQuery) url += '&search=' + encodeURIComponent(currentSearchQuery);

        fetch(url)
            .then(res => res.json())
            .then(data => {
                transactions = data.eintraege || [];
                updateTimeframeSelect();
                updateDashboard();
            })
            .catch(err => console.error("Error fetching transactions for dashboard:", err));
    }

    function updateTimeframeSelect() {
        const select = document.getElementById('chartTimeframeSelect');
        if (!select || transactions.length === 0) return;

        const currentValue = select.value;
        const yearsWithData = new Set();
        const quartersWithData = new Set(); // Format: "YYYYQX"

        transactions.forEach(t => {
            const d = new Date(t.timestamp);
            const year = d.getFullYear();
            const month = d.getMonth();
            const quarter = Math.floor(month / 3) + 1;
            yearsWithData.add(year);
            quartersWithData.add(`${year}Q${quarter}`);
        });

        const sortedYears = Array.from(yearsWithData).sort((a, b) => b - a);
        const now = new Date();
        const currentYear = now.getFullYear();

        // Clear existing dynamic groups (Quarters) but keep Presets if needed, 
        // actually let's rebuild the whole innerHTML for better control
        let html = '<optgroup label="Presets">';
        html += '<option value="week">This Week</option>';
        html += '<option value="month">This Month</option>';
        
        // Add years that have data
        sortedYears.forEach(y => {
            const label = (y === currentYear) ? `This Year (${y})` : (y === currentYear - 1 ? `Last Year (${y})` : `Year ${y}`);
            const val = (y === currentYear) ? 'year' : (y === currentYear - 1 ? 'last_year' : y.toString());
            html += `<option value="${val}">${label}</option>`;
        });
        
        html += '<option value="custom">Custom Range...</option>';
        html += '</optgroup>';

        // Add Quarters per Year
        sortedYears.forEach(y => {
            let hasAnyQuarterInYear = false;
            let qHtml = `<optgroup label="Quarters ${y}">`;
            for (let q = 1; q <= 4; q++) {
                if (quartersWithData.has(`${y}Q${q}`)) {
                    qHtml += `<option value="${y}Q${q}">${y} - Q${q}</option>`;
                    hasAnyQuarterInYear = true;
                }
            }
            qHtml += '</optgroup>';
            if (hasAnyQuarterInYear) html += qHtml;
        });

        select.innerHTML = html;
        
        // Restore value if it still exists, otherwise default to 'year'
        const optionExists = Array.from(select.options).some(opt => opt.value === currentValue);
        if (optionExists) {
            select.value = currentValue;
        } else {
            select.value = 'year';
        }
    }

    function updateDashboard() {
        const timeframe = document.getElementById('chartTimeframeSelect')?.value || 'year';
        const processedData = processData(transactions, timeframe);
        updateCards(processedData.totals);
        updateChart(processedData.chart);
    }

    function processData(data, timeframe) {
        const now = new Date();
        let labels = [];
        let revenue = [];
        let expenses = [];
        
        let startDate, endDate;
        let bucketType = 'day'; // 'day' or 'month'

        if (timeframe === 'week') {
            const day = now.getDay() || 7;
            startDate = new Date(now);
            startDate.setDate(now.getDate() - (day - 1));
            startDate.setHours(0,0,0,0);
            endDate = new Date(startDate);
            endDate.setDate(startDate.getDate() + 6);
            endDate.setHours(23,59,59,999);
            labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        } 
        else if (timeframe === 'month') {
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
            const daysInMonth = endDate.getDate();
            for (let i = 1; i <= daysInMonth; i++) labels.push(i.toString());
        }
        else if (timeframe === 'year') {
            startDate = new Date(now.getFullYear(), 0, 1);
            endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
            labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            bucketType = 'month';
        }
        else if (timeframe === 'last_year') {
            startDate = new Date(now.getFullYear() - 1, 0, 1);
            endDate = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
            labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            bucketType = 'month';
        }
        else if (timeframe.match(/^[0-9]{4}$/)) {
            const year = parseInt(timeframe);
            startDate = new Date(year, 0, 1);
            endDate = new Date(year, 11, 31, 23, 59, 59, 999);
            labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            bucketType = 'month';
        }
        else if (timeframe.match(/^[0-9]{4}Q[1-4]$/)) {
            const year = parseInt(timeframe.substring(0, 4));
            const q = parseInt(timeframe.charAt(5));
            startDate = new Date(year, (q - 1) * 3, 1);
            endDate = new Date(year, q * 3, 0, 23, 59, 59, 999);
            
            // Quarterly view by weeks (13 weeks)
            labels = Array.from({length: 13}, (_, i) => `W${i + 1}`);
            bucketType = 'quarter_week';
        }
        else if (timeframe === 'custom') {
            const sStr = document.getElementById('chartStartDate').value;
            const eStr = document.getElementById('chartEndDate').value;
            
            // Standard: Seit Jahresbeginn bis heute
            startDate = sStr ? new Date(sStr) : new Date(now.getFullYear(), 0, 1);
            endDate = eStr ? new Date(eStr) : new Date();
            endDate.setHours(23, 59, 59, 999);

            const diffTime = Math.abs(endDate - startDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays > 60) {
                bucketType = 'month';
                let curr = new Date(startDate);
                curr.setDate(1); // Start at beginning of month for clean buckets
                while (curr <= endDate) {
                    labels.push(curr.toLocaleString('en-US', { month: 'short', year: '2-digit' }));
                    curr.setMonth(curr.getMonth() + 1);
                }
            } else {
                bucketType = 'day';
                let curr = new Date(startDate);
                while (curr <= endDate) {
                    labels.push(curr.getDate() + '.' + (curr.getMonth() + 1) + '.');
                    curr.setDate(curr.getDate() + 1);
                }
            }
        }

        revenue = new Array(labels.length).fill(0);
        expenses = new Array(labels.length).fill(0);

        data.forEach(t => {
            const tDate = new Date(t.timestamp);
            if (tDate >= startDate && tDate <= endDate) {
                let idx = -1;
                if (bucketType === 'month') {
                    if (timeframe === 'year' || timeframe === 'last_year') {
                        idx = tDate.getMonth();
                    } else {
                        const monthsDiff = (tDate.getFullYear() - startDate.getFullYear()) * 12 + (tDate.getMonth() - startDate.getMonth());
                        idx = monthsDiff;
                    }
                } else if (bucketType === 'quarter_week') {
                    const weekDiff = Math.floor((tDate - startDate) / (7 * 24 * 60 * 60 * 1000));
                    idx = Math.min(weekDiff, 12);
                } else {
                    if (timeframe === 'week') {
                        idx = (tDate.getDay() + 6) % 7;
                    } else if (timeframe === 'month') {
                        idx = tDate.getDate() - 1;
                    } else {
                        const daysDiff = Math.floor((tDate - startDate) / (1000 * 60 * 60 * 24));
                        idx = daysDiff;
                    }
                }

                if (idx >= 0 && idx < labels.length) {
                    const val = parseFloat(t.wert);
                    if (val > 0) revenue[idx] += val;
                    else expenses[idx] += Math.abs(val);
                }
            }
        });

        // Find current bucket index for the "Today" line
        let currentBucketIdx = -1;
        if (timeframe === 'week') {
            currentBucketIdx = (now.getDay() + 6) % 7;
        } else if (timeframe === 'month') {
            currentBucketIdx = now.getDate() - 1;
        } else if (timeframe === 'year' || timeframe === 'last_year' || timeframe.match(/^[0-9]{4}$/)) {
            let year;
            if (timeframe === 'year') year = now.getFullYear();
            else if (timeframe === 'last_year') year = now.getFullYear() - 1;
            else year = parseInt(timeframe);

            if (year < now.getFullYear()) currentBucketIdx = 12; // In the past
            else if (year > now.getFullYear()) currentBucketIdx = -1; // In the future
            else currentBucketIdx = now.getMonth(); // Current year
        } else if (timeframe.includes('Q')) {
             const year = parseInt(timeframe.substring(0, 4));
             if (year < now.getFullYear()) currentBucketIdx = 13;
             else if (year > now.getFullYear()) currentBucketIdx = -1;
             else {
                const q = parseInt(timeframe.charAt(5));
                const qStart = new Date(year, (q-1)*3, 1);
                const qEnd = new Date(year, q*3, 0);
                if (now >= qStart && now <= qEnd) {
                    currentBucketIdx = Math.floor((now - qStart) / (7 * 24 * 60 * 60 * 1000));
                } else if (now > qEnd) currentBucketIdx = 13;
             }
        }

        // Totals should sum up the entire timeframe shown
        const totals = {
            revenue: revenue.reduce((a, b) => a + (b || 0), 0),
            expenses: expenses.reduce((a, b) => a + (b || 0), 0)
        };
        totals.surplus = totals.revenue - totals.expenses;

        // Advanced Forecast using Subscriptions and Trends
        let revRange = [], expRange = [];
        if (window.ForecastEngine && currentBucketIdx >= 0 && currentBucketIdx < labels.length) {
            const forecasted = window.ForecastEngine.applyForecast(
                { revenue, expenses, labels }, 
                data, 
                timeframe, 
                startDate, 
                endDate, 
                labels, 
                currentBucketIdx
            );
            revenue = forecasted.revenue;
            expenses = forecasted.expenses;
            revRange = forecasted.revRange;
            expRange = forecasted.expRange;
        } 
        else if (currentBucketIdx >= 0 && currentBucketIdx < labels.length) {
            // Fallback: Visual propagation: make it horizontal from today onwards
            const lastRev = revenue[currentBucketIdx];
            const lastExp = expenses[currentBucketIdx];
            for (let i = currentBucketIdx + 1; i < labels.length; i++) {
                revenue[i] = lastRev;
                expenses[i] = lastExp;
            }
        }

        return { chart: { labels, revenue, expenses, revRange, expRange, currentBucketIdx }, totals };
        }

        function updateCards(totals) {
        const format = (v) => '€' + v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const revEl = document.querySelector('.card[data-card-type="revenue"] .card-value');
        const expEl = document.querySelector('.card[data-card-type="expenses"] .card-value');
        const surEl = document.querySelector('.card[data-card-type="surplus"] .card-value');
        if (revEl) { revEl.textContent = format(totals.revenue); revEl.style.color = '#6f42c1'; }
        if (expEl) { expEl.textContent = format(totals.expenses); expEl.style.color = totals.expenses > 0 ? '#dc3545' : '#333'; }
        if (surEl) { surEl.textContent = format(totals.surplus); surEl.style.color = totals.surplus >= 0 ? '#28a745' : '#dc3545'; }
        const max = Math.max(totals.revenue, totals.expenses, 1);
        const revBar = document.querySelector('.fill-revenue');
        const expBar = document.querySelector('.fill-expenses');
        const surBar = document.querySelector('.fill-surplus');
        if (revBar) revBar.style.width = (totals.revenue / max * 100) + '%';
        if (expBar) expBar.style.width = (totals.expenses / max * 100) + '%';
        if (surBar) surBar.style.width = (Math.max(0, totals.surplus) / max * 100) + '%';
        }

        function updateChart(chartData) {
        const ctx = document.getElementById('myChart');
        if (!ctx) return;

        const getSegment = () => ({
            borderDash: ctx => {
                const todayIdx = myChart ? myChart.options.plugins.todayLine?.index : chartData.currentBucketIdx;
                return (todayIdx !== undefined && todayIdx >= 0 && ctx.p0.parsed.x >= todayIdx) ? [6, 4] : undefined;
            }
        });

        const commonPointStyles = {
            pointBackgroundColor: (ctx) => ctx.dataset.borderColor,
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: (ctx) => (ctx.dataset.isRange ? 0 : 4), // No points for range area
            pointHoverRadius: (ctx) => (ctx.dataset.isRange ? 0 : 6),
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderWidth: 3
        };

        const chartDatasets = [
            // Revenue Range (Forecast Area)
            {
                label: 'Revenue Confidence',
                data: chartData.revRange.map(r => r ? r.max : null),
                borderColor: 'transparent',
                backgroundColor: 'rgba(111, 66, 193, 0.1)',
                fill: false,
                tension: 0.4,
                isRange: true,
                pointRadius: 0
            },
            {
                label: 'Revenue Confidence Min',
                data: chartData.revRange.map(r => r ? r.min : null),
                borderColor: 'transparent',
                backgroundColor: 'rgba(111, 66, 193, 0.1)',
                fill: '-1', // Fill to previous dataset (max)
                tension: 0.4,
                isRange: true,
                pointRadius: 0
            },
            // Expenses Range (Forecast Area)
            {
                label: 'Expenses Confidence',
                data: chartData.expRange.map(r => r ? r.max : null),
                borderColor: 'transparent',
                backgroundColor: 'rgba(231, 76, 60, 0.1)',
                fill: false,
                tension: 0.4,
                isRange: true,
                pointRadius: 0
            },
            {
                label: 'Expenses Confidence Min',
                data: chartData.expRange.map(r => r ? r.min : null),
                borderColor: 'transparent',
                backgroundColor: 'rgba(231, 76, 60, 0.1)',
                fill: '-1',
                tension: 0.4,
                isRange: true,
                pointRadius: 0
            },
            // Main Lines
            { 
                label: 'Revenue', data: chartData.revenue, borderColor: '#6f42c1', 
                backgroundColor: 'transparent', fill: false, tension: 0.4, 
                segment: getSegment(), ...commonPointStyles 
            },
            { 
                label: 'Expenses', data: chartData.expenses, borderColor: '#e74c3c', 
                backgroundColor: 'transparent', fill: false, tension: 0.4, 
                segment: getSegment(), ...commonPointStyles 
            },
            { 
                label: 'Surplus', data: chartData.revenue.map((r, i) => (r === null && chartData.expenses[i] === null) ? null : (r || 0) - (chartData.expenses[i] || 0)), 
                borderColor: '#27ae60', tension: 0.4, borderWidth: 3, 
                segment: getSegment(), ...commonPointStyles 
            }
        ];

        if (myChart && myChart.data.datasets.length === chartDatasets.length) {
            // Keep visibility status when data is updated
            chartDatasets.forEach((newDs, i) => {
                myChart.data.datasets[i].data = newDs.data;
                if (newDs.segment) myChart.data.datasets[i].segment = newDs.segment;
                Object.assign(myChart.data.datasets[i], commonPointStyles);
            });
            myChart.data.labels = chartData.labels;
            myChart.options.plugins.todayLine = { index: chartData.currentBucketIdx };
            myChart.update();
            updateCardStyles();
        }
        else {
            if (myChart) myChart.destroy();
            // Custom plugin to draw vertical line for today
            const todayLinePlugin = {
                id: 'todayLine',
                afterDraw: (chart, args, options) => {
                    const { ctx, chartArea: { top, bottom, left, right }, scales: { x } } = chart;
                    if (options.index === undefined || options.index < 0 || options.index >= chart.data.labels.length) return;

                    const xPos = x.getPixelForValue(chart.data.labels[options.index]);
                    ctx.save();
                    ctx.beginPath();
                    ctx.lineWidth = 2;
                    ctx.setLineDash([6, 4]);
                    ctx.strokeStyle = '#64748b';
                    ctx.moveTo(xPos, top);
                    ctx.lineTo(xPos, bottom);
                    ctx.stroke();

                    // Draw "Today" label
                    ctx.fillStyle = '#64748b';
                    ctx.font = 'bold 11px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText('TODAY', xPos, top - 12);
                    ctx.restore();
                }
            };

            myChart = new Chart(ctx, {
                type: 'line', 
                data: {
                    labels: chartData.labels,
                    datasets: chartDatasets
                },
                plugins: [todayLinePlugin],
                options: {
                    responsive: true, maintainAspectRatio: false,
                    layout: {
                        padding: {
                            top: 25 // Space for TODAY label
                        }
                    },
                    interaction: { mode: 'index', intersect: false },
                    scales: { 
                        y: { 
                            beginAtZero: true, 
                            ticks: { callback: (v) => '€' + v.toLocaleString('de-DE') },
                            grid: { color: 'rgba(0,0,0,0.05)' }
                        },
                        x: {
                            grid: { display: false }
                        }
                    },
                    plugins: {
                        todayLine: { index: chartData.currentBucketIdx },
                        tooltip: {
                            backgroundColor: 'rgba(0,0,0,0.8)',
                            padding: 12,
                            titleFont: { size: 14, weight: 'bold' },
                            bodyFont: { size: 13 },
                            cornerRadius: 8,
                            callbacks: {
                                title: (items) => {
                                    if (!items.length) return '';
                                    const item = items[0];
                                    const chart = item.chart;
                                    const todayIdx = chart.options.plugins.todayLine?.index;
                                    let title = item.label;
                                    if (todayIdx !== undefined && todayIdx !== -1 && item.dataIndex > todayIdx) {
                                        title += ' (Forecast)';
                                    }
                                    return title;
                                },
                                label: (context) => {
                                    if (context.dataset.isRange) return null; // Hide ranges from tooltip
                                    return context.dataset.label + ': €' + context.raw.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                                }
                            }
                        },
                        legend: { 
                            position: 'bottom', 
                            labels: {
                                usePointStyle: true,
                                padding: 25,
                                filter: (item) => !chartDatasets[item.datasetIndex].isRange // Hide range items from legend
                            },
                            onClick: (e, legendItem, legend) => {
                                const index = legendItem.datasetIndex;
                                const meta = legend.chart.getDatasetMeta(index);
                                const isHidden = meta.hidden === null ? !legend.chart.data.datasets[index].hidden : meta.hidden;
                                const newState = !isHidden;

                                meta.hidden = newState;

                                // Sync range visibility
                                if (index === 4) { // Revenue
                                    legend.chart.getDatasetMeta(0).hidden = newState;
                                    legend.chart.getDatasetMeta(1).hidden = newState;
                                } else if (index === 5) { // Expenses
                                    legend.chart.getDatasetMeta(2).hidden = newState;
                                    legend.chart.getDatasetMeta(3).hidden = newState;
                                }

                                legend.chart.update();
                                updateCardStyles();
                            }
                        }
                    }
                }
            });
            updateCardStyles();
        }        }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();

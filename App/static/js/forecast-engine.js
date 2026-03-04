window.ForecastEngine = (function() {
    /**
     * Normalizes a transaction name for grouping.
     * Strips common suffixes, extra whitespace, and lowercases.
     */
    function normalizeName(name) {
        return name
            .toLowerCase()
            .replace(/\s*(gmbh|ag|inc|ltd|se|co\.?\s*kg|e\.?\s*v\.?|ug)\s*/gi, '')
            .replace(/[*#+\-_]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    /**
     * Detects recurring transactions (subscriptions) in the given transaction list.
     * Uses fuzzy name matching, day-based interval analysis, and amount clustering.
     */
    function detectSubscriptions(transactions) {
        // 1. Group by normalized name
        const groups = {};
        transactions.forEach(t => {
            const key = normalizeName(t.name);
            if (!key) return;
            if (!groups[key]) groups[key] = [];
            groups[key].push(t);
        });

        const subscriptions = [];

        for (const key in groups) {
            const group = groups[key].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
            if (group.length < 2) continue;

            // 2. Cluster by similar amounts (within 25% of median)
            const amounts = group.map(t => Math.abs(parseFloat(t.wert)));
            const medianAmount = amounts.slice().sort((a, b) => a - b)[Math.floor(amounts.length / 2)];
            const tolerance = medianAmount * 0.25;
            const filtered = group.filter(t => Math.abs(Math.abs(parseFloat(t.wert)) - medianAmount) <= tolerance);
            
            if (filtered.length < 2) continue;

            // 3. Calculate day-based intervals (more precise than month-based)
            const intervals = [];
            for (let i = 1; i < filtered.length; i++) {
                const d1 = new Date(filtered[i - 1].timestamp);
                const d2 = new Date(filtered[i].timestamp);
                const diffDays = Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
                intervals.push(diffDays);
            }

            if (intervals.length === 0) continue;

            // 4. Determine frequency with tolerance ranges (days)
            const freqRanges = [
                { name: 'weekly',    min: 5,   max: 10,  days: 7 },
                { name: 'biweekly',  min: 11,  max: 18,  days: 14 },
                { name: 'monthly',   min: 25,  max: 35,  days: 30 },
                { name: 'quarterly', min: 80,  max: 100, days: 91 },
                { name: 'yearly',    min: 350, max: 380, days: 365 }
            ];

            let bestFreq = null;
            let bestScore = 0;

            for (const freq of freqRanges) {
                const matchCount = intervals.filter(d => d >= freq.min && d <= freq.max).length;
                const score = matchCount / intervals.length;
                if (score > bestScore && score >= 0.5) {
                    bestScore = score;
                    bestFreq = freq;
                }
            }

            if (!bestFreq) continue;

            // 5. Calculate current and previous amount for price change detection
            const recentAmounts = filtered.slice(-3).map(t => Math.abs(parseFloat(t.wert)));
            const olderAmounts = filtered.slice(0, Math.max(1, filtered.length - 3)).map(t => Math.abs(parseFloat(t.wert)));
            const currentAvg = recentAmounts.reduce((s, v) => s + v, 0) / recentAmounts.length;
            const olderAvg = olderAmounts.reduce((s, v) => s + v, 0) / olderAmounts.length;
            
            let priceChange = null;
            const changeDiff = currentAvg - olderAvg;
            if (Math.abs(changeDiff) > olderAvg * 0.05 && filtered.length >= 4) {
                priceChange = changeDiff;
            }

            // 6. Calculate monthly cost equivalent
            let monthlyAmount = currentAvg;
            if (bestFreq.name === 'weekly') monthlyAmount = currentAvg * 4.33;
            else if (bestFreq.name === 'biweekly') monthlyAmount = currentAvg * 2.17;
            else if (bestFreq.name === 'quarterly') monthlyAmount = currentAvg / 3;
            else if (bestFreq.name === 'yearly') monthlyAmount = currentAvg / 12;

            // Use most negative (expense) amount for display
            const latestAmount = parseFloat(filtered[filtered.length - 1].wert);

            subscriptions.push({
                name: filtered[0].name,
                amount: latestAmount,
                monthlyAmount: monthlyAmount,
                lastDate: new Date(filtered[filtered.length - 1].timestamp),
                category: filtered[filtered.length - 1].kategorie,
                frequency: bestFreq.name,
                confidence: bestScore,
                occurrences: filtered.length,
                priceChange: priceChange
            });
        }

        // Sort by monthly cost (highest first)
        subscriptions.sort((a, b) => Math.abs(b.monthlyAmount) - Math.abs(a.monthlyAmount));
        return subscriptions;
    }

    /**
     * Calculates trends per category and removes outliers.
     */
    function calculateCategoryTrends(transactions) {
        const now = new Date();
        const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);
        
        const categoryData = {}; // { category: { monthKey: { total: 0, count: 0 } } }

        transactions.forEach(t => {
            const d = new Date(t.timestamp);
            if (d >= sixMonthsAgo && d <= now) {
                const cat = t.kategorie;
                const monthKey = `${d.getFullYear()}-${d.getMonth()}`;
                if (!categoryData[cat]) categoryData[cat] = {};
                if (!categoryData[cat][monthKey]) categoryData[cat][monthKey] = { total: 0, count: 0 };
                
                const val = parseFloat(t.wert);
                categoryData[cat][monthKey].total += val;
                categoryData[cat][monthKey].count++;
            }
        });

        const trends = {};
        for (const cat in categoryData) {
            const months = Object.keys(categoryData[cat]).sort();
            if (months.length < 2) {
                trends[cat] = 1.0;
                continue;
            }

            let growthSum = 0;
            let count = 0;
            for (let i = 1; i < months.length; i++) {
                const prev = Math.abs(categoryData[cat][months[i-1]].total);
                const curr = Math.abs(categoryData[cat][months[i]].total);
                
                // Outlier removal: If a month is > 3x the previous, ignore it for trend
                if (prev > 0 && curr < prev * 3) {
                    growthSum += (curr / prev);
                    count++;
                }
            }
            trends[cat] = count > 0 ? Math.max(0.7, Math.min(1.3, growthSum / count)) : 1.0;
        }
        return trends;
    }

    /**
     * Seasonal factor (Year-over-Year comparison).
     */
    function getSeasonalityFactor(transactions, targetMonth) {
        const lastYearSameMonth = transactions.filter(t => {
            const d = new Date(t.timestamp);
            return d.getMonth() === targetMonth && d.getFullYear() === (new Date().getFullYear() - 1);
        });
        
        if (lastYearSameMonth.length === 0) return 1.0;
        
        const avgMonthly = transactions.reduce((sum, t) => sum + Math.abs(parseFloat(t.wert)), 0) / (transactions.length / 30 || 1) * 30;
        const targetMonthly = lastYearSameMonth.reduce((sum, t) => sum + Math.abs(parseFloat(t.wert)), 0);
        
        return Math.max(0.8, Math.min(1.5, targetMonthly / (avgMonthly || 1)));
    }

    /**
     * Advanced Forecast.
     */
    function applyForecast(data, transactions, timeframe, startDate, endDate, labels, currentBucketIdx) {
        if (currentBucketIdx < 0 || currentBucketIdx >= labels.length) return data;

        const catTrends = calculateCategoryTrends(transactions);
        const subs = detectSubscriptions(transactions);

        const newRevenue = [...data.revenue];
        const newExpenses = [...data.expenses];

        // Group actuals by category to find "Base" for each
        const categoryBase = {};
        transactions.filter(t => new Date(t.timestamp) >= new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1))
                   .forEach(t => {
                       if (!categoryBase[t.kategorie]) categoryBase[t.kategorie] = { rev: 0, exp: 0 };
                       const val = parseFloat(t.wert);
                       if (val > 0) categoryBase[t.kategorie].rev += val;
                       else categoryBase[t.kategorie].exp += Math.abs(val);
                   });

        for (let i = currentBucketIdx; i < labels.length; i++) {
            let bucketRev = 0;
            let bucketExp = 0;
            const monthsOut = (i - currentBucketIdx);
            
            // 1. Calculate base forecast from categories (Trend + Seasonality)
            const seasonality = getSeasonalityFactor(transactions, (startDate.getMonth() + i) % 12);
            
            for (const cat in categoryBase) {
                const trend = catTrends[cat] || 1.0;
                // Forecast = Base * Trend^time * Seasonality
                bucketRev += categoryBase[cat].rev * Math.pow(trend, monthsOut / 12) * seasonality;
                bucketExp += categoryBase[cat].exp * Math.pow(trend, monthsOut / 12) * seasonality;
            }

            // 2. Add Subscriptions (Quarterly/Yearly check)
            subs.forEach(sub => {
                const targetDate = new Date(startDate.getFullYear(), startDate.getMonth() + i, 15);
                const monthsSinceLast = (targetDate.getFullYear() - sub.lastDate.getFullYear()) * 12 + (targetDate.getMonth() - sub.lastDate.getMonth());
                
                let isDue = false;
                if (sub.frequency === 'monthly') isDue = true;
                else if (sub.frequency === 'quarterly' && monthsSinceLast % 3 === 0) isDue = true;
                else if (sub.frequency === 'yearly' && monthsSinceLast % 12 === 0) isDue = true;

                if (isDue) {
                    if (sub.amount > 0) bucketRev += sub.amount;
                    else bucketExp += Math.abs(sub.amount);
                }
            });

            // Random fluctuation for a natural look (3%)
            const jitter = 1 + (Math.random() * 0.06 - 0.03);
            const targetRev = bucketRev * jitter;
            const targetExp = bucketExp * jitter;

            if (i === currentBucketIdx) {
                newRevenue[i] = Math.max(newRevenue[i], targetRev);
                newExpenses[i] = Math.max(newExpenses[i], targetExp);
            } else {
                newRevenue[i] = targetRev;
                newExpenses[i] = targetExp;
            }
        }

        return { revenue: newRevenue, expenses: newExpenses };
    }

    return {
        detectSubscriptions,
        calculateCategoryTrends,
        applyForecast
    };
})();

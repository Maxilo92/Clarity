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

            // 2. Cluster by similar amounts
            // For stronger name matches (e.g. "Netflix"), we allow more variance (variable subscriptions)
            const amounts = group.map(t => Math.abs(parseFloat(t.wert)));
            const medianAmount = amounts.slice().sort((a, b) => a - b)[Math.floor(amounts.length / 2)];
            
            // Heuristic: if we have 3+ matches, we allow up to 40% variance for "Variable Subscriptions"
            const tolerance = group.length >= 3 ? medianAmount * 0.40 : medianAmount * 0.20;
            const filtered = group.filter(t => Math.abs(Math.abs(parseFloat(t.wert)) - medianAmount) <= tolerance);
            
            if (filtered.length < 2) continue;

            // 3. Calculate day-based intervals
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
                { name: 'daily',     min: 1,   max: 2,   days: 1 },
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
                if (score > bestScore && score >= 0.4) { // Lowered threshold for variable frequencies
                    bestScore = score;
                    bestFreq = freq;
                }
            }

            if (!bestFreq) continue;

            // 5. Detect Price Changes and Variance
            const recentAmounts = filtered.slice(-3).map(t => Math.abs(parseFloat(t.wert)));
            const olderAmounts = filtered.slice(0, Math.max(1, filtered.length - 3)).map(t => Math.abs(parseFloat(t.wert)));
            const currentAvg = recentAmounts.reduce((s, v) => s + v, 0) / recentAmounts.length;
            const olderAvg = olderAmounts.reduce((s, v) => s + v, 0) / olderAmounts.length;
            
            let priceChange = null;
            const changeDiff = currentAvg - olderAvg;
            if (Math.abs(changeDiff) > olderAvg * 0.05 && filtered.length >= 4) {
                priceChange = changeDiff;
            }

            // Variance check for "Variable" tag
            const isVariable = (tolerance > medianAmount * 0.25);

            // 6. Calculate monthly cost equivalent
            let monthlyAmount = currentAvg;
            if (bestFreq.name === 'daily') monthlyAmount = currentAvg * 30.42;
            else if (bestFreq.name === 'weekly') monthlyAmount = currentAvg * 4.33;
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
                priceChange: priceChange,
                isVariable: isVariable
            });
        }

        // Sort by monthly cost (highest first)
        subscriptions.sort((a, b) => Math.abs(b.monthlyAmount) - Math.abs(a.monthlyAmount));
        return subscriptions;
    }

    /**
     * Calculates trends per category using weighted moving average (more recent = more weight).
     * Includes improved outlier detection using standard deviation.
     */
    function calculateCategoryTrends(transactions) {
        const now = new Date();
        const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 12, 1);
        
        const categoryData = {}; // { category: { monthKey: total } }

        transactions.forEach(t => {
            const d = new Date(t.timestamp);
            if (d >= twelveMonthsAgo && d <= now) {
                const cat = t.kategorie || 'Uncategorized';
                const monthKey = `${d.getFullYear()}-${d.getMonth()}`;
                if (!categoryData[cat]) categoryData[cat] = {};
                if (!categoryData[cat][monthKey]) categoryData[cat][monthKey] = 0;
                categoryData[cat][monthKey] += Math.abs(parseFloat(t.wert));
            }
        });

        const trends = {};
        for (const cat in categoryData) {
            const months = Object.keys(categoryData[cat]).sort();
            if (months.length < 3) {
                trends[cat] = 1.0;
                continue;
            }

            const values = months.map(m => categoryData[cat][m]);
            
            // Calculate growth rates between months
            const growthRates = [];
            for (let i = 1; i < values.length; i++) {
                if (values[i-1] > 0) {
                    const rate = values[i] / values[i-1];
                    // Basic outlier filtering: ignore growth > 400% or < 10%
                    if (rate < 4.0 && rate > 0.1) {
                        growthRates.push(rate);
                    }
                }
            }

            if (growthRates.length === 0) {
                trends[cat] = 1.0;
                continue;
            }

            // Weighted Average: Recent growth rates have higher impact
            let weightedSum = 0;
            let weightTotal = 0;
            growthRates.forEach((rate, idx) => {
                const weight = idx + 1; // Linear weight
                weightedSum += rate * weight;
                weightTotal += weight;
            });

            const avgGrowth = weightedSum / weightTotal;
            // Dampen the trend to avoid extreme projections (max 15% change per month)
            trends[cat] = Math.max(0.85, Math.min(1.15, avgGrowth));
        }
        return trends;
    }

    /**
     * Improved Seasonal factor using a rolling average comparison.
     * Robust against missing data and zero-values.
     */
    function getSeasonalityFactor(transactions, targetMonth) {
        if (!transactions || transactions.length === 0) return 1.0;
        
        const yearGroups = {}; // { year: { month: total } }
        
        transactions.forEach(t => {
            const d = new Date(t.timestamp);
            if (isNaN(d.getTime())) return;
            const y = d.getFullYear();
            const m = d.getMonth();
            if (!yearGroups[y]) yearGroups[y] = {};
            if (!yearGroups[y][m]) yearGroups[y][m] = 0;
            yearGroups[y][m] += Math.abs(parseFloat(t.wert) || 0);
        });

        const years = Object.keys(yearGroups).map(Number).sort();
        if (years.length === 0) return 1.0;

        const seasonalValues = [];
        years.forEach(y => {
            const monthsInYear = Object.keys(yearGroups[y]).length;
            if (monthsInYear > 0 && yearGroups[y][targetMonth] !== undefined) {
                const yearTotal = Object.values(yearGroups[y]).reduce((a, b) => a + b, 0);
                const yearAvg = yearTotal / monthsInYear;
                if (yearAvg > 0) {
                    const ratio = yearGroups[y][targetMonth] / yearAvg;
                    if (!isNaN(ratio)) seasonalValues.push(ratio);
                }
            }
        });

        if (seasonalValues.length === 0) return 1.0;
        
        const avgSeasonality = seasonalValues.reduce((a, b) => a + b, 0) / seasonalValues.length;
        return Math.max(0.6, Math.min(1.6, avgSeasonality || 1.0));
    }

    /**
     * Advanced Forecast with improved smoothing, logic and confidence intervals.
     */
    function applyForecast(data, transactions, timeframe, startDate, endDate, labels, currentBucketIdx) {
        if (!data || currentBucketIdx < 0 || currentBucketIdx >= labels.length) return data;

        const catTrends = calculateCategoryTrends(transactions);
        const subs = detectSubscriptions(transactions);

        const newRevenue = [...(data.revenue || [])];
        const newExpenses = [...(data.expenses || [])];
        
        // Ensure arrays are long enough
        while (newRevenue.length < labels.length) newRevenue.push(0);
        while (newExpenses.length < labels.length) newExpenses.push(0);

        const revRange = new Array(labels.length).fill(null);
        const expRange = new Array(labels.length).fill(null);

        // 1. Establish "Base" per category from recent 6 months for stability
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        
        const categoryBase = {};
        const recentTx = transactions.filter(t => new Date(t.timestamp) >= sixMonthsAgo);
        const monthCounts = {}; 

        recentTx.forEach(t => {
            const cat = t.kategorie || 'Uncategorized';
            if (!categoryBase[cat]) {
                categoryBase[cat] = { rev: 0, exp: 0 };
                monthCounts[cat] = new Set();
            }
            
            const d = new Date(t.timestamp);
            if (!isNaN(d.getTime())) {
                const mKey = `${d.getFullYear()}-${d.getMonth()}`;
                monthCounts[cat].add(mKey);
            }

            const val = parseFloat(t.wert) || 0;
            if (val > 0) categoryBase[cat].rev += val;
            else categoryBase[cat].exp += Math.abs(val);
        });

        for (const cat in categoryBase) {
            const monthsSeen = Math.max(1, monthCounts[cat].size);
            categoryBase[cat].rev /= monthsSeen;
            categoryBase[cat].exp /= monthsSeen;
        }

        // 2. Identify and filter out subscriptions from the base to avoid double counting
        subs.forEach(sub => {
            const cat = sub.category || 'Uncategorized';
            if (categoryBase[cat]) {
                const monthlySub = Math.abs(parseFloat(sub.monthlyAmount) || parseFloat(sub.amount) || 0);
                if (sub.amount > 0) categoryBase[cat].rev = Math.max(0, categoryBase[cat].rev - monthlySub);
                else categoryBase[cat].exp = Math.max(0, categoryBase[cat].exp - monthlySub);
            }
        });

        // 3. Project future buckets
        for (let i = currentBucketIdx; i < labels.length; i++) {
            let bucketRev = 0;
            let bucketExp = 0;
            
            let monthsOut = 0;
            const targetDate = new Date(startDate);
            if (timeframe === 'year' || timeframe === 'last_year' || timeframe.match(/^[0-9]{4}$/)) {
                targetDate.setMonth(i);
                monthsOut = Math.max(0, i - currentBucketIdx);
            } else if (timeframe === 'month') {
                targetDate.setDate(i + 1);
                monthsOut = (i - currentBucketIdx) / 30;
            } else if (timeframe === 'week') {
                targetDate.setDate(startDate.getDate() + i);
                monthsOut = (i - currentBucketIdx) / 30;
            }

            const seasonality = getSeasonalityFactor(transactions, targetDate.getMonth());
            
            for (const cat in categoryBase) {
                const trend = catTrends[cat] || 1.0;
                const trendFactor = Math.pow(trend, monthsOut);
                bucketRev += categoryBase[cat].rev * trendFactor * seasonality;
                bucketExp += categoryBase[cat].exp * trendFactor * seasonality;
            }

            // 4. Layer Subscriptions back on top
            subs.forEach(sub => {
                let isDue = false;
                const monthsSinceLast = (targetDate.getFullYear() - sub.lastDate.getFullYear()) * 12 + (targetDate.getMonth() - sub.lastDate.getMonth());
                
                if (sub.frequency === 'monthly') isDue = true; 
                else if (sub.frequency === 'weekly') {
                    if (timeframe === 'month' || timeframe === 'week') isDue = (targetDate.getDay() === sub.lastDate.getDay());
                    else isDue = true; 
                } else if (sub.frequency === 'quarterly' && monthsSinceLast > 0 && monthsSinceLast % 3 === 0) isDue = true;
                else if (sub.frequency === 'yearly' && monthsSinceLast > 0 && monthsSinceLast % 12 === 0) isDue = true;

                if (isDue) {
                    let amountToApply = Math.abs(parseFloat(sub.amount) || 0);
                    if (sub.frequency === 'monthly' && (timeframe === 'month' || timeframe === 'week')) {
                        isDue = (targetDate.getDate() === Math.min(sub.lastDate.getDate(), 28));
                    } else if ((sub.frequency === 'weekly' || sub.frequency === 'biweekly') && (timeframe === 'year' || timeframe.match(/^[0-9]{4}$/))) {
                        amountToApply = Math.abs(parseFloat(sub.monthlyAmount) || 0);
                    }

                    if (isDue) {
                        if (sub.amount > 0) bucketRev += amountToApply;
                        else bucketExp += amountToApply;
                    }
                }
            });

            const jitter = 1 + (Math.random() * 0.04 - 0.02);
            bucketRev = (bucketRev || 0) * jitter;
            bucketExp = (bucketExp || 0) * jitter;

            const uncertainty = 0.05 + (monthsOut * 0.02); 
            revRange[i] = { min: bucketRev * (1 - uncertainty), max: bucketRev * (1 + uncertainty) };
            expRange[i] = { min: bucketExp * (1 - uncertainty), max: bucketExp * (1 + uncertainty) };

            if (i === currentBucketIdx) {
                const dayOfMonth = new Date().getDate();
                const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
                const progress = Math.min(1, dayOfMonth / daysInMonth);
                
                const expectedTotalRev = Math.max(newRevenue[i] || 0, bucketRev);
                const expectedTotalExp = Math.max(newExpenses[i] || 0, bucketExp);
                
                if (timeframe === 'year' || timeframe.match(/^[0-9]{4}$/)) {
                    newRevenue[i] = (newRevenue[i] || 0) + (expectedTotalRev * (1 - progress));
                    newExpenses[i] = (newExpenses[i] || 0) + (expectedTotalExp * (1 - progress));
                } else {
                    newRevenue[i] = expectedTotalRev;
                    newExpenses[i] = expectedTotalExp;
                }
                revRange[i] = null;
                expRange[i] = null;
            } else {
                newRevenue[i] = bucketRev;
                newExpenses[i] = bucketExp;
            }
        }

        // --- Explainability (Q3 Roadmap) ---
        const activeTrends = Object.entries(catTrends).filter(([cat, trend]) => trend > 1.05 || trend < 0.95);
        const topGrowth = activeTrends.sort(([, a], [, b]) => b - a)[0];
        const topReduction = activeTrends.sort(([, a], [, b]) => a - b)[0];
        const totalSubCost = subs.reduce((sum, s) => sum + Math.abs(s.monthlyAmount), 0);
        
        const reasoning = {
            factors: [],
            summary: "The forecast is based on your recent spending habits and historical seasonality."
        };

        if (topGrowth && topGrowth[1] > 1) {
            reasoning.factors.push({ category: topGrowth[0], type: 'trend', direction: 'up', message: `Upward trend in ${topGrowth[0]} (+${((topGrowth[1]-1)*100).toFixed(0)}% monthly)` });
        }
        if (topReduction && topReduction[1] < 1) {
            reasoning.factors.push({ category: topReduction[0], type: 'trend', direction: 'down', message: `Downward trend in ${topReduction[0]} (-${((1-topReduction[1])*100).toFixed(0)}% monthly)` });
        }
        if (totalSubCost > 0) {
            reasoning.factors.push({ type: 'subscription', message: `Recurring monthly fixed costs of €${totalSubCost.toFixed(2)} detected.` });
        }
        
        // Seasonality hint for the next month
        const nextMonth = (new Date().getMonth() + 1) % 12;
        const nextSeasonality = getSeasonalityFactor(transactions, nextMonth);
        if (nextSeasonality > 1.1) reasoning.factors.push({ type: 'seasonality', message: "Next month typically shows higher spending based on historical data." });
        else if (nextSeasonality < 0.9) reasoning.factors.push({ type: 'seasonality', message: "Historical data suggests lower spending for the upcoming month." });

        return { 
            revenue: newRevenue, 
            expenses: newExpenses, 
            revRange: revRange, 
            expRange: expRange,
            reasoning: reasoning
        };
    }

    return {
        detectSubscriptions,
        calculateCategoryTrends,
        applyForecast
    };
})();

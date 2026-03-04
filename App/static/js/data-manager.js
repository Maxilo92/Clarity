window.DataManager = (function() {
    let transactions = [];

    const CACHE_KEY = 'clarityTransactionsCache';
    const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

    function getCachedData() {
        try {
            const raw = sessionStorage.getItem(CACHE_KEY);
            if (!raw) return null;
            const cache = JSON.parse(raw);
            if (Date.now() - cache.timestamp > CACHE_TTL) {
                sessionStorage.removeItem(CACHE_KEY);
                return null;
            }
            return cache.data;
        } catch(e) { return null; }
    }

    function setCachedData(data) {
        try {
            sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }));
        } catch(e) {}
    }

    function invalidateCache() {
        sessionStorage.removeItem(CACHE_KEY);
    }

    async function fetchTransactions(forceRefresh) {
        // Return cached data if still valid
        if (!forceRefresh) {
            const cached = getCachedData();
            if (cached && cached.length > 0) {
                transactions = cached;
                console.log("DataManager: " + transactions.length + " Transaktionen aus Cache geladen.");
                return transactions;
            }
        }

        try {
            const userStr = localStorage.getItem('clarityUser');
            let userIdQuery = '';
            let companyIdQuery = '';
            if (userStr) {
                const user = JSON.parse(userStr);
                if (user.id) userIdQuery = `&user_id=${user.id}`;
                if (user.company_id) companyIdQuery = `&company_id=${user.company_id}`;
            }
            // Fetch a high limit to ensure the graph has all data points
            const res = await fetch(`/api/transactions?limit=10000${userIdQuery}${companyIdQuery}`);
            const data = await res.json();
            transactions = data.eintraege || [];
            setCachedData(transactions);
            console.log("DataManager: " + transactions.length + " Transaktionen von API geladen.");
            return transactions;
        } catch (err) {
            console.error("Fehler beim Laden der Transaktionen:", err);
            return [];
        }
    }

    function getAggregatedData(timeframe) {
        const now = new Date();
        const nowYear = now.getFullYear();
        const nowMonth = now.getMonth();
        
        let targetYear = nowYear;
        if (/^\d{4}$/.test(timeframe)) {
            targetYear = parseInt(timeframe);
        }

        let labels = [];
        let revenue = [];
        let outgoings = [];

        if (timeframe === 'year' || /^\d{4}$/.test(timeframe)) {
            labels = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
            revenue = new Array(12).fill(0);
            outgoings = new Array(12).fill(0);
            
            transactions.forEach(t => {
                const d = new Date(t.timestamp);
                if (d.getFullYear() === targetYear) {
                    const month = d.getMonth();
                    const val = parseFloat(t.wert) || 0;
                    if (val >= 0) revenue[month] += val;
                    else outgoings[month] += Math.abs(val);
                }
            });
            console.log(`Daten für Jahr ${targetYear}:`, {revenue, outgoings});
        } 
        else if (timeframe === 'month') {
            labels = ['Woche 1', 'Woche 2', 'Woche 3', 'Woche 4', 'Woche 5'];
            revenue = new Array(5).fill(0);
            outgoings = new Array(5).fill(0);
            
            transactions.forEach(t => {
                const d = new Date(t.timestamp);
                if (d.getMonth() === nowMonth && d.getFullYear() === nowYear) {
                    const week = Math.min(4, Math.floor((d.getDate() - 1) / 7));
                    const val = parseFloat(t.wert) || 0;
                    if (val >= 0) revenue[week] += val;
                    else outgoings[week] += Math.abs(val);
                }
            });
        }
        else if (timeframe === 'week') {
            labels = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
            revenue = new Array(7).fill(0);
            outgoings = new Array(7).fill(0);
            
            const startOfWeek = new Date(now);
            const day = startOfWeek.getDay();
            const diff = startOfWeek.getDate() - (day === 0 ? 6 : day - 1);
            startOfWeek.setDate(diff);
            startOfWeek.setHours(0,0,0,0);

            transactions.forEach(t => {
                const d = new Date(t.timestamp);
                if (d >= startOfWeek) {
                    const dayIdx = (d.getDay() + 6) % 7;
                    const val = parseFloat(t.wert) || 0;
                    if (val >= 0) revenue[dayIdx] += val;
                    else outgoings[dayIdx] += Math.abs(val);
                }
            });
        }
        else if (timeframe.startsWith('2025Q')) {
            const quarter = parseInt(timeframe.charAt(5));
            const startMonth = (quarter - 1) * 3;
            const monthLabels = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
            labels = monthLabels.slice(startMonth, startMonth + 3);
            revenue = new Array(3).fill(0);
            outgoings = new Array(3).fill(0);

            transactions.forEach(t => {
                const d = new Date(t.timestamp);
                if (d.getFullYear() === 2025) {
                    const m = d.getMonth();
                    if (m >= startMonth && m < startMonth + 3) {
                        const idx = m - startMonth;
                        const val = parseFloat(t.wert) || 0;
                        if (val >= 0) revenue[idx] += val;
                        else outgoings[idx] += Math.abs(val);
                    }
                }
            });
        }

        return { labels, revenue, outgoings };
    }

    function searchTransactions(criteria) {
        return transactions.filter(t => {
            let match = true;
            if (criteria.category && t.kategorie.toLowerCase() !== criteria.category.toLowerCase()) match = false;
            if (criteria.name && !t.name.toLowerCase().includes(criteria.name.toLowerCase())) match = false;
            if (criteria.minAmount && Math.abs(parseFloat(t.wert)) < criteria.minAmount) match = false;
            if (criteria.maxAmount && Math.abs(parseFloat(t.wert)) > criteria.maxAmount) match = false;
            return match;
        });
    }

    function getAllTransactions() {
        return transactions;
    }

    return {
        fetchTransactions,
        invalidateCache,
        getAggregatedData,
        searchTransactions,
        getAllTransactions
    };
})();
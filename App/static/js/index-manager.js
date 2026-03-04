/**
 * IndexManager — Client-side IndexedDB transaction index
 * 
 * Provides fast, persistent local storage of all transactions with pre-computed
 * aggregations. On first load (or when stale) it fetches everything from the API
 * and builds the index with a visible progress bar. New transactions are inserted
 * incrementally without a full rebuild.
 */
(function() {
    const DB_NAME = 'clarityIndex';
    const DB_VERSION = 1;
    const STORE_TX   = 'transactions';
    const STORE_META = 'meta';

    let db = null;
    let isBuilding = false;

    // ── helpers ──────────────────────────────────────────────────────────
    function getUserInfo() {
        try {
            const u = JSON.parse(localStorage.getItem('clarityUser'));
            return { userId: u?.id, companyId: u?.company_id };
        } catch { return {}; }
    }

    // ── IndexedDB open / create ─────────────────────────────────────────
    function openDB() {
        return new Promise((resolve, reject) => {
            if (db) return resolve(db);
            const req = indexedDB.open(DB_NAME, DB_VERSION);
            req.onupgradeneeded = (e) => {
                const d = e.target.result;
                if (!d.objectStoreNames.contains(STORE_TX)) {
                    const store = d.createObjectStore(STORE_TX, { keyPath: 'id' });
                    store.createIndex('kategorie', 'kategorie', { unique: false });
                    store.createIndex('timestamp', 'timestamp', { unique: false });
                    store.createIndex('wert',      'wert',      { unique: false });
                    store.createIndex('name',      'name',      { unique: false });
                }
                if (!d.objectStoreNames.contains(STORE_META)) {
                    d.createObjectStore(STORE_META, { keyPath: 'key' });
                }
            };
            req.onsuccess = (e) => { db = e.target.result; resolve(db); };
            req.onerror   = (e) => reject(e.target.error);
        });
    }

    // ── generic IDB helpers ─────────────────────────────────────────────
    function idbPut(store, value) {
        return new Promise((resolve, reject) => {
            const tx = db.transaction(store, 'readwrite');
            tx.objectStore(store).put(value);
            tx.oncomplete = () => resolve();
            tx.onerror = (e) => reject(e.target.error);
        });
    }

    function idbGet(store, key) {
        return new Promise((resolve, reject) => {
            const tx = db.transaction(store, 'readonly');
            const req = tx.objectStore(store).get(key);
            req.onsuccess = () => resolve(req.result);
            req.onerror   = (e) => reject(e.target.error);
        });
    }

    function idbGetAll(store) {
        return new Promise((resolve, reject) => {
            const tx = db.transaction(store, 'readonly');
            const req = tx.objectStore(store).getAll();
            req.onsuccess = () => resolve(req.result || []);
            req.onerror   = (e) => reject(e.target.error);
        });
    }

    function idbCount(store) {
        return new Promise((resolve, reject) => {
            const tx = db.transaction(store, 'readonly');
            const req = tx.objectStore(store).count();
            req.onsuccess = () => resolve(req.result);
            req.onerror   = (e) => reject(e.target.error);
        });
    }

    function idbDelete(store, key) {
        return new Promise((resolve, reject) => {
            const tx = db.transaction(store, 'readwrite');
            tx.objectStore(store).delete(key);
            tx.oncomplete = () => resolve();
            tx.onerror = (e) => reject(e.target.error);
        });
    }

    function idbClear(store) {
        return new Promise((resolve, reject) => {
            const tx = db.transaction(store, 'readwrite');
            tx.objectStore(store).clear();
            tx.oncomplete = () => resolve();
            tx.onerror = (e) => reject(e.target.error);
        });
    }

    // ── Progress bar UI ─────────────────────────────────────────────────
    function showProgressBar() {
        if (document.getElementById('index-progress-container')) return;
        const container = document.createElement('div');
        container.id = 'index-progress-container';
        container.innerHTML = `
            <div class="index-progress-text">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
                <span id="index-progress-label">Indexing transactions…</span>
            </div>
            <div class="index-progress-track">
                <div class="index-progress-bar" id="index-progress-bar" style="width: 0%"></div>
            </div>
        `;
        document.body.appendChild(container);
    }

    function updateProgressBar(pct, label) {
        const bar = document.getElementById('index-progress-bar');
        const lbl = document.getElementById('index-progress-label');
        if (bar) bar.style.width = Math.min(100, pct).toFixed(1) + '%';
        if (lbl && label) lbl.textContent = label;
    }

    function hideProgressBar() {
        const el = document.getElementById('index-progress-container');
        if (el) {
            el.classList.add('index-progress-done');
            setTimeout(() => el.remove(), 600);
        }
    }

    // ── Fetch remote index status ───────────────────────────────────────
    async function fetchIndexStatus() {
        const { userId, companyId } = getUserInfo();
        if (!companyId) return { count: 0, latest_id: 0 };
        try {
            const res = await fetch(`/api/transactions/index-status?company_id=${companyId}&user_id=${userId}`);
            return await res.json();
        } catch { return { count: 0, latest_id: 0 }; }
    }

    // ── Full index build (paginated fetch) ──────────────────────────────
    async function buildFullIndex() {
        if (isBuilding) return;
        isBuilding = true;
        showProgressBar();
        updateProgressBar(0, 'Indexing transactions…');

        const { userId, companyId } = getUserInfo();
        if (!companyId) { isBuilding = false; hideProgressBar(); return; }

        try {
            await openDB();
            await idbClear(STORE_TX);

            const PAGE = 500;
            let offset = 0;
            let total = 0;
            let fetched = 0;

            // First request to know rough total
            const status = await fetchIndexStatus();
            total = status.count || 1;
            updateProgressBar(5, `Indexing 0 / ${total} transactions…`);

            while (true) {
                const res = await fetch(`/api/transactions?company_id=${companyId}&user_id=${userId}&limit=${PAGE}&offset=${offset}&sort=timestamp&order=ASC`);
                const data = await res.json();
                const batch = data.eintraege || [];
                if (batch.length === 0) break;

                // Write batch into IndexedDB
                await writeBatch(batch);
                fetched += batch.length;
                const pct = Math.min(95, (fetched / total) * 95);
                updateProgressBar(pct, `Indexing ${fetched} / ${total} transactions…`);

                if (batch.length < PAGE) break;
                offset += PAGE;
            }

            // Build aggregation caches
            updateProgressBar(96, 'Computing aggregations…');
            await rebuildAggregations();

            // Save meta
            await idbPut(STORE_META, { key: 'indexInfo', count: fetched, latest_id: status.latest_id, builtAt: Date.now() });

            updateProgressBar(100, `Index ready — ${fetched} transactions`);
            setTimeout(() => hideProgressBar(), 1200);
        } catch (err) {
            console.error('[IndexManager] Build failed:', err);
            updateProgressBar(100, 'Indexing failed');
            setTimeout(() => hideProgressBar(), 2000);
        } finally {
            isBuilding = false;
        }
    }

    function writeBatch(batch) {
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_TX, 'readwrite');
            const store = tx.objectStore(STORE_TX);
            batch.forEach(item => store.put(item));
            tx.oncomplete = () => resolve();
            tx.onerror = (e) => reject(e.target.error);
        });
    }

    // ── Pre-computed aggregations ───────────────────────────────────────
    async function rebuildAggregations() {
        const all = await idbGetAll(STORE_TX);
        const agg = computeAggregations(all);
        await idbPut(STORE_META, { key: 'aggregations', ...agg, computedAt: Date.now() });
        return agg;
    }

    function computeAggregations(transactions) {
        let totalIncome = 0, totalExpenses = 0;
        const byCategory = {};
        const byMonth = {};      // 'YYYY-MM' -> { income, expense }
        const byYear = {};       // 'YYYY'    -> { income, expense }
        const byWeekday = [0,0,0,0,0,0,0]; // 0=Mon expense totals

        transactions.forEach(t => {
            const val = parseFloat(t.wert) || 0;
            const cat = t.kategorie || 'Uncategorized';
            const d = new Date(t.timestamp);
            const ym = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
            const y = String(d.getFullYear());

            if (val >= 0) totalIncome += val;
            else totalExpenses += val;

            // By category
            if (!byCategory[cat]) byCategory[cat] = { income: 0, expense: 0, count: 0 };
            if (val >= 0) byCategory[cat].income += val;
            else byCategory[cat].expense += Math.abs(val);
            byCategory[cat].count++;

            // By month
            if (!byMonth[ym]) byMonth[ym] = { income: 0, expense: 0, count: 0 };
            if (val >= 0) byMonth[ym].income += val;
            else byMonth[ym].expense += Math.abs(val);
            byMonth[ym].count++;

            // By year
            if (!byYear[y]) byYear[y] = { income: 0, expense: 0, count: 0 };
            if (val >= 0) byYear[y].income += val;
            else byYear[y].expense += Math.abs(val);
            byYear[y].count++;

            // By weekday (expenses only)
            const wd = (d.getDay() + 6) % 7; // Mon=0
            if (val < 0) byWeekday[wd] += Math.abs(val);
        });

        return {
            totalIncome,
            totalExpenses,
            netSurplus: totalIncome + totalExpenses,
            transactionCount: transactions.length,
            byCategory,
            byMonth,
            byYear,
            byWeekday
        };
    }

    // ── Public: ensure index is ready ───────────────────────────────────
    async function ensureIndex() {
        await openDB();
        const meta = await idbGet(STORE_META, 'indexInfo');

        if (!meta || !meta.builtAt) {
            // No index → full build
            console.log('[IndexManager] No index found, building…');
            await buildFullIndex();
            return;
        }

        // Check freshness against server
        const status = await fetchIndexStatus();
        if (status.count !== meta.count || status.latest_id !== meta.latest_id) {
            console.log(`[IndexManager] Index stale (local: ${meta.count}, server: ${status.count}), rebuilding…`);
            await buildFullIndex();
        } else {
            console.log(`[IndexManager] Index up-to-date (${meta.count} transactions)`);
        }
    }

    // ── Public: get all indexed transactions ────────────────────────────
    async function getAllTransactions() {
        await openDB();
        return idbGetAll(STORE_TX);
    }

    // ── Public: get pre-computed aggregations ───────────────────────────
    async function getAggregations() {
        await openDB();
        let agg = await idbGet(STORE_META, 'aggregations');
        if (!agg || !agg.computedAt) {
            agg = await rebuildAggregations();
        }
        return agg;
    }

    // ── Public: add single transaction to index (incremental) ───────────
    async function addToIndex(transaction) {
        await openDB();
        await idbPut(STORE_TX, transaction);

        // Update meta count
        const meta = await idbGet(STORE_META, 'indexInfo') || { key: 'indexInfo', count: 0, latest_id: 0, builtAt: Date.now() };
        meta.count++;
        if (transaction.id > (meta.latest_id || 0)) meta.latest_id = transaction.id;
        await idbPut(STORE_META, meta);

        // Recompute aggregations (fast, runs on local data)
        await rebuildAggregations();
        console.log(`[IndexManager] Added transaction ${transaction.id} to index`);
    }

    // ── Public: update a transaction in the index ───────────────────────
    async function updateInIndex(transaction) {
        await openDB();
        await idbPut(STORE_TX, transaction);
        await rebuildAggregations();
        console.log(`[IndexManager] Updated transaction ${transaction.id} in index`);
    }

    // ── Public: remove a transaction from the index ─────────────────────
    async function removeFromIndex(id) {
        await openDB();
        const numId = typeof id === 'string' ? parseFloat(id) : id;
        await idbDelete(STORE_TX, numId);

        const meta = await idbGet(STORE_META, 'indexInfo');
        if (meta) { meta.count = Math.max(0, (meta.count || 1) - 1); await idbPut(STORE_META, meta); }

        await rebuildAggregations();
        console.log(`[IndexManager] Removed transaction ${id} from index`);
    }

    // ── Public: query helpers ───────────────────────────────────────────
    async function getByCategory(category) {
        await openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_TX, 'readonly');
            const idx = tx.objectStore(STORE_TX).index('kategorie');
            const req = idx.getAll(category);
            req.onsuccess = () => resolve(req.result || []);
            req.onerror = (e) => reject(e.target.error);
        });
    }

    async function getByDateRange(start, end) {
        await openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_TX, 'readonly');
            const idx = tx.objectStore(STORE_TX).index('timestamp');
            const range = IDBKeyRange.bound(start, end);
            const req = idx.getAll(range);
            req.onsuccess = () => resolve(req.result || []);
            req.onerror = (e) => reject(e.target.error);
        });
    }

    async function search(query) {
        const all = await getAllTransactions();
        const q = query.toLowerCase();
        return all.filter(t =>
            (t.name && t.name.toLowerCase().includes(q)) ||
            (t.kategorie && t.kategorie.toLowerCase().includes(q)) ||
            (t.sender && t.sender.toLowerCase().includes(q)) ||
            (t.empfaenger && t.empfaenger.toLowerCase().includes(q))
        );
    }

    // ── Public: force full rebuild ──────────────────────────────────────
    async function forceRebuild() {
        await buildFullIndex();
    }

    // ── Public: get index status ────────────────────────────────────────
    async function getIndexInfo() {
        await openDB();
        return await idbGet(STORE_META, 'indexInfo') || null;
    }

    // Public API
    window.IndexManager = {
        ensureIndex,
        getAllTransactions,
        getAggregations,
        addToIndex,
        updateInIndex,
        removeFromIndex,
        getByCategory,
        getByDateRange,
        search,
        forceRebuild,
        getIndexInfo
    };
})();

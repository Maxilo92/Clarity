(function() {
    function init() {
        console.log("[Transactions] Initializing list and filters...");
        const tableBody = document.querySelector('.transactions-table tbody');
        const tableEl = document.querySelector('.transactions-table');
        const modal = document.getElementById('transactionModal');
        const detailsModal = document.getElementById('detailsModal');
        const btnAdd = document.getElementById('btnAddRecipt');
        const btnCancel = document.getElementById('btnCancel');
        const btnModalClose = document.getElementById('btnModalClose');
        const btnDetailsClose = document.getElementById('btnDetailsClose');
        const btnDetailsCloseBottom = document.getElementById('btnDetailsCloseBottom');
        const btnDetailsEdit = document.getElementById('btnDetailsEdit');
        const btnDeleteTransaction = document.getElementById('btnDeleteTransaction');
        const form = document.getElementById('transactionForm');
        
        // Detail View UI Elements
        const detName = document.getElementById('detName');
        const detDate = document.getElementById('detDate');
        const detAmount = document.getElementById('detAmount');
        const detCategory = document.getElementById('detCategory');
        const detDescription = document.getElementById('detDescription');
        const detSender = document.getElementById('detSender');
        const detRecipient = document.getElementById('detRecipient');
        const detId = document.getElementById('detId');

        // Handle type toggle
        const typeRadios = document.querySelectorAll('input[name="type"]');
        const tTypeHidden = document.getElementById('tType');
        typeRadios.forEach(radio => {
            radio.addEventListener('change', () => {
                if (radio.checked) tTypeHidden.value = radio.value;
            });
        });

        if (btnModalClose) btnModalClose.onclick = () => modal.style.display = 'none';
        if (btnDetailsClose) btnDetailsClose.onclick = () => detailsModal.style.display = 'none';
        if (btnDetailsCloseBottom) btnDetailsCloseBottom.onclick = () => detailsModal.style.display = 'none';
        
        const contextMenu = document.getElementById('contextMenu');
        const cmAskClair = document.getElementById('cmAskClair');
        const cmEdit = document.getElementById('cmEdit');
        const cmDelete = document.getElementById('cmDelete');
        const searchInput = document.getElementById('globalSearch');

        let selectedTransactionId = null;
        let currentCategoryFilter = 'all';
        let currentSearchQuery = '';
        let currentDateFilter = '';
        let currentIdFilter = '';
        let currentSortColumn = 'timestamp';
        let currentSortOrder = 'DESC';
        
        let allEntries = [];
        let currentOffset = 0;
        const PAGE_SIZE = 25;
        let isLoading = false;
        let hasMore = true;

        const columnMap = {
            'Name': 'name', 'Category': 'kategorie', 'Amount': 'wert', 'Date': 'timestamp',
            'name': 'Name', 'kategorie': 'Category', 'wert': 'Amount', 'timestamp': 'Date'
        };

        function loadTransactions(append = false) {
            if (isLoading || (!hasMore && append)) return;
            isLoading = true;
            if (!append) { currentOffset = 0; hasMore = true; if (tableEl) tableEl.classList.add('is-loading'); }
            const userStr = localStorage.getItem('clarityUser');
            let userIdQuery = ''; let companyIdQuery = '';
            if (userStr) { try { const user = JSON.parse(userStr); if (user.id) userIdQuery = `&user_id=${user.id}`; if (user.company_id) companyIdQuery = `&company_id=${user.company_id}`; } catch(e) {} }
            let url = `/api/transactions?limit=${PAGE_SIZE}&offset=${currentOffset}${userIdQuery}${companyIdQuery}`;
            if (currentCategoryFilter !== 'all') url += `&category=${encodeURIComponent(currentCategoryFilter)}`;
            if (currentSearchQuery) url += `&search=${encodeURIComponent(currentSearchQuery)}`;
            if (currentDateFilter) url += `&date=${encodeURIComponent(currentDateFilter)}`;
            if (currentIdFilter) url += `&id=${encodeURIComponent(currentIdFilter)}`;
            url += `&sort=${currentSortColumn}&order=${currentSortOrder}`;
            fetch(url).then(res => res.json()).then(data => {
                const newEntries = data.eintraege || [];
                if (!append) { allEntries = newEntries; if (tableBody) tableBody.innerHTML = ''; } else { allEntries = allEntries.concat(newEntries); }
                if (newEntries.length < PAGE_SIZE) hasMore = false;
                isLoading = false; currentOffset += newEntries.length;
                if (tableEl) tableEl.classList.remove('is-loading');
                updateHeaderTags(); renderTable(allEntries, append);
            }).catch(err => { console.error("Error loading transactions:", err); isLoading = false; if (tableEl) tableEl.classList.remove('is-loading'); });
        }

        function syncSearchActiveClass() { const isSearching = !!(currentSearchQuery || currentIdFilter || currentDateFilter); document.body.classList.toggle('search-active', isSearching); }

        function updateHeaderTags() {
            const titleEl = document.querySelector('.transactions-title'); if (!titleEl) return;
            let html = 'Transactions';
            if (currentIdFilter) html += ` <span style="font-size: 0.5em; vertical-align: middle; background: #fee2e2; color: #991b1b; padding: 4px 12px; border-radius: 12px; margin-left: 10px; font-weight: bold; display: inline-block;">Item ID: ${currentIdFilter} <span id="clearIdFilter" style="cursor:pointer; margin-left: 5px; font-weight: bold;">×</span></span>`;
            if (currentCategoryFilter !== 'all') html += ` <span style="font-size: 0.5em; vertical-align: middle; background: #f3f0ff; color: #6f42c1; padding: 4px 12px; border-radius: 12px; margin-left: 10px; font-weight: bold; display: inline-block;">${currentCategoryFilter} <span id="clearCatFilter" style="cursor:pointer; margin-left: 5px; font-weight: bold;">×</span></span>`;
            if (currentDateFilter) html += ` <span style="font-size: 0.5em; vertical-align: middle; background: #fef3c7; color: #92400e; padding: 4px 12px; border-radius: 12px; margin-left: 10px; font-weight: bold; display: inline-block;">${currentDateFilter} <span id="clearDateFilter" style="cursor:pointer; margin-left: 5px; font-weight: bold;">×</span></span>`;
            if (currentSearchQuery) html += ` <span style="font-size: 0.5em; vertical-align: middle; background: #e0f2fe; color: #0369a1; padding: 4px 12px; border-radius: 12px; margin-left: 10px; font-weight: bold; display: inline-block;">"${currentSearchQuery}" <span id="clearSearchFilter" style="cursor:pointer; margin-left: 5px; font-weight: bold;">×</span></span>`;
            if (currentSortColumn !== 'timestamp' || currentSortOrder !== 'DESC') {
                const colLabel = columnMap[currentSortColumn] || currentSortColumn;
                html += ` <span style="font-size: 0.5em; vertical-align: middle; background: #dcfce7; color: #166534; padding: 4px 12px; border-radius: 12px; margin-left: 10px; font-weight: bold; display: inline-block;">Sorted: ${colLabel} ${currentSortOrder.toLowerCase()} <span id="clearSortFilter" style="cursor:pointer; margin-left: 5px; font-weight: bold;">×</span></span>`;
            }
            titleEl.innerHTML = html;
            const cId = document.getElementById('clearIdFilter'); if (cId) cId.onclick = (e) => { e.stopPropagation(); currentIdFilter = ''; syncSearchActiveClass(); loadTransactions(false); };
            const cCat = document.getElementById('clearCatFilter'); if (cCat) cCat.onclick = (e) => { e.stopPropagation(); currentCategoryFilter = 'all'; syncSearchActiveClass(); applyFilter(); };
            const cDate = document.getElementById('clearDateFilter'); if (cDate) cDate.onclick = (e) => { e.stopPropagation(); currentDateFilter = ''; syncSearchActiveClass(); loadTransactions(false); };
            const cSearch = document.getElementById('clearSearchFilter'); if (cSearch) cSearch.onclick = (e) => { e.stopPropagation(); currentSearchQuery = ''; currentDateFilter = ''; currentIdFilter = ''; if(searchInput) searchInput.value = ''; syncSearchActiveClass(); loadTransactions(false); };
            const cSort = document.getElementById('clearSortFilter'); if (cSort) cSort.onclick = (e) => { e.stopPropagation(); currentSortColumn = 'timestamp'; currentSortOrder = 'DESC'; document.querySelectorAll('.transactions-table th').forEach(h => h.innerHTML = h.textContent.replace(' ▲', '').replace(' ▼', '')); loadTransactions(false); };
        }

        function applyFilter() { document.dispatchEvent(new CustomEvent('categoryChanged', { detail: { category: currentCategoryFilter } })); loadTransactions(false); }

        document.querySelectorAll('.transactions-table th').forEach(th => {
            const dbCol = columnMap[th.textContent.trim().replace(' ▲', '').replace(' ▼', '')];
            if (dbCol) {
                th.style.cursor = 'pointer'; th.title = 'Click to sort';
                th.onclick = () => {
                    if (currentSortColumn === dbCol) currentSortOrder = (currentSortOrder === 'ASC' ? 'DESC' : 'ASC'); else { currentSortColumn = dbCol; currentSortOrder = 'ASC'; }
                    document.querySelectorAll('.transactions-table th').forEach(h => h.innerHTML = h.textContent.replace(' ▲', '').replace(' ▼', ''));
                    th.innerHTML += (currentSortOrder === 'ASC' ? ' ▲' : ' ▼'); loadTransactions(false);
                };
            }
        });

        if (searchInput) {
            const clearSearchBtn = document.getElementById('clearSearch'); let timeout;
            searchInput.addEventListener('input', (e) => {
                const val = e.target.value.trim();
                if (val && currentCategoryFilter !== 'all') { currentCategoryFilter = 'all'; updateHeaderTags(); document.dispatchEvent(new CustomEvent('categoryChanged', { detail: { category: 'all' } })); }
                document.body.classList.toggle('search-active', !!val);
                if (clearSearchBtn) clearSearchBtn.style.display = val ? 'block' : 'none';
                if (!val || val === '-' || val === '+') { currentSearchQuery = ''; currentDateFilter = ''; document.body.classList.remove('search-active'); loadTransactions(false); return; }
                clearTimeout(timeout);
                timeout = setTimeout(() => { 
                    const datePattern = /^(\d{4}-\d{2}-\d{2})|(\d{2}\.\d{2}\.\d{4})$/;
                    if (datePattern.test(val)) { let dateVal = val; if (val.includes('.')) { const [d, m, y] = val.split('.'); dateVal = `${y}-${m}-${d}`; } currentDateFilter = dateVal; currentSearchQuery = ''; }
                    else { currentSearchQuery = val.replace(',', '.').replace('€', ''); }
                    if (currentSearchQuery) currentDateFilter = ''; loadTransactions(false); 
                }, 300);
            });
            if (clearSearchBtn) clearSearchBtn.onclick = () => { searchInput.value = ''; clearSearchBtn.style.display = 'none'; currentSearchQuery = ''; currentDateFilter = ''; document.body.classList.remove('search-active'); loadTransactions(false); };
        }

        const currencyFormatter = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' });

        function showDetails(data) {
            selectedTransactionId = data.id; detName.textContent = data.name || 'Untitled';
            detDate.textContent = new Date(data.timestamp).toLocaleDateString('de-DE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
            const val = parseFloat(data.wert); detAmount.textContent = currencyFormatter.format(val); detAmount.className = 'detail-value amount-value ' + (val >= 0 ? 'amount-positive' : 'amount-negative');
            detCategory.textContent = data.kategorie; detDescription.textContent = data.beschreibung || '-'; detSender.textContent = data.sender || '-'; detRecipient.textContent = data.empfaenger || '-'; detId.textContent = data.id;
            if (window.JsBarcode) { JsBarcode("#barcode", data.id.toString(), { format: "CODE128", width: 2, height: 40, displayValue: false, lineColor: "#64748b" }); }
            detailsModal.style.display = 'flex';
        }

        btnDetailsEdit.onclick = () => { detailsModal.style.display = 'none'; cmEdit.onclick(); };

        function renderTable(entries, append = false) {
            if (!entries || entries.length === 0) { if (tableBody && !append) tableBody.innerHTML = `<tr><td colspan="4" class="empty">No entries found</td></tr>`; return; }
            if (tableBody) {
                if (!append) tableBody.innerHTML = '';
                entries.forEach(e => {
                    const tr = document.createElement('tr'); tr.dataset.id = e.id; tr.dataset.raw = JSON.stringify(e);
                    tr.style.cursor = 'pointer'; const val = parseFloat(e.wert);
                    tr.innerHTML = `<td class="name-cell" style="font-weight:600;color:#1e293b;">${e.name || 'Untitled'}</td><td class="cat-cell"><span class="filter-link" style="color:#6f42c1;font-weight:500;cursor:pointer;">${e.kategorie}</span></td><td style="color:${val>=0?'#28a745':'#dc3545'};font-weight:bold">${currencyFormatter.format(val)}</td><td class="date-cell"><span class="filter-link" style="color:#64748b;cursor:pointer;">${new Date(e.timestamp).toLocaleDateString('de-DE')}</span></td>`;
                    tr.onclick = (ev) => { if (ev.target.classList.contains('filter-link')) return; showDetails(e); };
                    const catLink = tr.querySelector('.cat-cell .filter-link'); if (catLink) catLink.onclick = (ev) => { ev.stopPropagation(); currentCategoryFilter = e.kategorie; applyFilter(); };
                    const dateLink = tr.querySelector('.date-cell .filter-link'); if (dateLink) dateLink.onclick = (ev) => { ev.stopPropagation(); currentDateFilter = e.timestamp.split('T')[0]; loadTransactions(false); };
                    tr.oncontextmenu = (ev) => { ev.preventDefault(); ev.stopPropagation(); selectedTransactionId = e.id; if (contextMenu) { contextMenu.style.display = 'block'; contextMenu.style.left = ev.clientX + 'px'; contextMenu.style.top = ev.clientY + 'px'; const menuHeight = contextMenu.offsetHeight; if (ev.clientY + menuHeight > window.innerHeight) contextMenu.style.top = (ev.clientY - menuHeight) + 'px'; } };
                    tableBody.appendChild(tr);
                });
            }
        }

        window.addEventListener('scroll', () => { if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 500) if (hasMore && !isLoading) loadTransactions(true); });
        window.onclick = (event) => { if(contextMenu) contextMenu.style.display = 'none'; if(modal && event.target == modal) modal.style.display = 'none'; if(detailsModal && event.target == detailsModal) detailsModal.style.display = 'none'; };
        
        if (cmAskClair) cmAskClair.onclick = () => { const row = document.querySelector(`tr[data-id="${selectedTransactionId}"]`); if (row) document.dispatchEvent(new CustomEvent('attachToClair', { detail: { transaction: JSON.parse(row.dataset.raw) } })); if (contextMenu) contextMenu.style.display = 'none'; };

        cmDelete.onclick = () => {
            if (selectedTransactionId && confirm('Really delete?')) {
                const delId = selectedTransactionId;
                const userStr = localStorage.getItem('clarityUser'); let companyIdQuery = ''; if (userStr) { const user = JSON.parse(userStr); if (user.company_id) companyIdQuery = `?company_id=${user.company_id}`; }
                fetch('/api/transactions/' + delId + companyIdQuery, { method: 'DELETE' }).then(() => { if (window.DataManager && window.DataManager.invalidateCache) window.DataManager.invalidateCache(); if (window.IndexManager) window.IndexManager.removeFromIndex(delId); loadTransactions(); document.dispatchEvent(new Event('dataUpdated')); });
            }
        };

        cmEdit.onclick = () => {
            const row = document.querySelector(`tr[data-id="${selectedTransactionId}"]`); if (!row) return;
            const data = JSON.parse(row.dataset.raw);
            document.getElementById('tName').value = data.name; document.getElementById('tBeschreibung').value = data.beschreibung || ''; document.getElementById('tKategorie').value = data.kategorie;
            document.getElementById('tWert').value = Math.abs(data.wert); document.getElementById('tSender').value = data.sender || ''; document.getElementById('tEmpfaenger').value = data.empfaenger || ''; 
            const isIncome = data.wert >= 0; document.getElementById('tType').value = isIncome ? 'income' : 'expense'; document.getElementById('typeIncome').checked = isIncome; document.getElementById('typeExpense').checked = !isIncome;
            if (data.timestamp) document.getElementById('tDate').value = data.timestamp.split('T')[0];
            form.dataset.editId = selectedTransactionId; if (btnDeleteTransaction) btnDeleteTransaction.style.display = 'block'; modal.style.display = 'flex';
        };

        btnDeleteTransaction.onclick = () => {
            const editId = form.dataset.editId;
            if (editId && confirm('Really delete this transaction?')) {
                const userStr = localStorage.getItem('clarityUser'); let companyIdQuery = ''; if (userStr) { const user = JSON.parse(userStr); if (user.company_id) companyIdQuery = `?company_id=${user.company_id}`; }
                fetch('/api/transactions/' + editId + companyIdQuery, { method: 'DELETE' }).then(() => { modal.style.display = 'none'; if (window.DataManager && window.DataManager.invalidateCache) window.DataManager.invalidateCache(); if (window.IndexManager) window.IndexManager.removeFromIndex(editId); loadTransactions(); document.dispatchEvent(new Event('dataUpdated')); });
            }
        };

        form.onsubmit = (e) => {
            e.preventDefault(); const editId = form.dataset.editId; let wert = parseFloat(document.getElementById('tWert').value);
            if (document.getElementById('tType').value === 'expense') wert = -Math.abs(wert);
            const userStr = localStorage.getItem('clarityUser'); let userId = null; let companyId = null; if (userStr) { const user = JSON.parse(userStr); userId = user.id; companyId = user.company_id; }
            const payload = { name: document.getElementById('tName').value, beschreibung: document.getElementById('tBeschreibung').value, kategorie: document.getElementById('tKategorie').value, wert: wert, sender: document.getElementById('tSender').value, empfaenger: document.getElementById('tEmpfaenger').value, timestamp: new Date(document.getElementById('tDate').value).toISOString(), user_id: userId, company_id: companyId };
            fetch(editId ? '/api/transactions/' + editId : '/api/transactions', { method: editId ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }).then(() => {
                modal.style.display = 'none'; form.reset(); delete form.dataset.editId;
                if (window.DataManager && window.DataManager.invalidateCache) window.DataManager.invalidateCache();
                // Incrementally update the local index
                if (window.IndexManager) {
                    const indexEntry = { id: editId ? parseFloat(editId) : Date.now(), name: payload.name, kategorie: payload.kategorie, wert: payload.wert, timestamp: payload.timestamp, sender: payload.sender, empfaenger: payload.empfaenger, beschreibung: payload.beschreibung, user_id: payload.user_id };
                    if (editId) window.IndexManager.updateInIndex(indexEntry);
                    else window.IndexManager.addToIndex(indexEntry);
                }
                loadTransactions(); document.dispatchEvent(new Event('dataUpdated'));
            });
        };

        btnAdd.onclick = () => { if (form) form.reset(); delete form.dataset.editId; if (btnDeleteTransaction) btnDeleteTransaction.style.display = 'none'; document.getElementById('tDate').value = new Date().toISOString().split('T')[0]; modal.style.display = 'flex'; };
        if (btnCancel) btnCancel.onclick = () => modal.style.display = 'none';

        loadTransactions();
        document.addEventListener('dataUpdated', () => { loadTransactions(); });

        // Pick up ?search= from URL (e.g. coming from Insights subscription click)
        const urlParams = new URLSearchParams(window.location.search);
        const urlSearch = urlParams.get('search');
        if (urlSearch) {
            currentSearchQuery = urlSearch;
            if (searchInput) searchInput.value = urlSearch;
            syncSearchActiveClass();
            loadTransactions(false);
            // Clean URL so a reload doesn't re-apply the filter
            window.history.replaceState({}, '', window.location.pathname);
        }

        document.addEventListener('forceFilter', (e) => {
            const { category, date, search, id } = e.detail;
            if (id !== undefined) { currentIdFilter = id; if (id) { currentCategoryFilter = 'all'; currentDateFilter = ''; currentSearchQuery = ''; if (searchInput) searchInput.value = ''; } }
            else { if (category !== undefined) currentCategoryFilter = category; if (date !== undefined) currentDateFilter = date; if (search !== undefined) { currentSearchQuery = search; if (searchInput) searchInput.value = search; } currentIdFilter = ''; }
            syncSearchActiveClass(); loadTransactions(false); document.dispatchEvent(new CustomEvent('categoryChanged', { detail: { category: currentCategoryFilter } }));
        });
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();

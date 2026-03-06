/**
 * CategoryManager — Global category management module
 * Fetches categories from the API and provides them to all pages.
 * Uses sessionStorage caching to avoid redundant calls.
 */
(function() {
    const CACHE_KEY = 'clarityCategoriesCache';
    const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

    function getCompanyId() {
        try {
            const user = JSON.parse(localStorage.getItem('clarityUser'));
            return user?.company_id;
        } catch { return null; }
    }

    function getCached() {
        const companyId = getCompanyId();
        if (!companyId) return null;
        try {
            const raw = sessionStorage.getItem(`${CACHE_KEY}_${companyId}`);
            if (!raw) return null;
            const cached = JSON.parse(raw);
            if (Date.now() - cached.timestamp > CACHE_TTL) {
                sessionStorage.removeItem(`${CACHE_KEY}_${companyId}`);
                return null;
            }
            return cached.categories;
        } catch { return null; }
    }

    function setCache(categories) {
        const companyId = getCompanyId();
        if (!companyId) return;
        try {
            sessionStorage.setItem(`${CACHE_KEY}_${companyId}`, JSON.stringify({ categories, timestamp: Date.now() }));
        } catch {}
    }

    /**
     * Fetch categories from the API (with cache).
     * @param {boolean} forceRefresh - skip cache
     * @returns {Promise<Array>} categories list
     */
    async function fetchCategories(forceRefresh = false) {
        if (!forceRefresh) {
            const cached = getCached();
            if (cached) return cached;
        }

        const companyId = getCompanyId();
        if (!companyId) return getDefaults();

        try {
            const res = await fetch(`/api/categories?company_id=${companyId}`);
            if (!res.ok) throw new Error('API error');
            const data = await res.json();
            const categories = data.categories || [];
            if (categories.length === 0) return getDefaults();
            setCache(categories);
            return categories;
        } catch (err) {
            console.warn('[CategoryManager] API fetch failed, using defaults:', err);
            return getDefaults();
        }
    }

    /**
     * Add a new custom category.
     */
    async function addCategory(name, color, icon) {
        const companyId = getCompanyId();
        if (!companyId) throw new Error('Not logged in');

        const res = await fetch('/api/categories', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ company_id: companyId, name: name.trim(), color: color || '#6f42c1', icon: icon || 'tag' })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to add category');
        invalidateCache();
        return data;
    }

    /**
     * Delete a custom category.
     */
    async function deleteCategory(id) {
        const companyId = getCompanyId();
        if (!companyId) throw new Error('Not logged in');

        const res = await fetch(`/api/categories/${id}?company_id=${companyId}`, { method: 'DELETE' });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to delete category');
        invalidateCache();
        return data;
    }

    /**
     * Invalidate the categories cache.
     */
    function invalidateCache() {
        const companyId = getCompanyId();
        if (companyId) {
            sessionStorage.removeItem(`${CACHE_KEY}_${companyId}`);
        }
    }

    /**
     * Fallback default categories when API is unavailable.
     */
    function getDefaults() {
        return [
            { id: 0, name: 'Food', color: '#27ae60', icon: 'utensils', is_default: 1 },
            { id: 0, name: 'Housing', color: '#3498db', icon: 'home', is_default: 1 },
            { id: 0, name: 'Transportation', color: '#f39c12', icon: 'car', is_default: 1 },
            { id: 0, name: 'Leisure', color: '#9b59b6', icon: 'gamepad', is_default: 1 },
            { id: 0, name: 'Shopping', color: '#e74c3c', icon: 'shopping-bag', is_default: 1 },
            { id: 0, name: 'Health', color: '#1abc9c', icon: 'heartbeat', is_default: 1 },
            { id: 0, name: 'Income', color: '#2ecc71', icon: 'wallet', is_default: 1 },
            { id: 0, name: 'Miscellaneous', color: '#95a5a6', icon: 'tag', is_default: 1 }
        ];
    }

    /**
     * Populate a <select> element with category options.
     * @param {string|HTMLElement} selectEl - selector string or element
     * @param {string} selectedValue - pre-selected category name
     */
    async function populateSelect(selectEl, selectedValue) {
        const el = typeof selectEl === 'string' ? document.querySelector(selectEl) : selectEl;
        if (!el) return;

        const categories = await fetchCategories();
        el.innerHTML = '';
        categories.forEach(cat => {
            const opt = document.createElement('option');
            opt.value = cat.name;
            opt.textContent = cat.name;
            if (selectedValue && cat.name === selectedValue) opt.selected = true;
            el.appendChild(opt);
        });

        // Default to 'Miscellaneous' if none selected
        if (!selectedValue && el.querySelector('option[value="Miscellaneous"]')) {
            el.value = 'Miscellaneous';
        }
    }

    /**
     * Get the color for a category name.
     */
    async function getCategoryColor(name) {
        const categories = await fetchCategories();
        const cat = categories.find(c => c.name.toLowerCase() === name.toLowerCase());
        return cat ? cat.color : '#95a5a6';
    }

    /**
     * Get all category names as a simple array.
     */
    async function getCategoryNames() {
        const categories = await fetchCategories();
        return categories.map(c => c.name);
    }

    // Public API
    window.CategoryManager = {
        fetchCategories,
        addCategory,
        deleteCategory,
        invalidateCache,
        getDefaults,
        populateSelect,
        getCategoryColor,
        getCategoryNames
    };
})();

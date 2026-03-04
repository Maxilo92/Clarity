/**
 * sidebar-admin.js — Dynamically injects admin-only sidebar items.
 * Waits for DOM to be ready, checks user role, and adds Admin section to sidebar.
 */
(function() {
    function normalizePath(path) {
        if (!path) return '/';
        const clean = path.replace(/\/+$/, '');
        return clean || '/';
    }

    function setActiveByPath() {
        const currentPath = normalizePath(window.location.pathname);
        const items = document.querySelectorAll('.sidebar .menu .menu-item');
        if (!items.length) return;

        items.forEach(i => i.classList.remove('active'));
        items.forEach(item => {
            const link = item.querySelector('a[href]');
            if (!link) return;
            const linkPath = normalizePath(new URL(link.href, window.location.origin).pathname);
            if (linkPath === currentPath) item.classList.add('active');
        });
    }

    function injectAdminItems() {
        try {
            // Check user role
            const userStr = localStorage.getItem('clarityUser');
            if (!userStr) return false;
            
            const user = JSON.parse(userStr);
            if (!user || user.role !== 'admin') return false;

            // Find menu
            const menu = document.querySelector('.sidebar nav .menu');
            if (!menu) return false;

            // Check if already injected or already present statically
            if (menu.querySelector('[data-admin-section]') || menu.querySelector('a[href="/admin"]') || menu.querySelector('a[href="/dev-tools"]')) {
                setActiveByPath();
                return true;
            }

            // Separator
            const sep = document.createElement('li');
            sep.setAttribute('data-admin-section', 'true');
            sep.style.cssText = 'border-top: 1px solid rgba(255,255,255,0.08); margin: 10px 14px 6px; list-style: none;';
            menu.appendChild(sep);

            // Label
            const label = document.createElement('li');
            label.setAttribute('data-admin-section', 'true');
            label.style.cssText = 'padding: 2px 18px 4px; font-size: 0.65rem; text-transform: uppercase; letter-spacing: 1.2px; color: rgba(255,255,255,0.35); font-weight: 700; list-style: none;';
            label.textContent = 'Admin';
            menu.appendChild(label);

            const adminItems = [
                { href: '/admin', text: 'Admin Panel' },
                { href: '/dev-tools', text: 'Developer Tools' }
            ];

            const currentPath = normalizePath(window.location.pathname);

            adminItems.forEach(item => {
                const li = document.createElement('li');
                li.setAttribute('data-admin-section', 'true');
                li.className = 'menu-item' + (currentPath === normalizePath(item.href) ? ' active' : '');
                const a = document.createElement('a');
                a.href = item.href;
                a.innerHTML = `<span class="menu-icon"></span><span>${item.text}</span>`;
                li.appendChild(a);
                menu.appendChild(li);
            });

            setActiveByPath();

            return true;
        } catch(e) {
            console.warn('[sidebar-admin] Error:', e.message);
            return false;
        }
    }

    // Try immediately (in case DOM is already ready)
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', injectAdminItems);
    } else {
        injectAdminItems();
    }

    // Also try with setTimeout as fallback
    setTimeout(injectAdminItems, 100);
})();

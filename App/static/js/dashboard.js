// Navigation Interactivity
function initSidebar() {
    const normalizePath = (p) => {
        if (!p) return '/';
        const clean = p.replace(/\/+$/, '');
        return clean || '/';
    };

    const setActiveByPath = () => {
        const currentPath = normalizePath(window.location.pathname);
        const items = document.querySelectorAll('.sidebar .menu .menu-item');
        if (!items.length) return;

        items.forEach(i => i.classList.remove('active'));

        let bestMatch = null;
        items.forEach(item => {
            const link = item.querySelector('a[href]');
            if (!link) return;
            const linkPath = normalizePath(new URL(link.href, window.location.origin).pathname);
            if (linkPath === currentPath) bestMatch = item;
        });

        if (bestMatch) bestMatch.classList.add('active');
    };

    const injectAdminItemsIfMissing = (user) => {
        if (!user || user.role !== 'admin') return;
        const menu = document.querySelector('nav ul.menu');
        if (!menu) return;

        const hasAdminLinks = menu.querySelector('a[href="/admin"]') || menu.querySelector('a[href="/dev-tools"]');
        if (hasAdminLinks) return;

        const sep = document.createElement('li');
        sep.setAttribute('data-admin-section', 'true');
        sep.style.cssText = 'border-top: 1px solid rgba(255,255,255,0.08); margin: 10px 14px 6px; list-style: none;';
        menu.appendChild(sep);

        const label = document.createElement('li');
        label.setAttribute('data-admin-section', 'true');
        label.style.cssText = 'padding: 2px 18px 4px; font-size: 0.65rem; text-transform: uppercase; letter-spacing: 1.2px; color: rgba(255,255,255,0.35); font-weight: 700; list-style: none;';
        label.textContent = 'Admin';
        menu.appendChild(label);

        [
            { href: '/admin', text: 'Admin Panel' },
            { href: '/dev-tools', text: 'Developer Tools' }
        ].forEach(item => {
            const li = document.createElement('li');
            li.className = 'menu-item';
            li.setAttribute('data-admin-section', 'true');
            li.innerHTML = `
                <a href="${item.href}">
                    <span class="menu-icon"></span>
                    <span>${item.text}</span>
                </a>
            `;
            menu.appendChild(li);
        });
    };

    const userStr = localStorage.getItem('clarityUser');
    if (userStr) {
        try {
            const user = JSON.parse(userStr);
            injectAdminItemsIfMissing(user);
            
            const nameEls = document.querySelectorAll('.header-profile-link .name-text');
            nameEls.forEach(el => { el.textContent = user.full_name || 'Profile'; });
            
        } catch(e) { console.error("Error parsing user info", e); }
    }

    setActiveByPath();
}

// Initial call
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initSidebar);
else initSidebar();

// App Config & Version Management
async function loadAppInfo() {
    try {
        const resp = await fetch("/api/config");
        const config = await resp.json();
        const versionStr = "v" + (config.app_version || "0.0.0");
        
        const versionEl = document.getElementById("app-version");
        if (versionEl) {
            versionEl.textContent = versionStr;
            versionEl.style.display = "inline-block";
        }
        const footerVer = document.querySelector(".footer-version");
        if (footerVer) {
            footerVer.textContent = versionStr;
        }
    } catch (e) {
        console.error("Could not load app info", e);
    }
}

loadAppInfo();
document.addEventListener("DOMContentLoaded", loadAppInfo);

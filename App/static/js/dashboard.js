// Navigation Interactivity
function initSidebar() {
    const userStr = localStorage.getItem('clarityUser');
    if (userStr) {
        try {
            const user = JSON.parse(userStr);
            if (user.role === 'admin') {
                const menu = document.querySelector('nav ul.menu');
                if (menu && !document.getElementById('adminMenuItem')) {
                    const adminLi = document.createElement('li');
                    adminLi.id = 'adminMenuItem';
                    adminLi.className = 'menu-item';
                    
                    if (window.location.pathname.includes('/admin')) {
                        adminLi.classList.add('active');
                        document.querySelectorAll('.menu-item').forEach(i => i.classList.remove('active'));
                    }

                    adminLi.innerHTML = `
                        <a href="/admin">
                            <span class="menu-icon"></span>
                            <span>Admin Panel</span>
                        </a>
                    `;
                    const items = menu.querySelectorAll('.menu-item');
                    if (items.length >= 3) {
                        menu.insertBefore(adminLi, items[3]);
                    } else {
                        menu.appendChild(adminLi);
                    }
                }
            }
            
            const nameEls = document.querySelectorAll('.header-profile-link .name-text');
            nameEls.forEach(el => { el.textContent = user.full_name || 'Profile'; });
            
        } catch(e) { console.error("Error parsing user info", e); }
    }

    // Re-attach listeners to all items
    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', function() {
            document.querySelectorAll('.menu-item').forEach(i => i.classList.remove('active'));
            this.classList.add('active');
        });
    });
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

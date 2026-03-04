const AUTH_KEY = 'clarityAuth';
const USER_KEY = 'clarityUser';
const REMEMBERED_KEY = 'clarityRemembered';

// IMMEDIATE AUTH GUARD
(async function() {
    const isAuth = localStorage.getItem(AUTH_KEY) === 'true';
    const path = window.location.pathname;
    
    console.log(`[Auth Guard] Path: ${path}, Authenticated: ${isAuth}`);

    // 1. SECURITY: Clear sensitive parameters from URL
    if (window.location.search.includes('password') || window.location.search.includes('email')) {
        const url = new URL(window.location);
        url.searchParams.delete('email');
        url.searchParams.delete('password');
        window.history.replaceState({}, document.title, url.pathname + url.search);
    }

    // 2. DEFINE ROUTES
    const publicRoutes = ['/login', '/signup', '/register-company', '/logout', '/404'];
    const isLoginPage = path === '/login' || path.endsWith('login.html');
    const isIndex = path === '/' || path.endsWith('index.html');
    const isPublic = publicRoutes.some(r => path === r || path.startsWith(r + '.html'));

    // 3. SESSION VALIDATION (Only for protected pages)
    if (isAuth && !isPublic && !isIndex) {
        const userStr = localStorage.getItem(USER_KEY);
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                const res = await fetch(`/api/config?user_id=${user.id}&company_id=${user.company_id}`);
                if (!res.ok) throw new Error("Stale session");
            } catch (e) {
                console.warn("[Auth Guard] Invalid session detected. Clearing...");
                localStorage.removeItem(AUTH_KEY);
                localStorage.removeItem(USER_KEY);
                localStorage.removeItem(REMEMBERED_KEY);
                window.location.href = '/login';
                return;
            }
        }
    }

    // 4. PROTECTION: Redirect unauthenticated users away from protected pages
    if (!isAuth && !isPublic && !isIndex) {
        console.log("[Auth Guard] Protected area. Redirecting to login.");
        window.location.href = '/login';
        return;
    }

    // 5. NO AUTO-LOGINS: We never redirect FROM login TO dashboard automatically.
    console.log("[Auth Guard] Done. User remains on current page.");

    // 6. VERSION LOADING (Added for consistency)
    loadAppInfo();
})();

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
        console.warn("[Auth] Could not load app version:", e);
    }
}

function isAuthenticated() {
  return localStorage.getItem(AUTH_KEY) === 'true';
}

function signOut() {
  localStorage.removeItem(AUTH_KEY);
  localStorage.removeItem(USER_KEY);
  window.location.href = '/login';
}

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const rememberedBox = document.getElementById('rememberedUserBox');
  const loginHeader = document.getElementById('loginHeader');

  console.log("[Auth UI] DOM Loaded. Checking remembered user...");

  // --- Shortcut Login (Login as...) ---
  if (rememberedBox) {
      const rememberedStr = localStorage.getItem(REMEMBERED_KEY);
      const isAuth = isAuthenticated();

      if (rememberedStr) {
          try {
              const remUser = JSON.parse(rememberedStr);
              document.getElementById('rememberedName').textContent = remUser.full_name || "User";
              document.getElementById('rememberedEmail').textContent = remUser.email || "";
              document.getElementById('userInitial').textContent = (remUser.full_name || "?").charAt(0);
              
              const btn = document.getElementById('btnLoginRemembered');
              const firstName = (remUser.full_name || "User").split(' ')[0];
              btn.textContent = isAuth ? `Continue as ${firstName}` : `Login as ${firstName}`;
              
              rememberedBox.style.display = 'block';
              if (loginForm) loginForm.style.display = 'none';
              if (loginHeader) loginHeader.style.display = 'none';

              btn.onclick = async () => {
                  if (isAuth) {
                      console.log("[Auth UI] Continuing with active session...");
                      window.location.href = '/dashboard';
                  } else {
                      console.log("[Auth UI] Logging in with remembered profile...");
                      try {
                          const res = await fetch(`/api/config?user_id=${remUser.id}&company_id=${remUser.company_id}`);
                          if (!res.ok) throw new Error("User no longer in DB");
                          
                          localStorage.setItem(AUTH_KEY, 'true');
                          localStorage.setItem(USER_KEY, JSON.stringify(remUser));
                          window.location.href = '/dashboard';
                      } catch (e) {
                          alert("Session expired. Please use the normal login.");
                          localStorage.removeItem(REMEMBERED_KEY);
                          location.reload();
                      }
                  }
              };

              document.getElementById('btnSwitchAccount').onclick = (e) => {
                  e.preventDefault();
                  rememberedBox.style.display = 'none';
                  if (loginForm) loginForm.style.display = 'block';
                  if (loginHeader) loginHeader.style.display = 'block';
              };
          } catch(e) { localStorage.removeItem(REMEMBERED_KEY); }
      }
  }

  // --- Normal Form Login ---
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = loginForm.email.value.trim();
      const password = loginForm.password.value.trim();
      const remember = document.getElementById('remember')?.checked;
      const errorEl = document.getElementById('loginError');

      if (!email || !password) {
        if (errorEl) errorEl.textContent = 'Bitte E-Mail und Passwort eingeben.';
        return;
      }

      try {
        const res = await fetch('/api/users/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const data = await res.json();

        if (data.error) {
          if (errorEl) errorEl.textContent = data.error;
          return;
        }

        localStorage.setItem(AUTH_KEY, 'true');
        localStorage.setItem(USER_KEY, JSON.stringify(data.user));
        
        if (remember) {
            localStorage.setItem(REMEMBERED_KEY, JSON.stringify(data.user));
        } else {
            localStorage.removeItem(REMEMBERED_KEY);
        }
        
        window.location.href = '/dashboard';
      } catch (err) {
        if (errorEl) errorEl.textContent = 'Server-Fehler beim Login.';
      }
    });
  }

  // Logout Buttons
  document.querySelectorAll('[data-logout]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      signOut();
    });
  });
});

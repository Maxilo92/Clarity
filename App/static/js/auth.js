const AUTH_KEY = 'clarityAuth';
const USER_KEY = 'clarityUser';
const REMEMBERED_KEY = 'clarityRemembered';

// IMMEDIATE AUTH GUARD
(async function() {
    const isAuth = localStorage.getItem(AUTH_KEY) === 'true';
    const path = window.location.pathname;
    
    // SECURITY: Clear sensitive parameters from URL if present
    if (window.location.search.includes('password') || window.location.search.includes('email')) {
        const url = new URL(window.location);
        url.searchParams.delete('email');
        url.searchParams.delete('password');
        window.history.replaceState({}, document.title, url.pathname + url.search);
    }

    const publicRoutes = ['/login', '/signup', '/register-company', '/logout', '/404'];
    const isPublic = publicRoutes.some(r => path === r || path.startsWith(r + '.html'));
    const isIndex = path === '/' || path.endsWith('index.html');

    // IF LOGGED IN: Validate session with server to catch DB resets
    if (isAuth && !isPublic && !isIndex) {
        const userStr = localStorage.getItem(USER_KEY);
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                const res = await fetch(`/api/config?user_id=${user.id}&company_id=${user.company_id}`);
                if (!res.ok) throw new Error("Session invalid");
            } catch (e) {
                console.warn("Session stale, logging out...");
                localStorage.removeItem(AUTH_KEY);
                localStorage.removeItem(USER_KEY);
                window.location.href = '/login';
                return;
            }
        }
    }

    // Redirect unauthenticated users to login ONLY for non-public protected pages
    if (!isAuth && !isPublic && !isIndex) {
        window.location.href = '/login';
        return;
    }

    // WE REMOVED THE AUTO-REDIRECT FROM LOGIN TO DASHBOARD TO PREVENT UNWANTED AUTO-LOGIN
})();

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

  // --- Remembered User Logic ---
  if (rememberedBox) {
      const rememberedStr = localStorage.getItem(REMEMBERED_KEY);
      if (rememberedStr) {
          try {
              const remUser = JSON.parse(rememberedStr);
              document.getElementById('rememberedName').textContent = remUser.full_name;
              document.getElementById('rememberedEmail').textContent = remUser.email;
              document.getElementById('btnName').textContent = remUser.full_name;
              document.getElementById('userInitial').textContent = (remUser.full_name || "?").charAt(0);
              
              rememberedBox.style.display = 'block';
              if (loginForm) loginForm.style.display = 'none';
              if (loginHeader) loginHeader.style.display = 'none';

              document.getElementById('btnLoginRemembered').onclick = () => {
                  localStorage.setItem(AUTH_KEY, 'true');
                  localStorage.setItem(USER_KEY, JSON.stringify(remUser));
                  window.location.href = '/dashboard';
              };

              document.getElementById('btnSwitchAccount').onclick = (e) => {
                  e.preventDefault();
                  rememberedBox.style.display = 'none';
                  if (loginForm) loginForm.style.display = 'block';
                  if (loginHeader) loginHeader.style.display = 'block';
              };
          } catch(e) { console.error("Error loading remembered user", e); }
      }
  }

  // --- Normal Login Logic ---
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
        
        // Save for "Remember Me" if checked
        if (remember) {
            localStorage.setItem(REMEMBERED_KEY, JSON.stringify(data.user));
        } else {
            localStorage.removeItem(REMEMBERED_KEY);
        }
        
        if (errorEl) errorEl.textContent = '';
        window.location.href = '/dashboard';
      } catch (err) {
        if (errorEl) errorEl.textContent = 'Server-Fehler beim Login.';
      }
    });
  }

  document.querySelectorAll('[data-logout]').forEach((el) => {
    el.addEventListener('click', () => {
      signOut();
    });
  });
});

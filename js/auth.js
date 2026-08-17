const Auth = (() => {
    const HASHED_PASSWORD = 'd852be9280efb11337f698095fe1910b9691f67a53091577679edb087824e4b8';
    const VALID_USERNAME = 'admin';
    const SESSION_KEY = 'salutmap_auth';

    function hashPassword(password) {
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        return crypto.subtle.digest('SHA-256', data).then(buffer => {
            return Array.from(new Uint8Array(buffer))
                .map(b => b.toString(16).padStart(2, '0'))
                .join('');
        });
    }

    function isAuthenticated() {
        return sessionStorage.getItem(SESSION_KEY) === 'true';
    }

    function login(username, password) {
        return hashPassword(password).then(hash => {
            if (username === VALID_USERNAME && hash === HASHED_PASSWORD) {
                sessionStorage.setItem(SESSION_KEY, 'true');
                return true;
            }
            return false;
        });
    }

    function logout() {
        sessionStorage.removeItem(SESSION_KEY);
        window.location.href = './login.html';
    }

    function requireAuth() {
        if (!isAuthenticated()) {
            window.location.href = './login.html';
            return false;
        }
        document.body.classList.remove('auth-pending');
        return true;
    }

    return { login, logout, isAuthenticated, requireAuth };
})();

if (document.getElementById('loginForm')) {
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        const errorMsg = document.getElementById('errorMsg');
        const btn = document.querySelector('.btn-login');

        errorMsg.classList.remove('visible');
        btn.disabled = true;
        btn.textContent = 'Entrant...';

        try {
            const success = await Auth.login(username, password);
            if (success) {
                window.location.href = './index.html';
            } else {
                errorMsg.textContent = 'Usuari o contrasenya incorrectes.';
                errorMsg.classList.add('visible');
                document.getElementById('password').value = '';
                document.getElementById('password').focus();
            }
        } catch {
            errorMsg.textContent = 'Error en verificar les credencials.';
            errorMsg.classList.add('visible');
        } finally {
            btn.disabled = false;
            btn.textContent = 'Entrar';
        }
    });
}

/**
 * Authentication handling
 */

// Ensure globalThis.API_BASE is available (fallback to production URL if not set)
// Check if globalThis.API_BASE is already set globally first
if (typeof globalThis.API_BASE === 'undefined') {
    globalThis.API_BASE = 'https://rotdust-calendar.asuka-shikinami.club';
}

// Check if user is authenticated
async function checkAuth() {
    try {
        const response = await fetch(`${globalThis.API_BASE}/api/auth/me`, {
            credentials: 'include'
        });
        
        if (response.ok) {
            const data = await response.json();
            return data.authenticated ? data.user : null;
        }
        return null;
    } catch (error) {
        console.error('Auth check error:', error);
        return null;
    }
}

// Logout
async function logout() {
    try {
        await fetch(`${globalThis.API_BASE}/api/auth/logout`, {
            method: 'POST',
            credentials: 'include'
        });
        globalThis.location.href = '/login.html';
    } catch (error) {
        console.error('Logout error:', error);
        globalThis.location.href = '/login.html';
    }
}

// Initialize auth on page load
document.addEventListener('DOMContentLoaded', async () => {
    // Check for error in URL (from OAuth callback)
    const urlParams = new URLSearchParams(globalThis.location.search);
    const error = urlParams.get('error');
    if (error && globalThis.location.pathname === '/login.html') {
        alert('Login error: ' + decodeURIComponent(error));
    }
    
    // If not on login page, check auth
    if (globalThis.location.pathname !== '/login.html') {
        const user = await checkAuth();
        if (!user) {
            globalThis.location.href = '/login.html';
            return;
        }
    }
    
    // Make logout function globally available
    globalThis.logout = logout;
});


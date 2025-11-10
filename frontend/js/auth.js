/**
 * Authentication handling
 */

// Ensure API_BASE is available (fallback to production URL if not set)
const API_BASE = window.API_BASE || 'https://rotdust-calendar.asuka-shikinami.club';

// Check if user is authenticated
async function checkAuth() {
    try {
        const response = await fetch(`${API_BASE}/api/auth/me`, {
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
        await fetch(`${API_BASE}/api/auth/logout`, {
            method: 'POST',
            credentials: 'include'
        });
        window.location.href = '/login.html';
    } catch (error) {
        console.error('Logout error:', error);
        window.location.href = '/login.html';
    }
}

// Initialize auth on page load
document.addEventListener('DOMContentLoaded', async () => {
    // Check for error in URL (from OAuth callback)
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');
    if (error && window.location.pathname === '/login.html') {
        alert('Login error: ' + decodeURIComponent(error));
    }
    
    // If not on login page, check auth
    if (window.location.pathname !== '/login.html') {
        const user = await checkAuth();
        if (!user) {
            window.location.href = '/login.html';
            return;
        }
    }
    
    // Setup logout button if it exists
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
});


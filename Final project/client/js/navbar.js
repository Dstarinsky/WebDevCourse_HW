// client/js/navbar.js

// --- 1. IMMEDIATE SECURITY CHECK ---
// Runs instantly to redirect guests away from protected pages.
(function() {
    // Define which pages require login
    const protectedPages = ['search.html', 'playlists.html'];
    
    // Get current filename (e.g., "search.html")
    const currentPage = window.location.pathname.split("/").pop();
    
    // Check if user is logged in
    const currentUser = sessionStorage.getItem('currentUser');

    // If on a protected page AND not logged in -> KICK OUT
    if (protectedPages.includes(currentPage) && !currentUser) {
        // use replace() so they can't click "Back" to return here
        window.location.replace('login.html'); 
    }
})();

// --- 2. Navbar Rendering (Waits for DOM) ---
document.addEventListener("DOMContentLoaded", () => {
    const navbarContainer = document.getElementById("main-navbar");
    if (navbarContainer) {
        // Check login status again for UI rendering
        const currentUser = sessionStorage.getItem('currentUser');
        const isLoggedIn = !!currentUser;

        // Conditional Links: Only show Search/Playlists if logged in
        const linksHtml = `
            <li class="nav-item">
                <a class="nav-link" href="index.html">Home</a>
            </li>
            ${isLoggedIn ? `
            <li class="nav-item">
                <a class="nav-link" href="search.html">Search</a>
            </li>
            <li class="nav-item">
                <a class="nav-link" href="playlists.html">My Playlists</a>
            </li>
            ` : ''}
        `;

        // Inject Full Navbar
        navbarContainer.innerHTML = `
        <nav class="navbar navbar-expand-lg shadow-sm">
            <div class="container">
                <a class="navbar-brand fw-bold" href="index.html">
                    <i class="bi bi-music-note-beamed"></i> MyMusicApp
                </a>
                <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                    <span class="navbar-toggler-icon"></span>
                </button>
                <div class="collapse navbar-collapse" id="navbarNav">
                    <ul class="navbar-nav ms-auto align-items-center">
                        ${linksHtml}
                        <li class="nav-item ms-lg-2 my-2 my-lg-0">
                            <button id="theme-toggle" class="btn btn-outline-light btn-sm rounded-circle p-2">
                                <i id="theme-icon" class="bi bi-moon-fill"></i>
                            </button>
                        </li>
                        <li class="nav-item ms-lg-3" id="auth-section"></li>
                    </ul>
                </div>
            </div>
        </nav>
        `;

        initTheme();
        renderAuthSection(); // Updated function name for clarity
        highlightActiveLink();
    }
});

// --- Helper Functions ---

function initTheme() {
    const themeToggleBtn = document.getElementById('theme-toggle');
    const themeIcon = document.getElementById('theme-icon');
    const htmlElement = document.documentElement;
    let currentTheme = localStorage.getItem('theme') || 'light';
    
    const applyTheme = (theme) => {
        htmlElement.setAttribute('data-bs-theme', theme);
        if (themeIcon) themeIcon.className = theme === 'dark' ? 'bi bi-sun-fill' : 'bi bi-moon-fill';
    };
    applyTheme(currentTheme);

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            currentTheme = currentTheme === 'light' ? 'dark' : 'light';
            applyTheme(currentTheme);
            localStorage.setItem('theme', currentTheme);
        });
    }
}

function renderAuthSection() {
    const authSection = document.getElementById('auth-section');
    const currentUserJSON = sessionStorage.getItem('currentUser');

    if (currentUserJSON) {
        const user = JSON.parse(currentUserJSON);
        authSection.innerHTML = `
            <div class="d-flex align-items-center gap-2">
                <img src="${user.imgUrl}" class="rounded-circle border border-2 border-light" style="width: 35px; height: 35px; object-fit: cover;">
                <span class="text-white fw-bold d-none d-lg-block">${user.firstName}</span>
                <button onclick="logout()" class="btn btn-sm btn-outline-light ms-2">Logout</button>
            </div>
        `;
    } else {
        authSection.innerHTML = `
            <div class="d-flex gap-2">
                <a class="btn btn-custom btn-sm px-3" href="login.html">Login</a>
                <a class="btn btn-outline-custom btn-sm px-3" href="register.html">Register</a>
            </div>
        `;
    }
}

window.logout = function() {
    if(confirm("Are you sure you want to logout?")) {
        sessionStorage.removeItem('currentUser');
        window.location.href = 'login.html';
    }
};

function highlightActiveLink() {
    const currentPage = window.location.pathname.split("/").pop();
    document.querySelectorAll('.nav-link').forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPage || (currentPage === '' && href === 'index.html')) {
            link.classList.add('active', 'fw-bold');
            link.style.borderBottom = "2px solid var(--text-primary)";
        }
    });
}
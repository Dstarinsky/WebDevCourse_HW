// client/js/navbar.js

// --- 1. IMMEDIATE SECURITY & REDIRECT CHECK ---
(function() {
    const currentPage = window.location.pathname.split("/").pop();
    const currentUser = sessionStorage.getItem('currentUser');
    
    // A. Protected Pages: Guest -> Login
    const protectedPages = ['search.html', 'playlists.html'];
    if (protectedPages.includes(currentPage) && !currentUser) {
        window.location.replace('login.html'); 
    }

    // B. Guest Pages: Logged In User -> Home
    const guestPages = ['login.html', 'register.html'];
    if (guestPages.includes(currentPage) && currentUser) {
        window.location.replace('index.html');
    }
})();

// --- 2. Navbar Rendering (Waits for DOM) ---
document.addEventListener("DOMContentLoaded", () => {
    const navbarContainer = document.getElementById("main-navbar");
    if (navbarContainer) {
        const currentUser = sessionStorage.getItem('currentUser');
        const isLoggedIn = !!currentUser;

        // Conditional Links
        // ADDED 'text-nowrap' to the classes below
        const linksHtml = `
            <li class="nav-item">
                <a class="nav-link text-nowrap" href="index.html">Home</a>
            </li>
            ${isLoggedIn ? `
            <li class="nav-item">
                <a class="nav-link text-nowrap" href="search.html">Search</a>
            </li>
            <li class="nav-item">
                <a class="nav-link text-nowrap" href="playlists.html">My Playlists</a>
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
                    <ul class="navbar-nav ms-auto align-items-lg-center">
                        ${linksHtml}
                        <li class="nav-item ms-lg-3 w-100 w-lg-auto" id="auth-section"></li>
                    </ul>
                </div>
            </div>
        </nav>
        `;

        initTheme();
        renderAuthSection();
        highlightActiveLink();
        updateHomeCTA();
    }
});

// --- Helper Functions ---

function initTheme() {
    document.documentElement.setAttribute('data-bs-theme', 'dark');
}

function renderAuthSection() {
    const authSection = document.getElementById('auth-section');
    const currentUserJSON = sessionStorage.getItem('currentUser');

    if (currentUserJSON) {
        const user = JSON.parse(currentUserJSON);
        
        // --- LAYOUT ---
        // 1. Profile Picture: REMOVED completely.
        // 2. Name: d-none d-lg-block (Hidden on mobile, Visible on Desktop).
        // 3. Logout Button: w-100 (Full width on mobile), w-lg-auto (Normal on Desktop).
        authSection.innerHTML = `
            <div class="d-lg-flex align-items-center gap-3 text-center">
                
                <span class="text-white fw-bold d-none d-lg-block">${user.firstName}</span>
                
                <button onclick="logout()" 
                        class="btn btn-sm fw-bold shadow-sm w-100 w-lg-auto mt-3 mt-lg-0" 
                        style="background-color: var(--color-bright); color: var(--color-deepest); border: none;">
                    Logout
                </button>
            </div>
        `;
    } else {
        authSection.innerHTML = `
            <div class="d-flex gap-2 mt-3 mt-lg-0 justify-content-center">
                <a class="btn btn-custom btn-sm px-3" href="login.html">Login</a>
                <a class="btn btn-outline-custom btn-sm px-3" href="register.html">Register</a>
            </div>
        `;
    }
}

function updateHomeCTA() {
    const ctaContainer = document.getElementById('home-cta-container');
    const currentUser = sessionStorage.getItem('currentUser');

    if (ctaContainer && currentUser) {
        ctaContainer.innerHTML = `
            <p class="mb-3 fw-bold">Ready to listen?</p>
            <a href="search.html" class="btn btn-custom btn-lg px-5 shadow">
                <i class="bi bi-search me-2"></i> Start Searching
            </a>
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
            link.style.borderBottom = "2px solid var(--text-highlight)";
        }
    });
}
// client/js/login.js

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const errorAlert = document.getElementById('loginError');

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        errorAlert.classList.add('d-none');

        const username = document.getElementById('loginUsername').value.trim();
        const password = document.getElementById('loginPassword').value;

        if (!username || !password) return;

        // REMOVED: const hashedPassword = await hashPassword(password);

        try {
            const response = await fetch(`${CONFIG.SERVER_URL}/api/login`, { // Use CONFIG.SERVER_URL
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                // SEND RAW PASSWORD
                body: JSON.stringify({ username, password: password }) 
            });

            const data = await response.json();

            if (response.ok) {
                sessionStorage.setItem('currentUser', JSON.stringify(data.user));
                window.location.href = 'search.html';
            } else {
                errorAlert.textContent = data.error || "Invalid credentials";
                errorAlert.classList.remove('d-none');
            }
        } catch (error) {
            console.error("Error:", error);
            errorAlert.textContent = "Cannot connect to server.";
            errorAlert.classList.remove('d-none');
        }
    });
});
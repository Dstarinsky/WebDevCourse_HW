async function hashPassword(plainText) {
    const encoder = new TextEncoder();
    const data = encoder.encode(plainText);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const errorAlert = document.getElementById('loginError');

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        errorAlert.classList.add('d-none');

        const username = document.getElementById('loginUsername').value.trim();
        const password = document.getElementById('loginPassword').value;

        if (!username || !password) return;

        const hashedPassword = await hashPassword(password);

        try {
            const response = await fetch(`/api/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password: hashedPassword })
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
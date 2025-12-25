async function hashPassword(plainText) {
    const encoder = new TextEncoder();
    const data = encoder.encode(plainText);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('registerForm');
    const imgInput = document.getElementById('imgUrl');
    const imgPreview = document.getElementById('imagePreview');

    imgInput.addEventListener('input', () => {
        imgPreview.src = imgInput.value.trim() || "https://cdn-icons-png.flaticon.com/512/847/847969.png";
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const firstName = document.getElementById('firstName').value.trim();
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const imgUrl = document.getElementById('imgUrl').value.trim() || "https://cdn-icons-png.flaticon.com/512/847/847969.png";

        if (!firstName || !username || !password || !confirmPassword) return alert("All fields are required.");
        
        // Password Complexity Regex
        const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{6,}$/;
        if (!passwordRegex.test(password)) {
            return alert("Password must be 6+ chars with 1 letter, 1 number, and 1 special char.");
        }

        if (password !== confirmPassword) return alert("Passwords do not match.");

        const hashedPassword = await hashPassword(password);

        try {
            const response = await fetch(`/api/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password: hashedPassword, firstName, imgUrl })
            });

            if (response.ok) {
                alert("Registration successful! Please log in.");
                window.location.href = 'login.html';
            } else {
                const data = await response.json();
                alert(data.error || "Registration failed.");
            }
        } catch (error) {
            console.error("Error:", error);
            alert("Server connection failed.");
        }
    });
});
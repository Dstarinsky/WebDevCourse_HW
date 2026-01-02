// client/js/register.js

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
        
        const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{6,}$/;
        if (!passwordRegex.test(password)) {
            return alert("Password must be 6+ chars with 1 letter, 1 number, and 1 special char.");
        }

        if (password !== confirmPassword) return alert("Passwords do not match.");


        try {
            const response = await fetch(`${CONFIG.SERVER_URL}/api/register`, { 
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                // SEND RAW PASSWORD
                body: JSON.stringify({ username, password: password, firstName, imgUrl }) 
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
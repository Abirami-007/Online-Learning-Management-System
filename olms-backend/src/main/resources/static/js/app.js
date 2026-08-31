document.addEventListener('DOMContentLoaded', () => {
    // UI Elements
    const loginTabBtn = document.getElementById('loginTabBtn');
    const registerTabBtn = document.getElementById('registerTabBtn');
    const loginFormSection = document.getElementById('loginFormSection');
    const registerFormSection = document.getElementById('registerFormSection');
    const loggedInView = document.getElementById('loggedInView');
    const mainCardHeader = document.getElementById('mainCardHeader');
    const tabGroup = document.getElementById('tabGroup');

    const alertBox = document.getElementById('alertBox');
    const alertMessage = document.getElementById('alertMessage');

    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');

    const loginSubmitBtn = document.getElementById('loginSubmitBtn');
    const registerSubmitBtn = document.getElementById('registerSubmitBtn');
    const loginSpinner = document.getElementById('loginSpinner');
    const registerSpinner = document.getElementById('registerSpinner');

    const loggedInUserEmail = document.getElementById('loggedInUserEmail');
    const tokenDisplay = document.getElementById('tokenDisplay');
    const logoutBtn = document.getElementById('logoutBtn');

    // Check if token already exists in localStorage
    const savedToken = localStorage.getItem('olms_jwt_token');
    const savedEmail = localStorage.getItem('olms_user_email');
    if (savedToken) {
        showLoggedInState(savedEmail || 'User', savedToken);
    }

    // Tab Switching Logic
    loginTabBtn?.addEventListener('click', () => {
        switchTab('login');
    });

    registerTabBtn?.addEventListener('click', () => {
        switchTab('register');
    });

    function switchTab(tab) {
        hideAlert();
        if (tab === 'login') {
            loginTabBtn.classList.add('active');
            registerTabBtn.classList.remove('active');
            loginFormSection.classList.add('active');
            registerFormSection.classList.remove('active');
        } else {
            registerTabBtn.classList.add('active');
            loginTabBtn.classList.remove('active');
            registerFormSection.classList.add('active');
            loginFormSection.classList.remove('active');
        }
    }

    // Password Visibility Toggle
    document.querySelectorAll('.toggle-password').forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-target');
            const input = document.getElementById(targetId);
            if (input) {
                const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
                input.setAttribute('type', type);
            }
        });
    });

    // Alert Helper Functions
    function showAlert(message, type = 'error') {
        alertMessage.textContent = message;
        alertBox.className = `alert alert-${type}`;
        alertBox.style.display = 'flex';
    }

    function hideAlert() {
        alertBox.style.display = 'none';
    }

    // Login Form Submit Handler
    loginForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideAlert();

        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;

        if (!email || !password) {
            showAlert('Please fill in both email and password.', 'error');
            return;
        }

        // Show Spinner
        setLoading(loginSubmitBtn, loginSpinner, true, 'Signing In...');

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            if (response.ok) {
                const token = await response.text();
                // Save session token
                localStorage.setItem('olms_jwt_token', token);
                localStorage.setItem('olms_user_email', email);

                showAlert('Login successful! Redirecting...', 'success');

                setTimeout(() => {
                    showLoggedInState(email, token);
                }, 800);
            } else {
                const errText = await response.text();
                showAlert(errText || 'Invalid email or password', 'error');
            }
        } catch (err) {
            console.error('Login request failed:', err);
            showAlert('Unable to connect to backend server. Please check your network.', 'error');
        } finally {
            setLoading(loginSubmitBtn, loginSpinner, false, 'Sign In');
        }
    });

    // Register Form Submit Handler
    registerForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideAlert();

        const fullName = document.getElementById('regFullName').value.trim();
        const email = document.getElementById('regEmail').value.trim();
        const password = document.getElementById('regPassword').value;
        const role = document.getElementById('regRole').value;

        if (!fullName || !email || !password) {
            showAlert('Please complete all required fields.', 'error');
            return;
        }

        setLoading(registerSubmitBtn, registerSpinner, true, 'Creating Account...');

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ fullName, email, password, role })
            });

            if (response.ok) {
                const user = await response.json();
                showAlert(`Account created successfully for ${user.email}! You can now sign in.`, 'success');
                registerForm.reset();
                setTimeout(() => {
                    switchTab('login');
                    document.getElementById('loginEmail').value = email;
                }, 1200);
            } else {
                const errText = await response.text();
                showAlert(errText || 'Registration failed. Email may already be registered.', 'error');
            }
        } catch (err) {
            console.error('Registration request failed:', err);
            showAlert('Unable to connect to backend server. Please check connection.', 'error');
        } finally {
            setLoading(registerSubmitBtn, registerSpinner, false, 'Create Account');
        }
    });

    // Button Spinner Toggle Helper
    function setLoading(btn, spinner, isLoading, originalText) {
        const textSpan = btn.querySelector('.btn-text');
        if (isLoading) {
            btn.disabled = true;
            spinner.style.display = 'inline-block';
            if (textSpan) textSpan.textContent = originalText;
        } else {
            btn.disabled = false;
            spinner.style.display = 'none';
            if (textSpan) textSpan.textContent = originalText;
        }
    }

    // Display Logged In View
    function showLoggedInState(email, token) {
        loginFormSection.classList.remove('active');
        registerFormSection.classList.remove('active');
        tabGroup.style.display = 'none';
        mainCardHeader.style.display = 'none';
        hideAlert();

        loggedInUserEmail.textContent = email;
        tokenDisplay.textContent = token;
        loggedInView.style.display = 'block';
    }

    // Logout Handler
    logoutBtn?.addEventListener('click', () => {
        localStorage.removeItem('olms_jwt_token');
        localStorage.removeItem('olms_user_email');

        loggedInView.style.display = 'none';
        tabGroup.style.display = 'flex';
        mainCardHeader.style.display = 'block';
        switchTab('login');
        showAlert('You have been logged out.', 'success');
    });
});

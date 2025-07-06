// Authentication functionality
let currentUser = null;

// Check if user is logged in
function checkAuth() {
    const token = localStorage.getItem('authToken');
    const user = localStorage.getItem('currentUser');
    
    if (token && user) {
        currentUser = JSON.parse(user);
        updateAuthUI();
        return true;
    }
    return false;
}

// Update UI based on authentication status
function updateAuthUI() {
    const authButtons = document.getElementById('auth-buttons');
    const userMenu = document.getElementById('user-menu');
    
    if (currentUser) {
        if (authButtons) authButtons.style.display = 'none';
        if (userMenu) userMenu.style.display = 'block';
        
        // Update user avatar and name if elements exist
        const userAvatar = document.querySelector('#user-avatar img');
        if (userAvatar) {
            userAvatar.src = 'https://images.pexels.com/photos/771742/pexels-photo-771742.jpeg?auto=compress&cs=tinysrgb&w=40&h=40&fit=crop';
        }
        
        const userName = document.querySelector('#profile-name');
        if (userName && currentUser.name) {
            userName.textContent = currentUser.name;
        }
    } else {
        if (authButtons) authButtons.style.display = 'flex';
        if (userMenu) userMenu.style.display = 'none';
    }
}

// Login function
async function login(email, password) {
    try {
        const response = await authAPI.login(email, password);
        
        currentUser = response.user;
        localStorage.setItem('currentUser', JSON.stringify(response.user));
        updateAuthUI();
        
        // Redirect to dashboard
        window.location.href = 'dashboard.html';
    } catch (error) {
        alert('Login failed: ' + error.message);
    }
}

// Logout function
function logout() {
    authAPI.logout();
}

// Register function
async function register(userData) {
    try {
        const response = await authAPI.register(userData);
        
        currentUser = response.user;
        localStorage.setItem('currentUser', JSON.stringify(response.user));
        updateAuthUI();
        
        // Redirect to dashboard
        window.location.href = 'dashboard.html';
    } catch (error) {
        alert('Registration failed: ' + error.message);
    }
}

// Toggle password visibility
function togglePassword(fieldId) {
    const field = document.getElementById(fieldId);
    const button = field.nextElementSibling;
    const icon = button.querySelector('i');
    
    if (field.type === 'password') {
        field.type = 'text';
        icon.className = 'fas fa-eye-slash';
    } else {
        field.type = 'password';
        icon.className = 'fas fa-eye';
    }
}

// Handle login form submission
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication status on page load
    checkAuth();
    
    // Handle login form
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            login(email, password);
        });
    }
    
    // Handle register form
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const formData = new FormData(registerForm);
            const userData = Object.fromEntries(formData);
            register(userData);
        });
    }
    
    // Handle user avatar dropdown
    const userAvatar = document.getElementById('user-avatar');
    const dropdownMenu = document.getElementById('dropdown-menu');
    
    if (userAvatar && dropdownMenu) {
        userAvatar.addEventListener('click', function() {
            dropdownMenu.style.display = dropdownMenu.style.display === 'block' ? 'none' : 'block';
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', function(e) {
            if (!userAvatar.contains(e.target)) {
                dropdownMenu.style.display = 'none';
            }
        });
    }
});
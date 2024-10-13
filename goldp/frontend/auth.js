const API_URL = 'http://127.0.0.1:8000';

// Login Function
function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    fetch(`${API_URL}/token`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`
    })
    .then(response => {
        if (response.status === 401) {
            throw new Error('Invalid username or password');
        }
        return response.json();
    })
    .then(data => {
        if (data.access_token) {
            // // Store the token and user ID in local storage
            localStorage.setItem('token', data.access_token);
            localStorage.setItem('user_id', data.user_id); // Store user ID in local storage
            showConverterApp();
        } else {
            alert('Login failed');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert(error.message);
    });
}

// Register Function
function register() {
    const username = document.getElementById('regUsername').value;
    const password = document.getElementById('regPassword').value;

    fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
    })
    .then(response => response.json())
    .then(data => {
        if (data.message === "User created successfully") {
            alert('Registration successful. Please login.');
            showLogin();
        } else {
            alert('Registration failed');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('An error occurred during registration');
    });
}

// Show Login Form
function showLogin() {
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('registerForm').style.display = 'none';
    document.getElementById('converterApp').style.display = 'none';
}

// Show Register Form
function showRegister() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'block';
    document.getElementById('converterApp').style.display = 'none';
}

// Show Converter App
function showConverterApp() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'none';
    document.getElementById('converterApp').style.display = 'block';
    fetchGoldPrice(); // Fetch the gold price when showing the converter app
}

// Logout Function
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user_id'); // Clear the user ID from local storage
    showLogin();
}

// Listen for Enter Key on Login and Register Forms
document.getElementById('username').addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        login(); // Trigger login on Enter key
    }
});

document.getElementById('password').addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        login(); // Trigger login on Enter key
    }
});

document.getElementById('regUsername').addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        register(); // Trigger registration on Enter key
    }
});

document.getElementById('regPassword').addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        register(); // Trigger registration on Enter key
    }
});

// Check if user is logged in on page load
window.onload = function() {
    const token = localStorage.getItem('token');
    if (token) {
        showConverterApp(); // Show the converter app if logged in
    } else {
        showLogin(); // Show login form if not logged in
    }
};

const API_BASE = '/api';

// --- Utility Functions ---

function getToken() {
  return localStorage.getItem('token');
}

function getRole() {
  return localStorage.getItem('role');
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('role');
  localStorage.removeItem('user_name');
  window.location.href = '/index.html';
}

function showToast(message) {
  const toast = document.getElementById('toast') || createToastElement();
  toast.innerText = message;
  toast.className = 'show';
  setTimeout(() => { toast.className = toast.className.replace('show', ''); }, 3000);
}

function createToastElement() {
  const div = document.createElement('div');
  div.id = 'toast';
  document.body.appendChild(div);
  return div;
}

async function apiCall(endpoint, method = 'GET', body = null) {
  const headers = {
    'Content-Type': 'application/json'
  };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);

  const res = await fetch(`${API_BASE}${endpoint}`, options);
  const data = await res.json();
  
  if (!res.ok) {
    throw new Error(data.error || 'API Error');
  }
  return data;
}

// --- Check Auth ---
function checkAuth(allowedRoles) {
  const token = getToken();
  const role = getRole();
  if (!token) {
    window.location.href = '/index.html';
    return;
  }
  if (allowedRoles && !allowedRoles.includes(role)) {
    alert('Unauthorized');
    window.location.href = '/index.html';
  }
  
  const userName = localStorage.getItem('user_name');
  const userGreeting = document.getElementById('user-greeting');
  if (userGreeting && userName) {
    userGreeting.innerText = `Hello, ${userName}!`;
  }
}

// Ensure auth functions are available globally
window.logout = logout;
window.checkAuth = checkAuth;
window.apiCall = apiCall;
window.showToast = showToast;

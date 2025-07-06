// API helper functions
const API_BASE = window.location.origin;

// Get auth token
function getAuthToken() {
    return localStorage.getItem('authToken');
}

// Set auth token
function setAuthToken(token) {
    localStorage.setItem('authToken', token);
}

// Remove auth token
function removeAuthToken() {
    localStorage.removeItem('authToken');
}

// Make authenticated API request
async function apiRequest(endpoint, options = {}) {
    const token = getAuthToken();
    
    const config = {
        headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
            ...options.headers
        },
        ...options
    };
    
    try {
        const response = await fetch(`${API_BASE}${endpoint}`, config);
        
        if (response.status === 401) {
            // Token expired or invalid
            removeAuthToken();
            window.location.href = 'login.html';
            return;
        }
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'API request failed');
        }
        
        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// Auth API calls
const authAPI = {
    async login(email, password) {
        const response = await apiRequest('/api/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
        
        if (response.token) {
            setAuthToken(response.token);
        }
        
        return response;
    },
    
    async register(userData) {
        const response = await apiRequest('/api/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
        
        if (response.token) {
            setAuthToken(response.token);
        }
        
        return response;
    },
    
    logout() {
        removeAuthToken();
        localStorage.removeItem('currentUser');
        window.location.href = 'index.html';
    }
};

// Exam API calls
const examAPI = {
    async getQuestions(examType) {
        return await apiRequest(`/api/questions/${examType}`);
    },
    
    async submitExam(examType, answers, timeSpent) {
        return await apiRequest('/api/submit-exam', {
            method: 'POST',
            body: JSON.stringify({ examType, answers, timeSpent })
        });
    }
};

// User API calls
const userAPI = {
    async getProfile() {
        return await apiRequest('/api/profile');
    },
    
    async getLeaderboard(filter = 'overall', page = 1, limit = 20) {
        return await apiRequest(`/api/leaderboard?filter=${filter}&page=${page}&limit=${limit}`);
    }
};

// Admin API calls
const adminAPI = {
    async addQuestions(examType, date, questions) {
        return await apiRequest('/api/admin/questions', {
            method: 'POST',
            body: JSON.stringify({ examType, date, questions })
        });
    },
    
    async getUsers() {
        return await apiRequest('/api/admin/users');
    },
    
    async getAnalytics() {
        return await apiRequest('/api/admin/analytics');
    }
};
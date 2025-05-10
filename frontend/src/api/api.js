const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const isTokenExpired = (token) => {
  if (!token) return true;
  
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return true;
    
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    
    const { exp } = JSON.parse(jsonPayload);
    return exp * 1000 < Date.now();
  } catch (e) {
    console.error('Error checking token expiration', e);
    return true;
  }
};

const handleResponse = async (response) => {
  if (!response.ok) {
    if (response.status === 422) {
      const token = getToken();
      if (token && isTokenExpired(token)) {
        try {
          await authAPI.refreshToken();
        } catch (refreshError) {
          authAPI.logout();
          throw new Error('Session expired. Please log in again.');
        }
      }
    }
    
    const error = await response.json();
    throw new Error(error.error || `API error: ${response.status}`);
  }
  return response.json();
};

const getToken = () => localStorage.getItem('token');
const setToken = (token) => localStorage.setItem('token', token);
const removeToken = () => localStorage.removeItem('token');

const getHeaders = () => {
  const headers = {
    'Content-Type': 'application/json',
  };
  
  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

export const authAPI = {
  register: async (userData) => {
    const response = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    
    const data = await handleResponse(response);
    setToken(data.access_token);
    return data;
  },
  
  login: async (credentials) => {
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });
    
    const data = await handleResponse(response);
    setToken(data.access_token);
    return data;
  },
  
  logout: () => {
    removeToken();
  },
  
  getCurrentUser: async () => {
    const response = await fetch(`${API_URL}/user`, {
      headers: getHeaders(),
    });
    
    return handleResponse(response);
  },
  
  refreshToken: async () => {
    const response = await fetch(`${API_URL}/refresh`, {
      method: 'POST',
      headers: getHeaders(),
    });
    
    const data = await handleResponse(response);
    setToken(data.access_token);
    return data;
  },
  
  isAuthenticated: () => {
    const token = getToken();
    if (!token) return false;
    
    try {
      const parts = token.split('.');
      return parts.length === 3 && !isTokenExpired(token);
    } catch (e) {
      console.error('Invalid token format', e);
      return false;
    }
  },
};

export const gameStatsAPI = {
  saveGameStats: async (gameData) => {
    const response = await fetch(`${API_URL}/game-stats`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(gameData),
    });
    
    return handleResponse(response);
  },
  
  getUserGameStats: async () => {
    const response = await fetch(`${API_URL}/user/game-stats`, {
      headers: getHeaders(),
    });
    
    return handleResponse(response);
  },
  
  getStatsSummary: async () => {
    const response = await fetch(`${API_URL}/user/game-stats/summary`, {
      headers: getHeaders(),
    });
    
    return handleResponse(response);
  },
};

const api = {
  auth: authAPI,
  gameStats: gameStatsAPI,
};

export default api;
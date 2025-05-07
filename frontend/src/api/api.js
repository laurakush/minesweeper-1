const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

// Helper to handle response and errors
const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Something went wrong');
  }
  return response.json();
};

// Auth token management
const getToken = () => localStorage.getItem('token');
const setToken = (token) => localStorage.setItem('token', token);
const removeToken = () => localStorage.removeItem('token');

// Headers with auth token
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

// Auth API
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
  
  isAuthenticated: () => {
    return !!getToken();
  },
};

// Game stats API
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

export default {
  auth: authAPI,
  gameStats: gameStatsAPI,
};
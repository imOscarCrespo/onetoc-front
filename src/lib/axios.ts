import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

const LOCAL = 'http://127.0.0.1:8000/'

const BASE_URL = LOCAL;

export const api = axios.create({
  baseURL: BASE_URL,
});

api.interceptors.request.use(async (config) => {
  const accessToken = localStorage.getItem('accessToken');
  const refreshToken = localStorage.getItem('refreshToken');

  if (!accessToken || !refreshToken) {
    return config;
  }

  try {
    const decodedToken = jwtDecode<{ exp: number }>(accessToken);
    const isExpired = decodedToken.exp * 1000 < Date.now();

    if (isExpired) {
      const response = await axios.post(`${BASE_URL}/api/token/refresh/`, {
        refresh: refreshToken,
      });
      
      localStorage.setItem('accessToken', response.data.access);
      config.headers.Authorization = `Bearer ${response.data.access}`;
    } else {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
  } catch (error) {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    window.location.href = '/login';
  }

  return config;
});
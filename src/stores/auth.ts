import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { jwtDecode } from 'jwt-decode';
import api from '@/services/api';

export const useAuthStore = defineStore('auth', () => {
  const accessToken = ref<string | null>(localStorage.getItem('accessToken'));
  const refreshToken = ref<string | null>(localStorage.getItem('refreshToken'));

  const isAuthenticated = computed(() => {
    if (!accessToken.value) return false;
    
    try {
      const decodedToken = jwtDecode<{ exp: number }>(accessToken.value);
      return decodedToken.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  });

  async function login(username: string, password: string) {
    try {
      const response = await api.post('/api/token/', { username, password });
      setTokens(response.data.access, response.data.refresh);
      return true;
    } catch (error) {
      return false;
    }
  }

  function logout() {
    clearTokens();
  }

  function setTokens(access: string, refresh: string) {
    accessToken.value = access;
    refreshToken.value = refresh;
    localStorage.setItem('accessToken', access);
    localStorage.setItem('refreshToken', refresh);
  }

  function clearTokens() {
    accessToken.value = null;
    refreshToken.value = null;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }

  return {
    accessToken,
    refreshToken,
    isAuthenticated,
    login,
    logout,
    setTokens,
    clearTokens
  };
});
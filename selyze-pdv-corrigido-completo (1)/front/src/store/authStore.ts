import { create } from 'zustand';
import { User, AuthResponse, LoginCredentials } from '@/types';
import api from '@/lib/api';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<void>;
  recoverPassword: (username: string, securityAnswer: string, newPassword: string) => Promise<void>;
  checkFirstLogin: () => Promise<boolean>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
  isLoading: false,

  login: async (credentials) => {
    set({ isLoading: true });
    try {
      const response = await api.post<AuthResponse>('/auth/login', credentials);
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      set({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
      });

      // ✅ RETORNAR dados para verificar first_login no componente
      return response.data;
    } catch (error: any) {
      set({ isLoading: false });
      throw new Error(error.response?.data?.message || 'Erro ao fazer login');
    }
  },

  logout: async () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({
      user: null,
      token: null,
      isAuthenticated: false,
    });
  },

  // ✅ CORREÇÃO: Estrutura correta do payload
  changePassword: async (oldPassword, newPassword) => {
    try {
      await api.post('/auth/change-password', {
        old_password: oldPassword,  // ✅ Nome correto da propriedade
        new_password: newPassword,
      });
      
      // Atualizar first_login do usuário
      const user = get().user;
      if (user) {
        const updatedUser = { ...user, first_login: 0 };
        set({ user: updatedUser });
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Erro ao trocar senha');
    }
  },

  // ✅ CORREÇÃO: Endpoint não existe no backend - usar verify-security-answer
  recoverPassword: async (username, securityAnswer, newPassword) => {
    try {
      // Primeiro verificar a resposta
      await api.post('/auth/verify-security-answer', {
        username,
        answer: securityAnswer,
      });

      // Depois trocar a senha (este endpoint precisa ser criado no backend)
      await api.post('/auth/reset-password', {
        username,
        security_answer: securityAnswer,
        new_password: newPassword,
      });
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Erro ao recuperar senha');
    }
  },

  checkFirstLogin: async () => {
    try {
      const response = await api.get('/auth/verify-first-login');
      return response.data.first_login === 1; // ✅ Campo correto
    } catch (error) {
      return false;
    }
  },
}));
import { create } from 'zustand';
import { persist } from 'zustand/middleware'; // ✅ IMPORTADO para persistência
import { CashSession, CashSummary } from '@/types';
import api from '@/lib/api';

interface CashState {
  openCash: CashSession | null;
  currentSession: CashSession | null; // Alias para compatibilidade
  isLoading: boolean;
  fetchOpenCash: () => Promise<void>;
  openNewCash: (openingBalance: number) => Promise<void>;
  closeCash: (cashSessionId: number, closingBalance: number) => Promise<CashSummary>;
  getCashSummary: (cashSessionId: number) => Promise<CashSummary>;
}

export const useCashStore = create<CashState>()(
  persist( // ✅ ADICIONADO: Middleware de persistência
    (set, get) => ({
      openCash: null,
      get currentSession() {
        return get().openCash; // currentSession sempre retorna openCash
      },
      isLoading: false,

      fetchOpenCash: async () => {
        set({ isLoading: true });
        try {
          const response = await api.get<CashSession>('/cash/open');
          set({ openCash: response.data, isLoading: false });
          console.log('cashStore: Caixa aberto carregado:', response.data); // ✅ DEBUG: Confirma carregamento
        } catch (error: any) {
          if (error.response?.status !== 404) {
            console.error('cashStore: Erro ao buscar caixa aberto:', error);
          }
          set({ openCash: null, isLoading: false });
        }
      },

      openNewCash: async (openingBalance) => {
        set({ isLoading: true });
        try {
          const response = await api.post<CashSession>('/cash/open', {
            opening_balance: openingBalance,
          });
          set({ openCash: response.data, isLoading: false });
          console.log('cashStore: Novo caixa aberto:', response.data); // ✅ DEBUG: Confirma abertura
        } catch (error: any) {
          set({ isLoading: false });
          const errorMessage = error.response?.data?.error || 'Erro ao abrir caixa';
          console.error('cashStore: Erro ao abrir caixa:', errorMessage);
          throw new Error(errorMessage);
        }
      },

      closeCash: async (cashSessionId, closingBalance) => {
        set({ isLoading: true });
        try {
          const response = await api.post<CashSummary>(`/cash/${cashSessionId}/close`, {
            closing_balance: closingBalance,
          });
          set({ openCash: null, isLoading: false });
          console.log('cashStore: Caixa fechado:', response.data); // ✅ DEBUG: Confirma fechamento
          return response.data;
        } catch (error: any) {
          set({ isLoading: false });
          const errorMessage = error.response?.data?.error || 'Erro ao fechar caixa';
          console.error('cashStore: Erro ao fechar caixa:', errorMessage);
          throw new Error(errorMessage);
        }
      },

      getCashSummary: async (cashSessionId) => {
        try {
          const response = await api.get<CashSummary>(`/cash/${cashSessionId}/summary`);
          return response.data;
        } catch (error: any) {
          const errorMessage = error.response?.data?.error || 'Erro ao buscar resumo do caixa';
          console.error('cashStore: Erro ao buscar resumo:', errorMessage);
          throw new Error(errorMessage);
        }
      },
    }),
    {
      name: 'cash-store', // ✅ NOME para localStorage
      partialize: (state) => ({ openCash: state.openCash }), // ✅ SALVA APENAS openCash
    }
  )
);
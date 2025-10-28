import { create } from 'zustand';
import { Sale, SaleWithItems, CreateSaleRequest } from '@/types';
import api from '@/lib/api';
import { toast } from 'sonner';

interface SaleState {
  sales: Sale[];
  currentSale: SaleWithItems | null;
  isLoading: boolean;
  getSales: (cashSessionId?: number) => Promise<void>;
  getSaleById: (id: number) => Promise<SaleWithItems | null>;
  createSale: (data: CreateSaleRequest) => Promise<Sale>;
  cancelSale: (id: number, reason: string) => Promise<void>;
  getDailySummary: () => Promise<any>;
}

export const useSaleStore = create<SaleState>((set, get) => ({
  sales: [],
  currentSale: null,
  isLoading: false,

  getSales: async (cashSessionId?: number) => {
    set({ isLoading: true });
    try {
      const url = cashSessionId ? `/sales?cashSessionId=${cashSessionId}` : '/sales';
      const response = await api.get(url);
      set({ sales: response.data, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      toast.error('Erro ao carregar vendas');
      throw error;
    }
  },

  getSaleById: async (id: number) => {
    try {
      const response = await api.get(`/sales/${id}`);
      set({ currentSale: response.data });
      return response.data;
    } catch (error) {
      toast.error('Erro ao carregar venda');
      return null;
    }
  },

  createSale: async (data: CreateSaleRequest) => {
    try {
      const response = await api.post('/sales', data);
      set({ sales: [...get().sales, response.data] });
      toast.success('Venda registrada com sucesso');
      return response.data;
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao registrar venda');
      throw error;
    }
  },

  cancelSale: async (id: number, reason: string) => {
    try {
      await api.post(`/sales/${id}/cancel`, { reason });
      set({
        sales: get().sales.map(s =>
          s.id === id ? { ...s, status: 'cancelada' as const } : s
        ),
      });
      toast.success('Venda cancelada com sucesso');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao cancelar venda');
      throw error;
    }
  },

  getDailySummary: async () => {
    try {
      const response = await api.get('/reports/daily');
      return response.data;
    } catch (error) {
      toast.error('Erro ao carregar resumo diário');
      throw error;
    }
  },
}));

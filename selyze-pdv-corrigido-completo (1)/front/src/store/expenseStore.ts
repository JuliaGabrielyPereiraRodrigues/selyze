import { create } from 'zustand';
import { Expense } from '@/types';
import api from '@/lib/api';
import { toast } from 'sonner';

interface ExpenseState {
  expenses: Expense[];
  isLoading: boolean;
  getExpenses: (cashSessionId?: number) => Promise<void>;
  getExpenseById: (id: number) => Promise<Expense | null>;
  createExpense: (data: Partial<Expense>, file?: File) => Promise<Expense>;
  updateExpense: (id: number, data: Partial<Expense>) => Promise<Expense>;
  deleteExpense: (id: number) => Promise<void>;
}

export const useExpenseStore = create<ExpenseState>((set, get) => ({
  expenses: [],
  isLoading: false,

  getExpenses: async (cashSessionId?: number) => {
    set({ isLoading: true });
    try {
      const url = cashSessionId ? `/expenses?cashSessionId=${cashSessionId}` : '/expenses';
      const response = await api.get(url);
      set({ expenses: response.data, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      toast.error('Erro ao carregar despesas');
      throw error;
    }
  },

  getExpenseById: async (id: number) => {
    try {
      const response = await api.get(`/expenses/${id}`);
      return response.data;
    } catch (error) {
      toast.error('Erro ao carregar despesa');
      return null;
    }
  },

  createExpense: async (data: Partial<Expense>, file?: File) => {
    try {
      const formData = new FormData();
      
      // Adicionar campos de texto
      if (data.cash_session_id) formData.append('cash_session_id', data.cash_session_id.toString());
      if (data.type) formData.append('type', data.type);
      if (data.description) formData.append('description', data.description);
      if (data.amount !== undefined) formData.append('amount', data.amount.toString());
      if (data.category) formData.append('category', data.category);
      if (data.expense_date) formData.append('expense_date', data.expense_date);
      
      // Adicionar arquivo se existir
      if (file) {
        formData.append('attachment', file);
      }
      
      const response = await api.post('/expenses', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      set({ expenses: [...get().expenses, response.data] });
      toast.success('Despesa registrada com sucesso');
      return response.data;
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao registrar despesa');
      throw error;
    }
  },

  updateExpense: async (id: number, data: Partial<Expense>) => {
    try {
      const response = await api.put(`/expenses/${id}`, data);
      set({
        expenses: get().expenses.map(e => (e.id === id ? response.data : e)),
      });
      toast.success('Despesa atualizada com sucesso');
      return response.data;
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao atualizar despesa');
      throw error;
    }
  },

  deleteExpense: async (id: number) => {
    try {
      await api.delete(`/expenses/${id}`);
      set({ expenses: get().expenses.filter(e => e.id !== id) });
      toast.success('Despesa deletada com sucesso');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao deletar despesa');
      throw error;
    }
  },
}));

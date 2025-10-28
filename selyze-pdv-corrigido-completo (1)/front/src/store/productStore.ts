import { create } from 'zustand';
import { Product } from '@/types';
import api from '@/lib/api';
import { toast } from 'sonner';

interface ProductState {
  products: Product[];
  isLoading: boolean;
  isError: boolean;
  getProducts: () => Promise<void>;
  getProductById: (id: number) => Promise<Product | null>;
  createProduct: (data: Partial<Product>) => Promise<Product>;
  updateProduct: (id: number, data: Partial<Product>) => Promise<Product>;
  deleteProduct: (id: number) => Promise<void>;
}

export const useProductStore = create<ProductState>((set, get) => ({
  products: [],
  isLoading: false,
  isError: false,

  getProducts: async () => {
    set({ isLoading: true, isError: false });
    try {
      const response = await api.get('/products');
      set({ products: response.data, isLoading: false });
    } catch (error) {
      set({ isError: true, isLoading: false });
      toast.error('Erro ao carregar produtos');
      throw error;
    }
  },

  getProductById: async (id: number) => {
    try {
      const response = await api.get(`/products/${id}`);
      return response.data;
    } catch (error) {
      toast.error('Erro ao carregar produto');
      return null;
    }
  },

  createProduct: async (data: Partial<Product>) => {
    try {
      const response = await api.post('/products', data);
      set({ products: [...get().products, response.data] });
      toast.success('Produto criado com sucesso');
      return response.data;
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao criar produto');
      throw error;
    }
  },

  updateProduct: async (id: number, data: Partial<Product>) => {
    try {
      const response = await api.put(`/products/${id}`, data);
      set({
        products: get().products.map(p => (p.id === id ? response.data : p)),
      });
      toast.success('Produto atualizado com sucesso');
      return response.data;
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao atualizar produto');
      throw error;
    }
  },

  deleteProduct: async (id: number) => {
    try {
      await api.delete(`/products/${id}`);
      set({ products: get().products.filter(p => p.id !== id) });
      toast.success('Produto deletado com sucesso');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao deletar produto');
      throw error;
    }
  },
}));

import { useState, useEffect } from 'react';
import { User, UserRole } from '@/types';
import api from '@/lib/api';
import { toast } from 'sonner';

export function useUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const getUsers = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/users');
      setUsers(response.data);
    } catch (error) {
      toast.error('Erro ao carregar usuários');
    } finally {
      setIsLoading(false);
    }
  };

  const createUser = async (data: {
    username: string;
    name: string;
    role: UserRole;
    security_question?: string;
  }) => {
    try {
      const response = await api.post('/users', data);
      setUsers([...users, response.data]);
      toast.success('Usuário criado com sucesso');
      return response.data;
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao criar usuário');
      throw error;
    }
  };

  const updateUser = async (id: number, data: Partial<User>) => {
    try {
      const response = await api.put(`/users/${id}`, data);
      setUsers(users.map(u => (u.id === id ? response.data : u)));
      toast.success('Usuário atualizado com sucesso');
      return response.data;
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao atualizar usuário');
      throw error;
    }
  };

  const deleteUser = async (id: number) => {
    try {
      await api.delete(`/users/${id}`);
      setUsers(users.filter(u => u.id !== id));
      toast.success('Usuário deletado com sucesso');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao deletar usuário');
      throw error;
    }
  };

  const resetPassword = async (id: number) => {
    try {
      const response = await api.post(`/users/${id}/reset-password`);
      const tempPassword = response.data.temporary_password;
      
      // Mostrar senha temporária
      toast.success(
        <div>
          <p className="font-bold">Senha resetada com sucesso!</p>
          <p className="mt-2">Senha temporária:</p>
          <p className="text-2xl font-mono font-bold mt-1 bg-yellow-100 dark:bg-yellow-900 p-2 rounded">
            {tempPassword}
          </p>
          <p className="text-xs mt-2">Copie e envie para o usuário</p>
        </div>,
        { duration: 15000 } // 15 segundos
      );
      
      // Copiar para clipboard
      navigator.clipboard.writeText(tempPassword);
      toast.info('Senha copiada para a área de transferência');
      
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao resetar senha');
      throw error;
    }
  };

  useEffect(() => {
    getUsers();
  }, []);

  return {
    users,
    isLoading,
    getUsers,
    createUser,
    updateUser,
    deleteUser,
    resetPassword,
  };
}

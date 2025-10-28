import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export const formatDate = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, 'dd/MM/yyyy', { locale: ptBR });
};

export const formatDateTime = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
};

export const formatTime = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, 'HH:mm', { locale: ptBR });
};

export const parseFormattedCurrency = (value: string): number => {
  const cleanValue = value.replace(/[^\d,]/g, '').replace(',', '.');
  return parseFloat(cleanValue) || 0;
};

export const getRoleName = (role: string): string => {
  const roles: Record<string, string> = {
    admin: 'Administrador',
    gerente: 'Gerente',
    caixa: 'Caixa',
  };
  return roles[role] || role;
};

export const getPaymentMethodName = (method: string): string => {
  const methods: Record<string, string> = {
    dinheiro: 'Dinheiro',
    cartao: 'Cartão',
    pix: 'PIX',
    ifood: 'iFood',
    multiplo: 'Múltiplos',
  };
  return methods[method] || method;
};

export const getExpenseTypeName = (type: string): string => {
  const types: Record<string, string> = {
    despesa: 'Despesa',
    sangria: 'Sangria',
    suprimento: 'Suprimento',
  };
  return types[type] || type;
};

export const getCategoryName = (category: string): string => {
  const categories: Record<string, string> = {
    marmita: 'Marmita',
    bebida: 'Bebida',
    sobremesa: 'Sobremesa',
    adicional: 'Adicional',
    generico: 'Genérico',
  };
  return categories[category] || category;
};

import { useEffect } from 'react';
import { useExpenseStore } from '@/store/expenseStore';
import { useCashStore } from '@/store/cashStore';
import { Expense } from '@/types';

export function useExpenses() {
  const expenseStore = useExpenseStore();
  const { currentSession } = useCashStore();

  useEffect(() => {
    // Buscar todas as despesas, não apenas da sessão atual
    expenseStore.getExpenses();
  }, []);

  const expensesByType = {
    despesa: expenseStore.expenses.filter(e => e.type === 'despesa'),
    sangria: expenseStore.expenses.filter(e => e.type === 'sangria'),
    suprimento: expenseStore.expenses.filter(e => e.type === 'suprimento'),
  };

  const totalExpenses = expenseStore.expenses
    .filter(e => e.type === 'despesa')
    .reduce((sum, e) => sum + e.amount, 0);

  const totalSangria = expensesByType.sangria.reduce((sum, e) => sum + e.amount, 0);
  const totalSuprimento = expensesByType.suprimento.reduce((sum, e) => sum + e.amount, 0);

  return {
    ...expenseStore,
    expensesByType,
    totalExpenses,
    totalSangria,
    totalSuprimento,
    currentSession, // Disponibilizar sessão atual para criar novas despesas
  };
}

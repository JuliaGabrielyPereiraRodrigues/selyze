import { queryAll, queryOne, execute } from '../db/connection';
import { Expense, CreateExpenseRequest } from '../types';

export class ExpenseService {
  async findAll(): Promise<Expense[]> {
    try {
      const expenses = await queryAll<Expense>(
        'SELECT * FROM expenses ORDER BY created_at DESC'
      );
      return expenses || [];
    } catch (error) {
      console.error('❌ Erro em ExpenseService.findAll:', error);
      throw new Error('Falha ao buscar todas as despesas.');
    }
  }

  async create(
    cashSessionId: number | null, // AGORA OPCIONAL
    userId: number,
    data: CreateExpenseRequest,
    attachment?: string
  ): Promise<Expense> {
    try {
      console.log(`💰 Criando despesa - Caixa: ${cashSessionId || 'sem caixa'}, Usuário: ${userId}`);
      
      // 1) Faz o INSERT normalmente (execute não precisa retornar nada)
      await execute(
        'INSERT INTO expenses (cash_session_id, user_id, type, description, amount, category, attachment, expense_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [
          cashSessionId, // pode ser null
          userId,
          data.type,
          data.description,
          data.amount,
          data.category || null,
          attachment || null,
          data.expense_date || new Date().toISOString().split('T')[0],
        ]
      );

      // 2) Busca o último ID inserido no SQLite
      const inserted = await queryOne<{ id: number }>('SELECT last_insert_rowid() AS id');
      if (!inserted || !inserted.id) {
        throw new Error('Erro ao obter o ID da despesa recém-criada.');
      }

      // 3) Retorna o registro completo
      const expense = await queryOne<Expense>(
        'SELECT * FROM expenses WHERE id = ?',
        [inserted.id]
      );
      if (!expense) throw new Error('Erro ao criar despesa.');

      console.log(`✅ Despesa criada: ID ${expense.id}, Valor: R$ ${expense.amount}`);
      return expense;
    } catch (error: any) {
      console.error('❌ Erro em ExpenseService.create:', error.message || error);
      throw error;
    }
  }

  async findByCashSession(cashSessionId: number): Promise<Expense[]> {
    try {
      const expenses = await queryAll<Expense>(
        'SELECT * FROM expenses WHERE cash_session_id = ? ORDER BY created_at DESC',
        [cashSessionId]
      );
      return expenses || [];
    } catch (error) {
      console.error('❌ Erro em ExpenseService.findByCashSession:', error);
      throw new Error('Falha ao buscar despesas do caixa.');
    }
  }

  async findByDateRange(startDate: string, endDate: string): Promise<Expense[]> {
    try {
      const expenses = await queryAll<Expense>(
        'SELECT * FROM expenses WHERE expense_date BETWEEN ? AND ? ORDER BY expense_date DESC, created_at DESC',
        [startDate, endDate]
      );
      return expenses || [];
    } catch (error) {
      console.error('❌ Erro em ExpenseService.findByDateRange:', error);
      throw new Error('Falha ao buscar despesas no período.');
    }
  }

  async delete(id: number): Promise<void> {
    try {
      await execute('DELETE FROM expenses WHERE id = ?', [id]);
    } catch (error) {
      console.error('❌ Erro em ExpenseService.delete:', error);
      throw new Error('Falha ao excluir despesa.');
    }
  }
}

export default new ExpenseService();

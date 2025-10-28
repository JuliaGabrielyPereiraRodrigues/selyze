import { queryAll, queryOne, execute } from '../db/connection';
import { CashSession, CashSummary, PaymentMethod } from '../types';
import { diffInHours } from '../utils/date';

export class CashService {
  async openCash(userId: number, openingBalance: number): Promise<CashSession> {
    try {
      console.log(`📄 Tentando abrir caixa - Usuário: ${userId}, Saldo: ${openingBalance}`);
      
      const openCash = await queryOne<CashSession>(
        "SELECT * FROM cash_sessions WHERE user_id = ? AND status = 'aberto'",
        [userId]
      );

      if (openCash) {
        console.log(`⚠️ Caixa já aberto - ID: ${openCash.id}`);
        throw new Error('Você já tem um caixa aberto');
      }

      const result = await execute(
        "INSERT INTO cash_sessions (user_id, opening_balance, status) VALUES (?, ?, 'aberto')",
        [userId, openingBalance]
      );

      const session = await queryOne<CashSession>(
        'SELECT * FROM cash_sessions WHERE id = ?',
        [result.lastID]
      );

      if (!session) {
        throw new Error('Erro ao abrir caixa');
      }

      console.log(`✅ Caixa aberto com sucesso - ID: ${session.id}`);
      return session;
    } catch (error: any) {
      console.error('❌ Erro em openCash:', error.message);
      throw error;
    }
  }

  async getCashSummary(sessionId: number): Promise<CashSummary> {
    try {
      const session = await queryOne<CashSession>(
        'SELECT * FROM cash_sessions WHERE id = ?',
        [sessionId]
      );
      if (!session) throw new Error('Sessão de caixa não encontrada');

      const salesStats =
        (await queryOne<any>(
          `SELECT 
            COUNT(*) as sales_count,
            COALESCE(SUM(total), 0) as sales_total,
            COALESCE(SUM(discount), 0) as discount_total,
            COALESCE(SUM(ifood_commission), 0) as ifood_commission_total,
            COALESCE(SUM(ifood_payment_fee), 0) as ifood_payment_fee_total
           FROM sales 
           WHERE cash_session_id = ? AND status = 'concluida'`,
          [sessionId]
        )) || {
          sales_count: 0,
          sales_total: 0,
          discount_total: 0,
          ifood_commission_total: 0,
          ifood_payment_fee_total: 0,
        };

      const expensesStats =
        (await queryOne<any>(
          `SELECT 
            COALESCE(SUM(CASE WHEN type = "despesa" THEN amount ELSE 0 END), 0) as expenses_total,
            COALESCE(SUM(CASE WHEN type = "sangria" THEN amount ELSE 0 END), 0) as sangrias_total,
            COALESCE(SUM(CASE WHEN type = "suprimento" THEN amount ELSE 0 END), 0) as suprimentos_total
           FROM expenses 
           WHERE cash_session_id = ?`,
          [sessionId]
        )) || {
          expenses_total: 0,
          sangrias_total: 0,
          suprimentos_total: 0,
        };

      const sales =
        (await queryAll<any>(
          "SELECT payment_method, payment_details, total FROM sales WHERE cash_session_id = ? AND status = 'concluida'",
          [sessionId]
        )) || [];

      const paymentMethods = new Map<PaymentMethod, number>();

      for (const sale of sales) {
        if (sale.payment_method === 'multiplo' && sale.payment_details) {
          try {
            const payments = typeof sale.payment_details === 'string'
              ? JSON.parse(sale.payment_details)
              : sale.payment_details;

            for (const p of payments || []) {
              const current = paymentMethods.get(p.method) || 0;
              paymentMethods.set(p.method as PaymentMethod, current + Number(p.amount || 0));
            }
          } catch {
            const current = paymentMethods.get('dinheiro' as PaymentMethod) || 0;
            paymentMethods.set('dinheiro' as PaymentMethod, current + Number(sale.total || 0));
          }
        } else {
          const current = paymentMethods.get(sale.payment_method as PaymentMethod) || 0;
          paymentMethods.set(sale.payment_method as PaymentMethod, current + Number(sale.total || 0));
        }
      }

      const payment_methods = Array.from(paymentMethods.entries()).map(([method, total]) => ({
        method,
        total,
      }));

      const expected_balance =
        Number(session.opening_balance || 0) +
        Number(salesStats.sales_total || 0) +
        Number(expensesStats.suprimentos_total || 0) -
        Number(expensesStats.expenses_total || 0) -
        Number(expensesStats.sangrias_total || 0);

      const net_profit =
        Number(salesStats.sales_total || 0) -
        Number(expensesStats.expenses_total || 0) -
        Number(salesStats.ifood_commission_total || 0) -
        Number(salesStats.ifood_payment_fee_total || 0);

      return {
        session,
        sales_count: Number(salesStats.sales_count || 0),
        sales_total: Number(salesStats.sales_total || 0),
        expenses_total: Number(expensesStats.expenses_total || 0),
        sangrias_total: Number(expensesStats.sangrias_total || 0),
        suprimentos_total: Number(expensesStats.suprimentos_total || 0),
        discount_total: Number(salesStats.discount_total || 0),
        ifood_commission_total: Number(salesStats.ifood_commission_total || 0),
        ifood_payment_fee_total: Number(salesStats.ifood_payment_fee_total || 0),
        payment_methods,
        net_profit,
        expected_balance,
      };
    } catch (error) {
      console.error('❌ Erro em getCashSummary:', error);
      throw new Error('Falha ao gerar resumo de caixa');
    }
  }

  async getOpenCash(userId: number): Promise<CashSession | null> {
    try {
      const openCash = await queryOne<CashSession>(
        "SELECT * FROM cash_sessions WHERE user_id = ? AND status = 'aberto'",
        [userId]
      );
      return openCash || null;
    } catch (error) {
      console.error('❌ Erro em getOpenCash:', error);
      throw new Error('Falha ao buscar caixa aberto');
    }
  }

  async closeCash(sessionId: number, closingBalance: number): Promise<CashSummary> {
    try {
      const session = await queryOne<CashSession>(
        "SELECT * FROM cash_sessions WHERE id = ? AND status = 'aberto'",
        [sessionId]
      );
      
      if (!session) {
        throw new Error('Sessão de caixa não encontrada ou já fechada');
      }

      await execute(
        `UPDATE cash_sessions 
         SET closing_balance = ?, 
             closed_at = datetime('now', 'localtime'), 
             status = 'fechado' 
         WHERE id = ?`,
        [closingBalance, sessionId]
      );

      console.log(`✅ Caixa ${sessionId} fechado com sucesso`);
      
      // Retornar o resumo completo após fechar
      return await this.getCashSummary(sessionId);
    } catch (error) {
      console.error('❌ Erro em closeCash:', error);
      throw new Error('Falha ao fechar o caixa');
    }
  }

  async getCashHistory(userId?: number, limit: number = 50): Promise<CashSession[]> {
    try {
      if (userId) {
        return await queryAll<CashSession>(
          'SELECT * FROM cash_sessions WHERE user_id = ? ORDER BY opened_at DESC LIMIT ?',
          [userId, limit]
        );
      }
      return await queryAll<CashSession>(
        'SELECT * FROM cash_sessions ORDER BY opened_at DESC LIMIT ?',
        [limit]
      );
    } catch (error) {
      console.error('❌ Erro em getCashHistory:', error);
      throw new Error('Falha ao buscar histórico de caixa');
    }
  }

  async checkLongOpenCash(): Promise<CashSession[]> {
    try {
      const openSessions = await queryAll<CashSession>(
        "SELECT * FROM cash_sessions WHERE status = 'aberto'"
      );

      return openSessions.filter((session) => {
        const openedAt = new Date(session.opened_at);
        const hours = diffInHours(openedAt, new Date());
        return hours > 10;
      });
    } catch (error) {
      console.error('❌ Erro em checkLongOpenCash:', error);
      throw new Error('Falha ao verificar caixas abertos há muito tempo');
    }
  }
}

export default new CashService();
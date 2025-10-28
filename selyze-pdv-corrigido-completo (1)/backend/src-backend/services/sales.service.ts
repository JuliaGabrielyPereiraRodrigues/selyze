// src/services/sales.service.ts
import { queryAll, queryOne, execute, transaction } from '../db/connection';
import { Sale, SaleWithItems, SaleItem, PaymentDetail, PaymentMethod } from '../types';

interface CreateSalePayload {
  cash_session_id?: number | null;
  customer_name?: string;
  customer_phone?: string;
  items: {
    product_id?: number;
    product_name: string;
    quantity: number;
    price: number;
  }[];
  payments: PaymentDetail[];
  discount?: number;
  discount_type?: 'percent' | 'fixed';
  total: number;
}

export class SaleService {
  /**
   * Busca configurações de taxas do iFood
   */
  private async getIfoodSettings(): Promise<{ commission: number; paymentFee: number }> {
    try {
      const commission = await queryOne<any>(
        "SELECT value FROM settings WHERE key = 'ifood_commission'"
      );
      const paymentFee = await queryOne<any>(
        "SELECT value FROM settings WHERE key = 'ifood_payment_fee'"
      );

      return {
        commission: commission ? parseFloat(commission.value) : 12,
        paymentFee: paymentFee ? parseFloat(paymentFee.value) : 3.2,
      };
    } catch (error) {
      console.warn('⚠️  Erro ao buscar configurações do iFood, usando valores padrão');
      return { commission: 12, paymentFee: 3.2 };
    }
  }

  /**
   * Calcula as taxas do iFood baseado nos pagamentos
   */
  private calculateIfoodFees(
    payments: PaymentDetail[],
    total: number,
    commission: number,
    paymentFee: number
  ): { ifood_commission: number; ifood_payment_fee: number } {
    let ifood_commission = 0;
    let ifood_payment_fee = 0;

    payments.forEach((payment) => {
      if (payment.method.toLowerCase() === 'ifood') {
        // Comissão do iFood aplicada sobre o valor da venda
        ifood_commission += (payment.amount * commission) / 100;
        // Taxa de pagamento do iFood
        ifood_payment_fee += (payment.amount * paymentFee) / 100;
      }
    });

    return { ifood_commission, ifood_payment_fee };
  }

  /**
   * Cria uma nova venda
   */
  async create(
    cashSessionId: number | null | undefined,
    userId: number,
    payload: CreateSalePayload
  ): Promise<SaleWithItems> {
    console.log('📦 Dados recebidos para criar venda:', JSON.stringify(payload, null, 2));

    try {
      return await transaction(async () => {
        // Buscar configurações de taxas do iFood
        const ifoodSettings = await this.getIfoodSettings();
        console.log('💰 Taxas iFood:', ifoodSettings);

        // Validações básicas
        if (!payload.items || payload.items.length === 0) {
          throw new Error('Nenhum item informado na venda');
        }

        if (!payload.payments || payload.payments.length === 0) {
          throw new Error('Nenhum pagamento informado');
        }

        // Calcular subtotal
        const subtotal = payload.items.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0
        );

        // Calcular desconto
        let discount = payload.discount || 0;
        if (payload.discount_type === 'percent') {
          discount = (subtotal * discount) / 100;
        }

        // Total da venda
        const total = Math.max(0, subtotal - discount);

        // Calcular taxas do iFood
        const { ifood_commission, ifood_payment_fee } = this.calculateIfoodFees(
          payload.payments,
          total,
          ifoodSettings.commission,
          ifoodSettings.paymentFee
        );

        console.log(
          `💳 Taxas calculadas - Comissão: R$ ${ifood_commission.toFixed(2)}, Taxa pgto: R$ ${ifood_payment_fee.toFixed(2)}`
        );

        // Determinar método de pagamento principal
        let payment_method: PaymentMethod;
        let payment_details: string | null = null;
        let change_amount = 0;

        if (payload.payments.length === 1) {
          payment_method = payload.payments[0].method;
          if (payment_method.toLowerCase() === 'dinheiro') {
            change_amount = Math.max(0, payload.payments[0].amount - total);
          }
        } else {
          payment_method = 'multiplo';
          payment_details = JSON.stringify(payload.payments);
        }

        // Inserir venda
        const saleResult = await execute(
          `INSERT INTO sales (
            cash_session_id,
            user_id,
            customer_name,
            customer_phone,
            subtotal,
            discount,
            discount_type,
            total,
            payment_method,
            payment_details,
            change_amount,
            ifood_commission,
            ifood_payment_fee,
            status,
            created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'concluida', datetime('now', 'localtime'))`,
          [
            cashSessionId || null,
            userId,
            payload.customer_name || null,
            payload.customer_phone || null,
            subtotal,
            discount,
            payload.discount_type || 'fixed',
            total,
            payment_method,
            payment_details,
            change_amount,
            ifood_commission,
            ifood_payment_fee,
          ]
        );

        const saleId = saleResult.lastID;
        console.log(`✅ Venda criada - ID: ${saleId}`);

        // Inserir itens da venda e atualizar estoque
        const items: SaleItem[] = [];
        for (const item of payload.items) {
          const itemSubtotal = item.price * item.quantity;

          await execute(
            `INSERT INTO sale_items (
              sale_id,
              product_id,
              product_name,
              product_price,
              quantity,
              subtotal
            ) VALUES (?, ?, ?, ?, ?, ?)`,
            [
              saleId,
              item.product_id || null,
              item.product_name,
              item.price,
              item.quantity,
              itemSubtotal,
            ]
          );

          // Atualizar estoque se o produto existir
          if (item.product_id) {
            const product = await queryOne<any>(
              'SELECT stock FROM products WHERE id = ?',
              [item.product_id]
            );

            if (product && typeof product.stock === 'number') {
              await execute(
                'UPDATE products SET stock = stock - ? WHERE id = ?',
                [item.quantity, item.product_id]
              );
              console.log(`📦 Estoque atualizado - Produto ID: ${item.product_id}`);
            }
          }

          items.push({
            id: 0, // Será preenchido ao buscar
            sale_id: saleId,
            product_id: item.product_id,
            product_name: item.product_name,
            product_price: item.price,
            quantity: item.quantity,
            subtotal: itemSubtotal,
          });
        }

        // Buscar venda completa
        const sale = await queryOne<Sale>(
          'SELECT * FROM sales WHERE id = ?',
          [saleId]
        );

        if (!sale) {
          throw new Error('Erro ao buscar venda criada');
        }

        console.log('✅ Venda concluída com sucesso');

        return {
          ...sale,
          items,
        };
      });
    } catch (error: any) {
      console.error('❌ Erro em SaleService.create:', error);
      throw error;
    }
  }

  /**
   * Busca uma venda por ID com seus itens
   */
  async findById(id: number): Promise<SaleWithItems | null> {
    try {
      const sale = await queryOne<Sale>('SELECT * FROM sales WHERE id = ?', [id]);

      if (!sale) {
        return null;
      }

      const items = await queryAll<SaleItem>(
        'SELECT * FROM sale_items WHERE sale_id = ?',
        [id]
      );

      return { ...sale, items };
    } catch (error) {
      console.error('❌ Erro em findById:', error);
      throw new Error('Falha ao buscar venda');
    }
  }

  /**
   * Busca vendas por sessão de caixa
   */
  async findByCashSession(cashSessionId: number): Promise<SaleWithItems[]> {
    try {
      const sales = await queryAll<Sale>(
        'SELECT * FROM sales WHERE cash_session_id = ? ORDER BY created_at DESC',
        [cashSessionId]
      );

      const salesWithItems: SaleWithItems[] = [];

      for (const sale of sales) {
        const items = await queryAll<SaleItem>(
          'SELECT * FROM sale_items WHERE sale_id = ?',
          [sale.id]
        );
        salesWithItems.push({ ...sale, items });
      }

      return salesWithItems;
    } catch (error) {
      console.error('❌ Erro em findByCashSession:', error);
      throw new Error('Falha ao buscar vendas da sessão');
    }
  }

  /**
   * Busca vendas por intervalo de datas
   */
  async findByDateRange(startDate: string, endDate: string): Promise<SaleWithItems[]> {
    try {
      const sales = await queryAll<Sale>(
        `SELECT * FROM sales 
         WHERE DATE(created_at) BETWEEN ? AND ? 
         ORDER BY created_at DESC`,
        [startDate, endDate]
      );

      const salesWithItems: SaleWithItems[] = [];

      for (const sale of sales) {
        const items = await queryAll<SaleItem>(
          'SELECT * FROM sale_items WHERE sale_id = ?',
          [sale.id]
        );
        salesWithItems.push({ ...sale, items });
      }

      return salesWithItems;
    } catch (error) {
      console.error('❌ Erro em findByDateRange:', error);
      throw new Error('Falha ao buscar vendas por período');
    }
  }

  /**
   * Cancela uma venda
   */
  async cancel(id: number, reason: string, userId: number): Promise<void> {
    try {
      await transaction(async () => {
        const sale = await queryOne<Sale>('SELECT * FROM sales WHERE id = ?', [id]);

        if (!sale) {
          throw new Error('Venda não encontrada');
        }

        if (sale.status === 'cancelada') {
          throw new Error('Venda já está cancelada');
        }

        // Atualizar status da venda
        await execute(
          `UPDATE sales 
           SET status = 'cancelada', 
               cancelled_reason = ?, 
               cancelled_at = datetime('now', 'localtime') 
           WHERE id = ?`,
          [reason, id]
        );

        // Restaurar estoque
        const items = await queryAll<SaleItem>(
          'SELECT * FROM sale_items WHERE sale_id = ?',
          [id]
        );

        for (const item of items) {
          if (item.product_id) {
            await execute(
              'UPDATE products SET stock = stock + ? WHERE id = ?',
              [item.quantity, item.product_id]
            );
          }
        }

        console.log(`✅ Venda ${id} cancelada com sucesso`);
      });
    } catch (error) {
      console.error('❌ Erro em cancel:', error);
      throw new Error('Falha ao cancelar venda');
    }
  }
}

export default new SaleService();

// src/services/notifications.service.ts
import { queryAll, queryOne, execute } from '../db/connection';
import { Notification, NotificationType } from '../types';
import productService from './products.service';
import cashService from './cash.service';

export class NotificationService {
  async create(
    userId: number | null,
    type: NotificationType,
    title: string,
    message: string
  ): Promise<Notification> {
    try {
      // INSERT sem depender de retorno do execute
      await execute(
        'INSERT INTO notifications (user_id, type, title, message) VALUES (?, ?, ?, ?)',
        [userId, type, title, message]
      );

      // Busca o último ID inserido no mesmo connection context
      const inserted = await queryOne<{ id: number }>('SELECT last_insert_rowid() AS id');
      if (!inserted || !inserted.id) {
        throw new Error('Erro ao obter ID da notificação recém-criada.');
      }

      // Retorna o registro completo
      const notification = await queryOne<Notification>(
        'SELECT * FROM notifications WHERE id = ?',
        [inserted.id]
      );

      if (!notification) throw new Error('Erro ao criar notificação');
      return notification;
    } catch (error) {
      console.error('❌ Erro em NotificationService.create:', error);
      throw new Error('Falha ao criar notificação.');
    }
  }

  async findByUser(userId: number, unreadOnly: boolean = false): Promise<Notification[]> {
    try {
      const sql = unreadOnly
        ? 'SELECT * FROM notifications WHERE user_id = ? AND read = 0 ORDER BY created_at DESC'
        : 'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC';

      const notifications = await queryAll<Notification>(sql, [userId]);
      return notifications || [];
    } catch (error) {
      console.error('❌ Erro em NotificationService.findByUser:', error);
      throw new Error('Falha ao buscar notificações do usuário.');
    }
  }

  async markAsRead(id: number): Promise<void> {
    try {
      await execute('UPDATE notifications SET read = 1 WHERE id = ?', [id]);
    } catch (error) {
      console.error('❌ Erro em NotificationService.markAsRead:', error);
      throw new Error('Falha ao marcar notificação como lida.');
    }
  }

  async markAllAsRead(userId: number): Promise<void> {
    try {
      await execute('UPDATE notifications SET read = 1 WHERE user_id = ?', [userId]);
    } catch (error) {
      console.error('❌ Erro em NotificationService.markAllAsRead:', error);
      throw new Error('Falha ao marcar todas as notificações como lidas.');
    }
  }

  async delete(id: number): Promise<void> {
    try {
      await execute('DELETE FROM notifications WHERE id = ?', [id]);
    } catch (error) {
      console.error('❌ Erro em NotificationService.delete:', error);
      throw new Error('Falha ao excluir notificação.');
    }
  }

  async checkLowStock(): Promise<void> {
    try {
      const lowStockProducts = await productService.findLowStock();
      for (const product of lowStockProducts) {
        await this.create(
          null,
          'estoque_baixo',
          'Estoque Baixo',
          `O produto "${product.name}" está com estoque baixo (${product.stock} unidades)`
        );
      }
    } catch (error) {
      console.error('❌ Erro em NotificationService.checkLowStock:', error);
      throw new Error('Falha ao verificar estoque baixo.');
    }
  }

  async checkLongOpenCash(): Promise<void> {
    try {
      const longOpenCashes = await cashService.checkLongOpenCash();
      for (const cash of longOpenCashes) {
        await this.create(
          cash.user_id,
          'caixa_aberto',
          'Caixa Aberto Há Muito Tempo',
          `Seu caixa está aberto há mais de 10 horas`
        );
      }
    } catch (error) {
      console.error('❌ Erro em NotificationService.checkLongOpenCash:', error);
      throw new Error('Falha ao verificar caixas abertos há muito tempo.');
    }
  }

  async createLowStockNotification(product: any): Promise<void> {
    try {
      const existing = await queryOne<Notification>(
        `SELECT * FROM notifications 
         WHERE type = 'estoque_baixo' 
         AND message LIKE ? 
         AND read = 0 
         AND created_at > datetime('now', '-24 hours')
         LIMIT 1`,
        [`%${product.name}%`]
      );

      if (existing) {
        console.log(`ℹ️  Notificação de estoque baixo já existe para: ${product.name}`);
        return;
      }

      await this.create(
        null,
        'estoque_baixo',
        '⚠️ Estoque Baixo',
        `O produto "${product.name}" está com estoque baixo: ${product.stock} de ${product.min_stock} unidades mínimas`
      );

      console.log(`✅ Notificação de estoque baixo criada para: ${product.name}`);
    } catch (error) {
      console.error('❌ Erro ao criar notificação de estoque baixo:', error);
    }
  }
}

export default new NotificationService();

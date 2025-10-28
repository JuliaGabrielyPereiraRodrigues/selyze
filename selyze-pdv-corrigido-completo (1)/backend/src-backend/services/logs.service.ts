import { queryAll } from '../db/connection';
import { AuditLog } from '../types';

export class LogsService {
  async findAll(limit: number = 100, offset: number = 0): Promise<AuditLog[]> {
    try {
      const logs = await queryAll<AuditLog>(
        `SELECT 
          al.*, 
          u.name as user_name,
          u.username as username
        FROM audit_logs al
        LEFT JOIN users u ON al.user_id = u.id
        ORDER BY al.created_at DESC 
        LIMIT ? OFFSET ?`,
        [limit, offset]
      );
      return logs || [];
    } catch (error) {
      console.error('❌ Erro em LogsService.findAll:', error);
      throw new Error('Falha ao buscar logs de auditoria.');
    }
  }

  async findByUser(userId: number, limit: number = 100): Promise<AuditLog[]> {
    try {
      const logs = await queryAll<AuditLog>(
        `SELECT 
          al.*, 
          u.name as user_name,
          u.username as username
        FROM audit_logs al
        LEFT JOIN users u ON al.user_id = u.id
        WHERE al.user_id = ? 
        ORDER BY al.created_at DESC 
        LIMIT ?`,
        [userId, limit]
      );
      return logs || [];
    } catch (error) {
      console.error('❌ Erro em LogsService.findByUser:', error);
      throw new Error('Falha ao buscar logs do usuário.');
    }
  }

  async findByEntity(entityType: string, entityId: number, limit: number = 100): Promise<AuditLog[]> {
    try {
      const logs = await queryAll<AuditLog>(
        `SELECT 
          al.*, 
          u.name as user_name,
          u.username as username
        FROM audit_logs al
        LEFT JOIN users u ON al.user_id = u.id
        WHERE al.entity_type = ? AND al.entity_id = ? 
        ORDER BY al.created_at DESC 
        LIMIT ?`,
        [entityType, entityId, limit]
      );
      return logs || [];
    } catch (error) {
      console.error('❌ Erro em LogsService.findByEntity:', error);
      throw new Error('Falha ao buscar logs da entidade.');
    }
  }

  async findByDateRange(startDate: string, endDate: string): Promise<AuditLog[]> {
    try {
      const logs = await queryAll<AuditLog>(
        `SELECT 
          al.*, 
          u.name as user_name,
          u.username as username
        FROM audit_logs al
        LEFT JOIN users u ON al.user_id = u.id
        WHERE al.created_at BETWEEN ? AND ? 
        ORDER BY al.created_at DESC`,
        [startDate, endDate]
      );
      return logs || [];
    } catch (error) {
      console.error('❌ Erro em LogsService.findByDateRange:', error);
      throw new Error('Falha ao buscar logs no período.');
    }
  }

  async findByAction(action: string, limit: number = 100): Promise<AuditLog[]> {
    try {
      const logs = await queryAll<AuditLog>(
        `SELECT 
          al.*, 
          u.name as user_name,
          u.username as username
        FROM audit_logs al
        LEFT JOIN users u ON al.user_id = u.id
        WHERE al.action = ? 
        ORDER BY al.created_at DESC 
        LIMIT ?`,
        [action, limit]
      );
      return logs || [];
    } catch (error) {
      console.error('❌ Erro em LogsService.findByAction:', error);
      throw new Error('Falha ao buscar logs por ação.');
    }
  }
}

export default new LogsService();

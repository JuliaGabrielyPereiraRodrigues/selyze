import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { execute } from '../db/connection';

export function auditLog(action: string, entityType: string) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    const originalSend = res.send;
    
    res.send = function (data: any) {
      // Capturar informações
      const userId = req.user?.userId;
      const entityId = req.params.id || res.locals.entityId;
      const oldValues = res.locals.oldValues ? JSON.stringify(res.locals.oldValues) : null;
      const newValues = req.body ? JSON.stringify(req.body) : null;
      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.get('user-agent');
      
      // ✅ CORRIGIDO: Registrar no banco de forma assíncrona (fire-and-forget seguro)
      setImmediate(async () => {
        try {
          await execute(
            `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_values, new_values, ip_address, user_agent)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [userId, action, entityType, entityId, oldValues, newValues, ipAddress, userAgent]
          );
        } catch (error) {
          console.error('❌ Erro ao registrar log de auditoria:', error);
        }
      });
      
      return originalSend.call(this, data);
    };
    
    next();
  };
}

// ✅ CORRIGIDO: Função auxiliar agora é async
export async function logAudit(
  userId: number | undefined,
  action: string,
  entityType: string,
  entityId?: number,
  oldValues?: any,
  newValues?: any,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  try {
    await execute(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_values, new_values, ip_address, user_agent)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId || null,
        action,
        entityType,
        entityId || null,
        oldValues ? JSON.stringify(oldValues) : null,
        newValues ? JSON.stringify(newValues) : null,
        ipAddress || null,
        userAgent || null
      ]
    );
  } catch (error) {
    console.error('❌ Erro ao registrar log de auditoria:', error);
    // Não lança erro para não quebrar o fluxo principal
  }
}
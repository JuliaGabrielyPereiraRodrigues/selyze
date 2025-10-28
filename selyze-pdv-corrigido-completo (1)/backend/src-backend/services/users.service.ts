import bcrypt from 'bcryptjs';
import { query, queryOne, execute } from '../db/connection';
import { User, UserResponse, CreateUserRequest } from '../types';

export class UserService {
  async findAll(): Promise<UserResponse[]> {
    try {
      const users = await query<User>('SELECT * FROM users WHERE active = 1 ORDER BY created_at DESC');
      return users.map(({ password, security_answer, ...user }) => user);
    } catch (error) {
      console.error('❌ Erro em UserService.findAll:', error);
      throw new Error('Falha ao buscar usuários.');
    }
  }

  async findById(id: number): Promise<UserResponse | null> {
    try {
      const user = await queryOne<User>('SELECT * FROM users WHERE id = ? AND active = 1', [id]);
      if (!user) return null;

      const { password, security_answer, ...userResponse } = user;
      return userResponse;
    } catch (error) {
      console.error('❌ Erro em UserService.findById:', error);
      throw new Error('Falha ao buscar usuário.');
    }
  }

  async create(data: CreateUserRequest): Promise<UserResponse> {
    try {
      // Verificar se username já existe
      const existing = await queryOne<User>('SELECT id FROM users WHERE username = ?', [data.username]);
      if (existing) {
        throw new Error('Nome de usuário já existe');
      }

      const hashedPassword = await bcrypt.hash(data.password, 10);
      const hashedAnswer = await bcrypt.hash(data.security_answer, 10);

      const result = await execute(
        `INSERT INTO users (username, password, name, email, role, security_question, security_answer, first_login)
         VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
        [data.username, hashedPassword, data.name, data.email || null, data.role, data.security_question, hashedAnswer]
      );

      // ✅ CORRIGIDO: Usar lastID em vez de lastInsertRowid as number
      const user = await this.findById(result.lastID);
      if (!user) throw new Error('Erro ao criar usuário');

      return user;
    } catch (error) {
      console.error('❌ Erro em UserService.create:', error);
      throw new Error('Falha ao criar usuário.');
    }
  }

  async update(id: number, data: Partial<CreateUserRequest>): Promise<UserResponse> {
    try {
      const user = await this.findById(id);
      if (!user) throw new Error('Usuário não encontrado');

      const updates: string[] = [];
      const values: any[] = [];

      if (data.name) {
        updates.push('name = ?');
        values.push(data.name);
      }

      if (data.email !== undefined) {
        updates.push('email = ?');
        values.push(data.email || null);
      }

      if (data.role) {
        updates.push('role = ?');
        values.push(data.role);
      }

      if (data.username) {
        const existing = await queryOne<User>('SELECT id FROM users WHERE username = ? AND id != ?', [data.username, id]);
        if (existing) {
          throw new Error('Nome de usuário já existe');
        }
        updates.push('username = ?');
        values.push(data.username);
      }

      if (data.password) {
        const hashedPassword = await bcrypt.hash(data.password, 10);
        updates.push('password = ?');
        values.push(hashedPassword);
      }

      if (data.security_question && data.security_answer) {
        const hashedAnswer = await bcrypt.hash(data.security_answer, 10);
        updates.push('security_question = ?', 'security_answer = ?');
        values.push(data.security_question, hashedAnswer);
      }

      if (updates.length === 0) {
        return user;
      }

      updates.push('updated_at = datetime(\'now\', \'localtime\')');
      values.push(id);

      await execute(
        `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
        values
      );

      const updatedUser = await this.findById(id);
      if (!updatedUser) throw new Error('Erro ao atualizar usuário');

      return updatedUser;
    } catch (error) {
      console.error('❌ Erro em UserService.update:', error);
      throw new Error('Falha ao atualizar usuário.');
    }
  }

  async delete(id: number): Promise<void> {
    try {
      await execute(
        `UPDATE users SET active = 0, updated_at = datetime('now', 'localtime') WHERE id = ?`,
        [id]
      );
    } catch (error) {
      console.error('❌ Erro em UserService.delete:', error);
      throw new Error('Falha ao desativar usuário.');
    }
  }

  async activate(id: number): Promise<void> {
    try {
      await execute(
        `UPDATE users SET active = 1, updated_at = datetime('now', 'localtime') WHERE id = ?`,
        [id]
      );
    } catch (error) {
      console.error('❌ Erro em UserService.activate:', error);
      throw new Error('Falha ao reativar usuário.');
    }
  }

  async resetPassword(id: number): Promise<string> {
    try {
      // Gerar senha temporária
      const tempPassword = this.generateTemporaryPassword();
      const hashedPassword = await bcrypt.hash(tempPassword, 10);

      await execute(
        `UPDATE users SET password = ?, first_login = 1, updated_at = datetime('now', 'localtime') WHERE id = ?`,
        [hashedPassword, id]
      );

      console.log(`✅ Senha resetada para usuário ID ${id}`);
      return tempPassword;
    } catch (error) {
      console.error('❌ Erro em UserService.resetPassword:', error);
      throw new Error('Falha ao resetar senha.');
    }
  }

  private generateTemporaryPassword(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }
}

export default new UserService();
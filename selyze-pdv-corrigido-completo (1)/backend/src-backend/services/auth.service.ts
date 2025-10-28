import bcrypt from 'bcryptjs';
import { queryOne, execute } from '../db/connection';
import { generateToken } from '../utils/jwt';
import { User, AuthResponse } from '../types';
import { logAudit } from '../middleware/audit';

export class AuthService {
  // Login padrão
  async login(username: string, password: string): Promise<AuthResponse> {
    const user = await queryOne<User>(
      'SELECT * FROM users WHERE username = ? AND active = 1',
      [username]
    );

    if (!user) throw new Error('Usuário ou senha inválidos');

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) throw new Error('Usuário ou senha inválidos');

    const { password: _, security_answer, ...userResponse } = user;
    const token = generateToken(userResponse);

    logAudit(user.id, 'LOGIN', 'user', user.id);
    return { token, user: userResponse };
  }

  // Alterar senha autenticado
  async changePassword(userId: number, oldPassword: string, newPassword: string): Promise<void> {
    const user = await queryOne<User>('SELECT * FROM users WHERE id = ?', [userId]);
    if (!user) throw new Error('Usuário não encontrado');

    const isValid = await bcrypt.compare(oldPassword, user.password);
    if (!isValid) throw new Error('Senha atual incorreta');

    const hashed = await bcrypt.hash(newPassword, 10);
    await execute(
      `UPDATE users SET password = ?, first_login = 0, updated_at = datetime('now','localtime') WHERE id = ?`,
      [hashed, userId]
    );

    logAudit(userId, 'CHANGE_PASSWORD', 'user', userId);
  }

  // Obter pergunta de segurança
  async getSecurityQuestion(username: string): Promise<string | null> {
    const user = await queryOne<User>(
      'SELECT security_question FROM users WHERE username = ? AND active = 1',
      [username]
    );
    return user?.security_question || null;
  }

  // ✅ Novo método — verificar resposta de segurança (sem alterar senha)
  async verifySecurityAnswer(username: string, securityAnswer: string): Promise<boolean> {
    const user = await queryOne<User>(
      'SELECT * FROM users WHERE username = ? AND active = 1',
      [username]
    );

    if (!user || !user.security_answer) {
      return false;
    }

    const isValid = await bcrypt.compare(securityAnswer, user.security_answer);
    return isValid;
  }

  // Verificar resposta e redefinir senha (sem email)
  async recoverPassword(username: string, securityAnswer: string, newPassword: string): Promise<void> {
    const user = await queryOne<User>(
      'SELECT * FROM users WHERE username = ? AND active = 1',
      [username]
    );

    if (!user || !user.security_answer) {
      throw new Error('Usuário não encontrado ou sem pergunta de segurança configurada');
    }

    const isValidAnswer = await bcrypt.compare(securityAnswer, user.security_answer);
    if (!isValidAnswer) throw new Error('Resposta de segurança incorreta');

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await execute(
      `UPDATE users SET password = ?, first_login = 0, updated_at = datetime('now','localtime') WHERE id = ?`,
      [hashedPassword, user.id]
    );

    logAudit(user.id, 'RECOVER_PASSWORD', 'user', user.id);
  }

  // Verifica se é primeiro login
  async verifyFirstLogin(userId: number): Promise<boolean> {
    const user = await queryOne<User>('SELECT first_login FROM users WHERE id = ?', [userId]);
    return user?.first_login === 1;
  }
}

export default new AuthService();

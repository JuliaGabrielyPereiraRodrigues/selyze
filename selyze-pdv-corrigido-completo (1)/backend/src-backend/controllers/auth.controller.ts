import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import authService from '../services/auth.service';

/**
 * Controller responsável pela autenticação e controle de acesso
 * Inclui login, troca de senha e verificação de primeiro login e pergunta de segurança
 */
class AuthController {
  /**
   * Realiza o login do usuário
   */
  async login(req: Request, res: Response): Promise<void> {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        res.status(400).json({ message: 'Usuário e senha são obrigatórios.' });
        return;
      }

      const result = await authService.login(username, password);
      res.json(result);
    } catch (error: any) {
      console.error('❌ Erro no login:', error);
      res.status(401).json({ message: error.message || 'Falha na autenticação.' });
    }
  }

  /**
   * Retorna a pergunta de segurança do usuário
   */
  async getSecurityQuestion(req: Request, res: Response): Promise<void> {
    try {
      const { username } = req.query;

      if (!username || typeof username !== 'string') {
        res.status(400).json({ message: 'Usuário é obrigatório.' });
        return;
      }

      const question = await authService.getSecurityQuestion(username);

      if (!question) {
        res.status(404).json({ message: 'Usuário não encontrado.' });
        return;
      }

      res.json({ question });
    } catch (error: any) {
      console.error('❌ Erro ao buscar pergunta de segurança:', error);
      res.status(500).json({ message: error.message || 'Erro ao buscar pergunta.' });
    }
  }

  /**
   * Verifica se a resposta da pergunta de segurança está correta
   */
  async verifySecurityAnswer(req: Request, res: Response): Promise<void> {
    try {
      const { username, answer } = req.body;

      if (!username || !answer) {
        res.status(400).json({ message: 'Usuário e resposta são obrigatórios.' });
        return;
      }

      // Validação de tipos
      if (typeof username !== 'string' || typeof answer !== 'string') {
        res.status(400).json({ message: 'Dados inválidos.' });
        return;
      }

      const isValid = await authService.verifySecurityAnswer(username, answer);

      if (!isValid) {
        res.status(401).json({ message: 'Resposta incorreta.' });
        return;
      }

      res.json({ message: 'Resposta correta. Pode redefinir a senha.' });
    } catch (error: any) {
      console.error('❌ Erro ao verificar resposta de segurança:', error);
      res.status(500).json({ message: error.message || 'Erro ao verificar resposta.' });
    }
  }

  /**
   * Permite ao usuário autenticado alterar sua senha
   */
  async changePassword(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { old_password, new_password } = req.body;

      if (!old_password || !new_password) {
        res.status(400).json({ message: 'Senhas antiga e nova são obrigatórias.' });
        return;
      }

      // Validação de força da senha
      if (new_password.length < 6) {
        res.status(400).json({ message: 'A nova senha deve ter no mínimo 6 caracteres.' });
        return;
      }

      if (!req.user) {
        res.status(401).json({ message: 'Usuário não autenticado.' });
        return;
      }

      await authService.changePassword(req.user.userId, old_password, new_password);
      res.json({ message: 'Senha alterada com sucesso.' });
    } catch (error: any) {
      console.error('❌ Erro ao alterar senha:', error);
      res.status(400).json({ message: error.message || 'Falha ao alterar senha.' });
    }
  }

  /**
   * Verifica se é o primeiro login do usuário
   */
  async verifyFirstLogin(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ message: 'Usuário não autenticado.' });
        return;
      }

      const isFirstLogin = await authService.verifyFirstLogin(req.user.userId);
      res.json({ first_login: isFirstLogin });
    } catch (error: any) {
      console.error('❌ Erro ao verificar primeiro login:', error);
      res.status(500).json({ message: error.message || 'Erro ao verificar primeiro login.' });
    }
  }
}

export default new AuthController();
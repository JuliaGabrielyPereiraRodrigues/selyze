import { Request, Response, NextFunction } from 'express';
import { verifyToken, JwtPayload } from '../utils/jwt';
import { UserRole } from '../types';

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

// Autenticação via token JWT
export function authenticate(req: AuthRequest, res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({ message: 'Token não fornecido' });
      return;
    }

    const [bearer, token] = authHeader.split(' ');

    if (bearer !== 'Bearer' || !token) {
      res.status(401).json({ message: 'Formato de token inválido' });
      return;
    }

    const payload = verifyToken(token);
    req.user = payload;

    next();
    return;
  } catch (error) {
    res.status(401).json({ message: 'Token inválido ou expirado' });
    return;
  }
}

// Autorização com base em roles (admin, gerente, caixa)
export function authorize(...roles: UserRole[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: 'Usuário não autenticado' });
      return;
    }

    if (!roles.includes(req.user.role as UserRole)) {
      res.status(403).json({ message: 'Acesso negado' });
      return;
    }

    next();
    return;
  };
}

// Middleware padrão
export function auth(req: AuthRequest, res: Response, next: NextFunction): void {
  authenticate(req, res, next);
}

// ✅ CORRIGIDO: Apenas administradores (simplificado)
export function authAdmin(req: AuthRequest, res: Response, next: NextFunction): void {
  authenticate(req, res, () => {
    if (!req.user) return; // Já tratado no authenticate
    authorize('admin')(req, res, next);
  });
}

// ✅ CORRIGIDO: Administradores ou gerentes (simplificado)
export function authAdminOrGerente(req: AuthRequest, res: Response, next: NextFunction): void {
  authenticate(req, res, () => {
    if (!req.user) return; // Já tratado no authenticate
    authorize('admin', 'gerente')(req, res, next);
  });
}
import jwt, { SignOptions } from 'jsonwebtoken';
import { UserResponse } from '../types';

// ✅ CORRIGIDO: Validar secret em produção
const JWT_SECRET = (() => {
  const secret = process.env.JWT_SECRET;
  
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET não configurado em produção!');
    }
    console.warn('⚠️ Usando JWT_SECRET padrão. NÃO USE EM PRODUÇÃO!');
    return 'default_secret_CHANGE_THIS_IN_PRODUCTION';
  }
  
  if (secret.length < 32) {
    console.warn('⚠️ JWT_SECRET muito curto. Recomendado: 32+ caracteres');
  }
  
  return secret;
})();

const JWT_EXPIRES_IN: string = process.env.JWT_EXPIRES_IN || '24h';

export interface JwtPayload {
  userId: number;
  username: string;
  role: string;
}

export function generateToken(user: UserResponse): string {
  const payload: JwtPayload = {
    userId: user.id,
    username: user.username,
    role: user.role
  };
  
  const options: SignOptions = {
    expiresIn: JWT_EXPIRES_IN as any // Workaround para tipagem do @types/jsonwebtoken
  };
  
  return jwt.sign(payload, JWT_SECRET, options);
}

export function verifyToken(token: string): JwtPayload {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch (error: any) {
    // Diferenciar tipos de erro
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token expirado');
    }
    if (error.name === 'JsonWebTokenError') {
      throw new Error('Token inválido');
    }
    throw new Error('Erro ao verificar token');
  }
}

export function decodeToken(token: string): JwtPayload | null {
  try {
    return jwt.decode(token) as JwtPayload;
  } catch {
    return null;
  }
}
- Migração: Adicionar campos de reset token
-- Data: 2025-10-25

-- Adicionar colunas para reset token
ALTER TABLE users ADD COLUMN reset_token TEXT;
ALTER TABLE users ADD COLUMN reset_token_expires TEXT;

-- Pronto! Agora usuários podem resetar senha por email com código

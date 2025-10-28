import { query, queryOne, execute, transaction } from '../db/connection';
import { Setting } from '../types';

export class SettingsService {
  async getAll(): Promise<Record<string, string>> {
    try {
      console.log('🔍 Buscando todas as configurações...');
      const settings = await query<Setting>('SELECT * FROM settings');
      const result: Record<string, string> = {};

      (settings || []).forEach(setting => {
        result[setting.key] = setting.value;
      });

      console.log(`✅ ${Object.keys(result).length} configurações carregadas`);
      return result;
    } catch (error) {
      console.error('❌ Erro em SettingsService.getAll:', error);
      throw new Error('Falha ao buscar todas as configurações.');
    }
  }

  async get(key: string): Promise<string | null> {
    try {
      const setting = await queryOne<Setting>('SELECT * FROM settings WHERE key = ?', [key]);
      return setting?.value || null;
    } catch (error) {
      console.error('❌ Erro em SettingsService.get:', error);
      throw new Error('Falha ao buscar configuração.');
    }
  }

  async set(key: string, value: any): Promise<void> {
    try {
      console.log(`💾 Salvando configuração: ${key}`);
      
      // Validação básica
      if (!key || key.trim() === '') {
        throw new Error('Chave da configuração não pode estar vazia');
      }
      
      // Converter valor para string se não for
      const stringValue = typeof value === 'string' ? value : String(value);
      
      // Validar tamanho do valor (máximo 10MB em texto)
      const valueSize = Buffer.byteLength(stringValue, 'utf8');
      const maxSize = 10 * 1024 * 1024; // 10MB
      
      if (valueSize > maxSize) {
        const sizeMB = (valueSize / 1024 / 1024).toFixed(2);
        throw new Error(`Valor muito grande: ${sizeMB}MB (máximo: 10MB)`);
      }
      
      const existing = await this.get(key);

      if (existing !== null) {
        console.log(`🔄 Atualizando configuração existente: ${key}`);
        await execute(
          `UPDATE settings SET value = ?, updated_at = datetime('now', 'localtime') WHERE key = ?`,
          [stringValue, key]
        );
      } else {
        console.log(`➕ Criando nova configuração: ${key}`);
        await execute(
          'INSERT INTO settings (key, value) VALUES (?, ?)',
          [key, stringValue]
        );
      }
      
      console.log(`✅ Configuração salva: ${key} (${(valueSize / 1024).toFixed(2)} KB)`);
    } catch (error: any) {
      console.error('❌ Erro em SettingsService.set:', error.message);
      throw error; // Propaga o erro original
    }
  }

  async setMultiple(settings: Record<string, any>): Promise<void> {
    try {
      const keys = Object.keys(settings);
      console.log(`💾 Salvando ${keys.length} configurações...`);
      
      // Converter todos os valores para string primeiro
      const stringSettings: Record<string, string> = {};
      for (const [key, value] of Object.entries(settings)) {
        stringSettings[key] = typeof value === 'string' ? value : String(value);
      }
      
      // Validar tamanho total
      const totalSize = Object.values(stringSettings).reduce((acc, val) => 
        acc + Buffer.byteLength(val, 'utf8'), 0
      );
      
      const totalSizeMB = (totalSize / 1024 / 1024).toFixed(2);
      console.log(`📊 Tamanho total: ${totalSizeMB} MB`);
      
      if (totalSize > 10 * 1024 * 1024) {
        throw new Error(`Payload muito grande: ${totalSizeMB}MB (máximo: 10MB)`);
      }
      
      // Usar transação para garantir atomicidade
      await transaction(async () => {
        let saved = 0;
        for (const [key, value] of Object.entries(stringSettings)) {
          // Validação básica
          if (!key || key.trim() === '') {
            throw new Error('Chave da configuração não pode estar vazia');
          }
          
          const existing = await queryOne<Setting>('SELECT * FROM settings WHERE key = ?', [key]);

          if (existing) {
            await execute(
              `UPDATE settings SET value = ?, updated_at = datetime('now', 'localtime') WHERE key = ?`,
              [value, key]
            );
          } else {
            await execute(
              'INSERT INTO settings (key, value) VALUES (?, ?)',
              [key, value]
            );
          }
          
          saved++;
          
          // Log de progresso a cada 10 configurações
          if (saved % 10 === 0) {
            console.log(`📝 Progresso: ${saved}/${keys.length} configurações salvas`);
          }
        }
        
        console.log(`✅ ${saved} configurações salvas com sucesso`);
      });
    } catch (error: any) {
      console.error('❌ Erro em SettingsService.setMultiple:', error.message);
      throw error; // Propaga o erro original
    }
  }

  async delete(key: string): Promise<void> {
    try {
      console.log(`🗑️  Deletando configuração: ${key}`);
      await execute('DELETE FROM settings WHERE key = ?', [key]);
      console.log(`✅ Configuração deletada: ${key}`);
    } catch (error) {
      console.error('❌ Erro em SettingsService.delete:', error);
      throw new Error('Falha ao excluir configuração.');
    }
  }
}

export default new SettingsService();

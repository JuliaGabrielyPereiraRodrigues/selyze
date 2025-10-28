import archiver from 'archiver';
import fs from 'fs';
import path from 'path';
import { formatDateTime } from './date';

// ✅ CORRIGIDO: Caminhos consistentes com connection.ts
const DATA_DIR = path.resolve(__dirname, '../../data');
const BACKUP_DIR = path.join(DATA_DIR, 'backups');
const DB_PATH = path.join(DATA_DIR, 'database.db');
const UPLOADS_DIR = path.resolve(__dirname, '../../uploads');

export async function createBackup(): Promise<string> {
  console.log('📦 Iniciando processo de backup...');
  
  const timestamp = formatDateTime(new Date()).replace(/[:.]/g, '-').replace(/T/g, '_');
  const backupFileName = `backup-${timestamp}.zip`;
  const backupPath = path.join(BACKUP_DIR, backupFileName);
  
  // Criar diretório de backups se não existir
  if (!fs.existsSync(BACKUP_DIR)) {
    console.log('📁 Criando diretório de backups...');
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
  
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(backupPath);
    const archive = archiver('zip', { 
      zlib: { level: 9 } // Máxima compressão
    });
    
    let totalBytes = 0;
    
    // Eventos de progresso
    archive.on('progress', (progress) => {
      totalBytes = progress.fs.processedBytes;
      const mbProcessed = (totalBytes / 1024 / 1024).toFixed(2);
      console.log(`📦 Backup em progresso: ${mbProcessed} MB processados`);
    });
    
    output.on('close', () => {
      const finalSize = (archive.pointer() / 1024 / 1024).toFixed(2);
      console.log(`✅ Backup concluído: ${backupFileName} (${finalSize} MB)`);
      resolve(backupPath);
    });
    
    output.on('error', (err) => {
      console.error('❌ Erro no output stream:', err);
      reject(err);
    });
    
    archive.on('error', (err) => {
      console.error('❌ Erro no archiver:', err);
      reject(err);
    });
    
    archive.on('warning', (err) => {
      if (err.code === 'ENOENT') {
        console.warn('⚠️ Arquivo não encontrado durante backup:', err);
      } else {
        console.error('❌ Warning no backup:', err);
        reject(err);
      }
    });
    
    archive.pipe(output);
    
    try {
      // Adicionar banco de dados
      if (fs.existsSync(DB_PATH)) {
        const dbSize = (fs.statSync(DB_PATH).size / 1024 / 1024).toFixed(2);
        console.log(`📊 Adicionando banco de dados (${dbSize} MB)...`);
        archive.file(DB_PATH, { name: 'database.db' }); // ✅ Nome correto
      } else {
        console.warn('⚠️ Banco de dados não encontrado:', DB_PATH);
      }
      
      // Adicionar diretório de uploads se existir
      if (fs.existsSync(UPLOADS_DIR)) {
        const files = fs.readdirSync(UPLOADS_DIR);
        console.log(`📂 Adicionando ${files.length} arquivo(s) de uploads...`);
        archive.directory(UPLOADS_DIR, 'uploads');
      } else {
        console.warn('⚠️ Diretório de uploads não encontrado:', UPLOADS_DIR);
      }
      
      // Finalizar arquivo
      console.log('📄 Finalizando backup...');
      archive.finalize();
      
    } catch (error) {
      console.error('❌ Erro ao preparar backup:', error);
      reject(error);
    }
  });
}

export function listBackups(): string[] {
  if (!fs.existsSync(BACKUP_DIR)) {
    console.log('📁 Diretório de backups não existe');
    return [];
  }
  
  const backups = fs.readdirSync(BACKUP_DIR)
    .filter(file => file.endsWith('.zip'))
    .sort()
    .reverse(); // Mais recentes primeiro
  
  console.log(`📋 ${backups.length} backup(s) encontrado(s)`);
  return backups;
}

export function getBackupPath(filename: string): string {
  return path.join(BACKUP_DIR, filename);
}

export function deleteBackup(filename: string): void {
  const backupPath = getBackupPath(filename);
  if (fs.existsSync(backupPath)) {
    fs.unlinkSync(backupPath);
    console.log(`🗑️ Backup deletado: ${filename}`);
  } else {
    console.warn(`⚠️ Backup não encontrado para deletar: ${filename}`);
  }
}

export function getBackupSize(filename: string): number {
  const backupPath = getBackupPath(filename);
  if (fs.existsSync(backupPath)) {
    return fs.statSync(backupPath).size;
  }
  return 0;
}

export function getBackupInfo(filename: string): { size: number; date: Date } | null {
  const backupPath = getBackupPath(filename);
  if (fs.existsSync(backupPath)) {
    const stats = fs.statSync(backupPath);
    return {
      size: stats.size,
      date: stats.mtime
    };
  }
  return null;
}
// src/server.ts
import 'dotenv/config';
import http from 'http';
import app from './app';
import { initDatabase, closeDatabase } from './db/connection';

const PORT = Number(process.env.PORT) > 0 ? Number(process.env.PORT) : 3333;
const server = http.createServer(app);

// Banner simples
function logBanner() {
  console.log('\n ========================================');
  console.log('   PDV Marmitaria Backend');
  console.log(`   Servidor rodando em http://localhost:${PORT}`);
  console.log(`   Ambiente: ${process.env.NODE_ENV || 'development'}`);
  console.log('========================================\n');
}

async function start() {
  try {
    await initDatabase();
    console.log('✅ Banco de dados inicializado');

    server.listen(PORT, () => {
      logBanner();
    });
  } catch (err) {
    console.error('❌ Erro ao inicializar banco de dados:', err);
    process.exit(1);
  }
}

start();

// ===== Tratamento de erros do servidor (porta em uso, permissão, etc.) =====
server.on('error', (err: NodeJS.ErrnoException) => {
  if (err.code === 'EADDRINUSE') {
    console.error(` Porta ${PORT} já está em uso.`);
  } else if (err.code === 'EACCES') {
    console.error(` Sem permissão para usar a porta ${PORT}.`);
  } else {
    console.error(' Erro ao iniciar o servidor:', err);
  }
  process.exit(1);
});

// ===== Shutdown gracioso =====
let isShuttingDown = false;

async function shutdown(reason: string, code = 0) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.warn(`\n[Shutdown] Motivo: ${reason}`);

  // Fecha novas conexões e aguarda as ativas finalizarem
  await new Promise<void>((resolve) => {
    server.close(() => {
      console.log('[Shutdown] Servidor HTTP encerrado.');
      resolve();
    });
    // Timeout de segurança (10s)
    setTimeout(() => {
      console.warn('[Shutdown] Timeout ao encerrar servidor. Forçando continuação.');
      resolve();
    }, 10_000);
  });

  try {
    await closeDatabase?.();
    console.log('[Shutdown] Conexão com DB encerrada.');
  } catch (e) {
    console.warn('[Shutdown] Erro ao fechar DB:', e);
  }

  process.exit(code);
}

// Sinais do SO (Docker/PM2/CTRL+C)
process.on('SIGTERM', () => shutdown('SIGTERM', 0));
process.on('SIGINT', () => shutdown('SIGINT', 0));

// Falhas não tratadas -> desligar graciosamente (evita estado inconsistente)
process.on('uncaughtException', (error) => {
  console.error(' [uncaughtException]', error);
  void shutdown('uncaughtException', 1);
});

process.on('unhandledRejection', (reason) => {
  console.error(' [unhandledRejection]', reason);
  void shutdown('unhandledRejection', 1);
});

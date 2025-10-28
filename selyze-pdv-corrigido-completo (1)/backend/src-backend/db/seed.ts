// src/db/seed.ts
import bcrypt from 'bcryptjs';
import { initDatabase } from './connection';

async function seed() {
  console.log('🌱 Iniciando seed do banco de dados...');
  const db = await initDatabase();

  // ====== Usuários iniciais ======
  const users = [
    {
      username: 'admin',
      password: 'admin123',
      name: 'Administrador',
      role: 'admin',
      security_question: 'Qual o nome da sua primeira marmitaria?',
      security_answer_plain: 'primeira',
    },
    {
      username: 'gerente',
      password: 'gerente123',
      name: 'Gerente',
      role: 'gerente',
      security_question: 'Qual a sua cidade natal?',
      security_answer_plain: 'brasilia',
    },
    {
      username: 'caixa',
      password: 'caixa123',
      name: 'Caixa',
      role: 'caixa',
      security_question: 'Qual o seu animal favorito?',
      security_answer_plain: 'gato',
    },
  ] as const;

  for (const u of users) {
    const hash = await bcrypt.hash(u.password, 10);
    const answerHash = await bcrypt.hash(u.security_answer_plain, 10);

    await db.run(
      `INSERT OR IGNORE INTO users
        (username, password, name, role, security_question, security_answer, first_login, must_change_password, active)
       VALUES (?, ?, ?, ?, ?, ?, 1, 0, 1)`,
      [u.username, hash, u.name, u.role, u.security_question, answerHash]
    );
  }
  console.log('✅ Usuários base criados');

  // ====== Produtos de exemplo ======
  const products = [
    {
      name: 'Marmita P',
      description: 'Arroz, feijão, bife, salada (pequena)',
      price: 18.9,
      category: 'marmita',
      type: 'unitario',
      stock: 50,
      min_stock: 10,
      active: 1,
    },
    {
      name: 'Marmita M',
      description: 'Arroz, feijão, frango grelhado, salada (média)',
      price: 22.9,
      category: 'marmita',
      type: 'unitario',
      stock: 60,
      min_stock: 10,
      active: 1,
    },
    {
      name: 'Marmita G',
      description: 'Arroz, feijão, picanha, salada (grande)',
      price: 29.9,
      category: 'marmita',
      type: 'unitario',
      stock: 40,
      min_stock: 10,
      active: 1,
    },
    {
      name: 'Refrigerante Lata',
      description: '350ml',
      price: 6.0,
      category: 'bebida',
      type: 'unitario',
      stock: 100,
      min_stock: 20,
      active: 1,
    },
    {
      name: 'Pudim',
      description: 'Fatia de pudim de leite',
      price: 7.5,
      category: 'sobremesa',
      type: 'unitario',
      stock: 30,
      min_stock: 5,
      active: 1,
    },
  ];

  for (const p of products) {
    await db.run(
      `INSERT OR IGNORE INTO products
        (name, description, price, category, type, stock, min_stock, active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [p.name, p.description, p.price, p.category, p.type, p.stock, p.min_stock, p.active]
    );
  }
  console.log('✅ Produtos de exemplo criados');

  console.log('\n📊 Seed concluído com sucesso!');
  console.log('\n🔐 Credenciais de acesso:');
  console.log('   Admin:   username=admin   password=admin123');
  console.log('   Gerente: username=gerente password=gerente123');
  console.log('   Caixa:   username=caixa   password=caixa123');
  console.log('\n⚠️  IMPORTANTE: Altere as senhas no primeiro login!\n');
}

seed().catch((err) => {
  console.error('❌ Erro no seed:', err);
  process.exit(1);
});


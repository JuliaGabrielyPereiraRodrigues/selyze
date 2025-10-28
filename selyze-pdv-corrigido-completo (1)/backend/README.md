# 🍱 PDV Marmitaria - Backend

Sistema PDV completo e robusto para marmitarias, desenvolvido com Node.js, Express, TypeScript e SQLite.

## 📋 Índice

- [Características](#características)
- [Tecnologias](#tecnologias)
- [Instalação](#instalação)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [API Endpoints](#api-endpoints)
- [Banco de Dados](#banco-de-dados)
- [Autenticação](#autenticação)
- [Funcionalidades](#funcionalidades)

## ✨ Características

- ✅ **API RESTful** completa e bem documentada
- ✅ **Autenticação JWT** com diferentes níveis de acesso
- ✅ **Banco SQLite** embutido (offline-first)
- ✅ **Sistema de PDV** com múltiplas formas de pagamento
- ✅ **Controle de estoque** para produtos unitários
- ✅ **Gestão de caixa** (abertura, vendas, despesas, fechamento)
- ✅ **Relatórios** diários, semanais e mensais
- ✅ **Logs de auditoria** de todas as ações sensíveis
- ✅ **Notificações** automáticas (estoque baixo, caixa aberto, etc)
- ✅ **Sistema de backup** automático e manual
- ✅ **Geração de PDFs** (comprovantes e relatórios)
- ✅ **Cálculo automático de taxas** (iFood 12% + 3.2%)

## 🛠 Tecnologias

- **Node.js** 18+
- **TypeScript** 5.3
- **Express** 4.18
- **SQLite** (better-sqlite3)
- **JWT** para autenticação
- **bcryptjs** para hash de senhas
- **PDFKit** para geração de PDFs
- **Archiver** para backups em ZIP

## 🚀 Instalação

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar variáveis de ambiente

Copie o arquivo `.env.example` para `.env`:

```bash
cp .env.example .env
```

Edite o arquivo `.env` se necessário:

```env
PORT=3000
JWT_SECRET=seu_segredo_super_secreto_aqui
NODE_ENV=development
DATABASE_PATH=../data/pdv.sqlite
UPLOADS_PATH=../data/uploads
BACKUPS_PATH=../data/backups
```

### 3. Popular o banco com dados iniciais

```bash
npm run seed
```

Isso criará:
- Usuários de exemplo (admin, gerente, caixa)
- Produtos de exemplo (marmitas, bebidas, sobremesas)
- Configurações padrão do sistema

### 4. Iniciar o servidor

**Desenvolvimento (com hot reload):**
```bash
npm run dev
```

**Produção:**
```bash
npm run build
npm start
```

O servidor estará rodando em `http://localhost:3000`

## 📁 Estrutura do Projeto

```
src/
├── app.ts                 # Configuração do Express
├── server.ts              # Inicialização do servidor
│
├── db/
│   ├── connection.ts      # Conexão com SQLite
│   ├── schema.sql         # Schema do banco de dados
│   └── seed.ts            # Dados iniciais
│
├── types/
│   └── index.ts           # Tipos TypeScript
│
├── utils/
│   ├── jwt.ts             # Geração e validação de tokens
│   ├── pdf.ts             # Geração de PDFs
│   ├── date.ts            # Utilitários de data
│   └── backup.ts          # Sistema de backup
│
├── middleware/
│   ├── auth.ts            # Autenticação e autorização
│   ├── errorHandler.ts    # Tratamento de erros
│   └── audit.ts           # Logs de auditoria
│
├── services/              # Lógica de negócio
│   ├── auth.service.ts
│   ├── users.service.ts
│   ├── products.service.ts
│   ├── cash.service.ts
│   ├── sales.service.ts
│   ├── expenses.service.ts
│   ├── reports.service.ts
│   ├── notifications.service.ts
│   ├── settings.service.ts
│   └── logs.service.ts
│
├── controllers/           # Controladores da API
│   ├── auth.controller.ts
│   └── index.ts           # Todos os outros controllers
│
└── routes/
    └── index.ts           # Rotas da API
```

## 🔑 Autenticação

O sistema usa **JWT (JSON Web Tokens)** para autenticação.

### Níveis de Acesso

1. **Caixa** - Acesso básico ao PDV
   - Abrir/fechar próprio caixa
   - Registrar vendas
   - Lançar despesas simples
   - Ver estoque

2. **Gerente** - Acesso intermediário
   - Tudo do Caixa +
   - Gerenciar produtos unitários
   - Ver e fechar qualquer caixa
   - Acessar relatórios
   - Cancelar vendas

3. **Admin** - Acesso total
   - Tudo do Gerente +
   - Gerenciar usuários
   - Acessar logs de auditoria
   - Fazer backup/restore
   - Configurações do sistema

### Usuários Padrão

Após executar `npm run seed`:

```
Admin:
- username: admin
- password: admin123

Gerente:
- username: gerente
- password: gerente123

Caixa:
- username: caixa
- password: caixa123
```

⚠️ **IMPORTANTE:** Altere as senhas no primeiro login!

## 📡 API Endpoints

### Autenticação

```
POST   /api/auth/login                  # Login
POST   /api/auth/change-password        # Alterar senha
POST   /api/auth/recover-password       # Recuperar senha
GET    /api/auth/verify-first-login     # Verificar primeiro login
```

### Usuários (Admin apenas)

```
GET    /api/users                       # Listar usuários
GET    /api/users/:id                   # Buscar usuário
POST   /api/users                       # Criar usuário
PUT    /api/users/:id                   # Atualizar usuário
DELETE /api/users/:id                   # Desativar usuário
```

### Produtos

```
GET    /api/products                    # Listar produtos
GET    /api/products/:id                # Buscar produto
GET    /api/products/category/:cat      # Produtos por categoria
GET    /api/products/low-stock          # Produtos com estoque baixo
POST   /api/products                    # Criar produto (Gerente+)
PUT    /api/products/:id                # Atualizar produto (Gerente+)
DELETE /api/products/:id                # Desativar produto (Gerente+)
```

### Caixa

```
POST   /api/cash/open                   # Abrir caixa
GET    /api/cash/open                   # Buscar caixa aberto
GET    /api/cash/:id/summary            # Resumo do caixa
POST   /api/cash/:id/close              # Fechar caixa
GET    /api/cash/history                # Histórico de caixas (Gerente+)
```

### Vendas

```
POST   /api/sales                       # Criar venda
GET    /api/sales/:id                   # Buscar venda
GET    /api/sales/:id/receipt           # Comprovante PDF
GET    /api/sales/cash-session/:id      # Vendas por caixa
GET    /api/sales/date-range            # Vendas por período
POST   /api/sales/:id/cancel            # Cancelar venda (Gerente+)
```

### Despesas

```
POST   /api/expenses                    # Criar despesa
GET    /api/expenses/cash-session/:id   # Despesas por caixa
GET    /api/expenses/date-range         # Despesas por período
DELETE /api/expenses/:id                # Excluir despesa (Gerente+)
```

### Relatórios

```
GET    /api/reports/daily               # Relatório diário
GET    /api/reports/weekly              # Relatório semanal
GET    /api/reports/monthly             # Relatório mensal
```

### Notificações

```
GET    /api/notifications               # Listar notificações
PUT    /api/notifications/:id/read      # Marcar como lida
PUT    /api/notifications/read-all      # Marcar todas como lidas
DELETE /api/notifications/:id           # Excluir notificação
```

### Configurações (Admin apenas)

```
GET    /api/settings                    # Todas as configurações
GET    /api/settings/:key               # Buscar configuração
POST   /api/settings                    # Salvar configuração
POST   /api/settings/multiple           # Salvar múltiplas
```

### Logs (Admin apenas)

```
GET    /api/logs                        # Todos os logs
GET    /api/logs/user/:userId           # Logs por usuário
GET    /api/logs/date-range             # Logs por período
```

### Backup (Admin apenas)

```
POST   /api/backup                      # Criar backup
GET    /api/backup                      # Listar backups
```

### Health Check

```
GET    /api/health                      # Status do servidor
```

## 💾 Banco de Dados

### Schema Principal

**users** - Usuários do sistema
- Autenticação e autorização
- Pergunta de segurança para recuperação
- Controle de primeiro login

**products** - Produtos/Marmitas
- Genéricos (sem estoque) vs Unitários (com estoque)
- Categorias: marmita, bebida, sobremesa, adicional
- Controle de estoque mínimo

**cash_sessions** - Sessões de caixa
- Abertura e fechamento
- Saldo inicial e final
- Status: aberto/fechado

**sales** - Vendas realizadas
- Itens, descontos, pagamentos
- Suporte a múltiplas formas de pagamento
- Cálculo automático de taxas iFood
- Status: concluída/cancelada

**sale_items** - Itens das vendas
- Produtos vendidos
- Quantidade e subtotal

**expenses** - Despesas e movimentações
- Tipos: despesa, sangria, suprimento
- Vinculadas à sessão de caixa

**settings** - Configurações do sistema
- Dados da loja
- Taxas iFood
- Preferências

**audit_logs** - Logs de auditoria
- Todas as ações sensíveis
- Valores antigos e novos
- IP e user-agent

**notifications** - Notificações
- Estoque baixo, backup pendente, etc
- Status lido/não lido

## 🔄 Funcionalidades Principais

### 1. Sistema de PDV Completo

```typescript
// Criar uma venda
POST /api/sales
{
  "cash_session_id": 1,
  "customer_name": "João Silva",
  "customer_phone": "(61) 99999-9999",
  "items": [
    {
      "product_id": 1,
      "product_name": "Marmita G",
      "product_price": 25.00,
      "quantity": 2
    }
  ],
  "discount": 10,
  "discount_type": "percent",
  "payments": [
    { "method": "dinheiro", "amount": 30.00 },
    { "method": "pix", "amount": 15.00 }
  ]
}
```

### 2. Controle de Caixa

```typescript
// Abrir caixa
POST /api/cash/open
{ "opening_balance": 100.00 }

// Fechar caixa (gera PDF automático)
POST /api/cash/1/close
{ "closing_balance": 500.00 }
```

### 3. Cálculo Automático de Taxas iFood

- **Comissão:** 12% sobre o valor
- **Taxa de pagamento:** 3.2% sobre o valor
- **Mensalidade:** R$ 110 (configurável)

### 4. Relatórios

```typescript
// Relatório diário
GET /api/reports/daily?date=2025-10-22

// Resposta:
{
  "date": "2025-10-22",
  "sales_count": 45,
  "sales_total": 1250.00,
  "expenses_total": 200.00,
  "net_profit": 1050.00,
  "payment_methods": [...],
  "top_products": [...]
}
```

### 5. Notificações Automáticas

- **Estoque baixo:** Quando produto atinge estoque mínimo
- **Caixa aberto:** Após 10h de caixa aberto
- **Backup pendente:** Lembrete de backup
- **Venda cancelada:** Notifica gerentes

### 6. Sistema de Backup

```typescript
// Criar backup manual
POST /api/backup

// Retorna ZIP com:
// - Banco de dados SQLite
// - Diretório de uploads (imagens)
```

## 🔒 Segurança

- ✅ Senhas criptografadas com bcrypt
- ✅ Tokens JWT com expiração
- ✅ Validação de permissões em todas as rotas
- ✅ Logs de auditoria de ações sensíveis
- ✅ SQL injection protection (prepared statements)
- ✅ CORS configurável
- ✅ Rate limiting recomendado para produção

## 📊 Performance

- ✅ SQLite com WAL mode para melhor concorrência
- ✅ Índices em todas as queries importantes
- ✅ Prepared statements para queries repetidas
- ✅ Transações para operações complexas

## 🐛 Debug

Ative logs detalhados:

```env
NODE_ENV=development
```

Isso mostrará:
- Todas as queries SQL executadas
- Requisições HTTP
- Erros com stack trace completo

## 📝 TODO / Melhorias Futuras

- [ ] Testes automatizados (Jest)
- [ ] Rate limiting
- [ ] Upload de imagens de produtos
- [ ] WebSocket para notificações em tempo real
- [ ] Exportação de relatórios em Excel
- [ ] Dashboard analytics
- [ ] Integração com impressora não fiscal
- [ ] Multi-loja

## 🤝 Contribuindo

Este é um projeto privado, mas sugestões são bem-vindas!

## 📄 Licença

Proprietário - Todos os direitos reservados

---

**Desenvolvido com ❤️ para marmitarias**

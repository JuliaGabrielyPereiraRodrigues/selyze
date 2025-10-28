-- ========================================
-- SCHEMA COMPLETO DO PDV MARMITARIA (FINAL ATUALIZADO)
-- ========================================

-- Tabela de Usuários
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  temp_password TEXT, -- senha temporária definida pelo admin
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  role TEXT NOT NULL CHECK(role IN ('admin', 'gerente', 'caixa')),
  security_question TEXT,
  security_answer TEXT,
  must_change_password INTEGER DEFAULT 0, -- 1 = precisa trocar senha no próximo login
  first_login INTEGER DEFAULT 1,
  active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now', 'localtime')),
  updated_at TEXT DEFAULT (datetime('now', 'localtime'))
);

-- Tabela de Produtos
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  price REAL NOT NULL,
  category TEXT NOT NULL CHECK(category IN ('marmita', 'bebida', 'sobremesa', 'adicional', 'generico')),
  type TEXT NOT NULL CHECK(type IN ('generico', 'unitario')),
  stock INTEGER DEFAULT 0,
  min_stock INTEGER DEFAULT 0,
  image TEXT,
  active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now', 'localtime')),
  updated_at TEXT DEFAULT (datetime('now', 'localtime'))
);

-- Tabela de Sessões de Caixa
CREATE TABLE IF NOT EXISTS cash_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  opening_balance REAL NOT NULL DEFAULT 0,
  closing_balance REAL,
  opened_at TEXT DEFAULT (datetime('now', 'localtime')),
  closed_at TEXT,
  status TEXT NOT NULL CHECK(status IN ('aberto', 'fechado')) DEFAULT 'aberto',
  -- 🔹 Coluna compatível com código legado
  aberto AS (CASE WHEN status = 'aberto' THEN 1 ELSE 0 END) STORED,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Tabela de Vendas
CREATE TABLE IF NOT EXISTS sales (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cash_session_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  customer_name TEXT,
  customer_phone TEXT,
  subtotal REAL NOT NULL,
  discount REAL DEFAULT 0,
  discount_type TEXT CHECK(discount_type IN ('percent', 'fixed')),
  total REAL NOT NULL,
  payment_method TEXT NOT NULL,
  payment_details TEXT,
  change_amount REAL DEFAULT 0,
  ifood_commission REAL DEFAULT 0,
  ifood_payment_fee REAL DEFAULT 0,
  status TEXT NOT NULL CHECK(status IN ('concluida', 'cancelada')) DEFAULT 'concluida',
  cancelled_reason TEXT,
  cancelled_at TEXT,
  created_at TEXT DEFAULT (datetime('now', 'localtime')),
  -- 🔹 Coluna compatível com código legado
  concluida AS (CASE WHEN status = 'concluida' THEN 1 ELSE 0 END) STORED,
  FOREIGN KEY (cash_session_id) REFERENCES cash_sessions(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Tabela de Itens da Venda
CREATE TABLE IF NOT EXISTS sale_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sale_id INTEGER NOT NULL,
  product_id INTEGER,
  product_name TEXT NOT NULL,
  product_price REAL NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  subtotal REAL NOT NULL,
  FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Tabela de Despesas (cash_session_id opcional)
CREATE TABLE IF NOT EXISTS expenses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cash_session_id INTEGER,
  user_id INTEGER NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('despesa', 'sangria', 'suprimento')),
  description TEXT NOT NULL,
  amount REAL NOT NULL,
  category TEXT,
  attachment TEXT,
  expense_date TEXT DEFAULT (date('now', 'localtime')),
  created_at TEXT DEFAULT (datetime('now', 'localtime')),
  FOREIGN KEY (cash_session_id) REFERENCES cash_sessions(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Tabela de Configurações
CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  updated_at TEXT DEFAULT (datetime('now', 'localtime'))
);

-- Tabela de Logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id INTEGER,
  old_values TEXT,
  new_values TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TEXT DEFAULT (datetime('now', 'localtime')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Tabela de Notificações
CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  type TEXT NOT NULL CHECK(type IN ('estoque_baixo', 'backup_pendente', 'venda_cancelada', 'caixa_aberto', 'sistema')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now', 'localtime')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- ========================================
-- ÍNDICES
-- ========================================

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_cash_sessions_status ON cash_sessions(status);
CREATE INDEX IF NOT EXISTS idx_sales_status ON sales(status);
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(active);
CREATE INDEX IF NOT EXISTS idx_products_stock ON products(stock);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- ========================================
-- CONFIGURAÇÕES PADRÃO
-- ========================================

INSERT OR IGNORE INTO settings (key, value) VALUES 
  ('store_name', 'Marmitaria do Zé'),
  ('store_cnpj', ''),
  ('store_phone', ''),
  ('store_address', ''),
  ('store_logo', ''),
  ('theme', 'dark'),
  ('printer_name', ''),
  ('ifood_commission', '12'),
  ('ifood_payment_fee', '3.2'),
  ('ifood_monthly_fee', '110'),
  ('max_discount_without_auth', '10'),
  ('backup_auto_enabled', '1'),
  ('backup_auto_time', '23:00'),
  ('notification_low_stock', '1'),
  ('notification_backup_pending', '1'),
  ('notification_cash_open_hours', '10');

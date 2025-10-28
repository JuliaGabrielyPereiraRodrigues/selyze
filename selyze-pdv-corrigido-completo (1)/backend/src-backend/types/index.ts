// Tipos de Usuário
export type UserRole = 'admin' | 'gerente' | 'caixa';

export interface User {
  id: number;
  username: string;
  password: string;
  name: string;
  email?: string;
  role: UserRole;
  security_question?: string;
  security_answer?: string;
  first_login: number;
  active: number;
  created_at: string;
  updated_at: string;
}

export interface UserResponse extends Omit<User, 'password' | 'security_answer'> {}

// Tipos de Produto
export type ProductCategory = 'marmita' | 'bebida' | 'sobremesa' | 'adicional' | 'generico';
export type ProductType = 'generico' | 'unitario';

export interface Product {
  id: number;
  name: string;
  description?: string;
  price: number;
  category: ProductCategory;
  type: ProductType;
  stock: number;
  min_stock: number;
  image?: string;
  active: number;
  created_at: string;
  updated_at: string;
}

// Tipos de Caixa
export type CashSessionStatus = 'aberto' | 'fechado';

export interface CashSession {
  id: number;
  user_id: number;
  opening_balance: number;
  closing_balance?: number;
  opened_at: string;
  closed_at?: string;
  status: CashSessionStatus;
}

// Tipos de Venda
export type SaleStatus = 'concluida' | 'cancelada';
export type PaymentMethod = 'dinheiro' | 'cartao' | 'pix' | 'ifood' | 'multiplo';
export type DiscountType = 'percent' | 'fixed';

export interface PaymentDetail {
  method: PaymentMethod;
  amount: number;
}

export interface Sale {
  id: number;
  cash_session_id: number;
  user_id: number;
  customer_name?: string;
  customer_phone?: string;
  subtotal: number;
  discount: number;
  discount_type?: DiscountType;
  total: number;
  payment_method: PaymentMethod;
  payment_details?: string; // JSON
  change_amount: number;
  ifood_commission: number;
  ifood_payment_fee: number;
  status: SaleStatus;
  cancelled_reason?: string;
  cancelled_at?: string;
  created_at: string;
}

export interface SaleItem {
  id: number;
  sale_id: number;
  product_id?: number;
  product_name: string;
  product_price: number;
  quantity: number;
  subtotal: number;
}

export interface SaleWithItems extends Sale {
  items: SaleItem[];
}

// Tipos de Despesa
export type ExpenseType = 'despesa' | 'sangria' | 'suprimento';

export interface Expense {
  id: number;
  cash_session_id: number;
  user_id: number;
  type: ExpenseType;
  description: string;
  amount: number;
  category?: string;
  attachment?: string;
  expense_date?: string;
  created_at: string;
}

// Tipos de Configuração
export interface Setting {
  id: number;
  key: string;
  value: string;
  updated_at: string;
}

// Tipos de Log de Auditoria
export interface AuditLog {
  id: number;
  user_id?: number;
  action: string;
  entity_type: string;
  entity_id?: number;
  old_values?: string;
  new_values?: string;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

// Tipos de Notificação
export type NotificationType = 'estoque_baixo' | 'backup_pendente' | 'venda_cancelada' | 'caixa_aberto' | 'sistema';

export interface Notification {
  id: number;
  user_id?: number;
  type: NotificationType;
  title: string;
  message: string;
  read: number;
  created_at: string;
}

// Tipos de Request
export interface AuthRequest {
  username: string;
  password: string;
}

export interface ChangePasswordRequest {
  old_password: string;
  new_password: string;
}

export interface RecoverPasswordRequest {
  username: string;
  security_answer: string;
  new_password: string;
}

export interface CreateUserRequest {
  username: string;
  password: string;
  name: string;
  email?: string;
  role: UserRole;
  security_question: string;
  security_answer: string;
}

export interface OpenCashRequest {
  opening_balance: number;
}

export interface CreateSaleRequest {
  customer_name?: string;
  customer_phone?: string;
  items: {
    product_id?: number;
    product_name: string;
    product_price: number;
    quantity: number;
  }[];
  discount?: number;
  discount_type?: DiscountType;
  payments: PaymentDetail[];
}

export interface CreateExpenseRequest {
  type: ExpenseType;
  description: string;
  amount: number;
  category?: string;
  expense_date?: string;
}

// Tipos de Response
export interface AuthResponse {
  token: string;
  user: UserResponse;
}

export interface CashSummary {
  session: CashSession;
  sales_count: number;
  sales_total: number;
  expenses_total: number;
  sangrias_total: number;
  suprimentos_total: number;
  discount_total: number;
  ifood_commission_total: number;
  ifood_payment_fee_total: number;
  payment_methods: {
    method: PaymentMethod;
    total: number;
  }[];
  net_profit: number;
  expected_balance: number;
}

export interface DailyReport {
  date: string;
  sales_count: number;
  sales_total: number;
  expenses_total: number;
  net_profit: number;
  payment_methods: {
    method: PaymentMethod;
    total: number;
  }[];
  top_products: {
    product_name: string;
    quantity: number;
    total: number;
  }[];
}

// Tipo de erro customizado
export interface ApiError {
  message: string;
  code?: string;
  details?: any;
}

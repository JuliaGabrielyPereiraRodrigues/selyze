// Tipos do sistema PDV

export type UserRole = 'admin' | 'gerente' | 'caixa';

export interface User {
  id: number;
  username: string;
  name: string;
  email?: string;
  role: UserRole;
  security_question?: string;
  first_login: number;
  active: number;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface Product {
  id: number;
  name: string;
  description?: string;
  price: number;
  category: 'marmita' | 'bebida' | 'sobremesa' | 'adicional' | 'generico';
  type: 'generico' | 'unitario';
  stock: number;
  min_stock: number;
  image?: string;
  active: number;
  created_at: string;
  updated_at: string;
}

export interface CashSession {
  id: number;
  user_id: number;
  opening_balance: number;
  closing_balance?: number;
  opened_at: string;
  closed_at?: string;
  status: 'aberto' | 'fechado';
}

export interface SaleItem {
  product_id?: number;
  product_name: string;
  product_price: number;
  quantity: number;
}

export interface PaymentDetail {
  method: 'dinheiro' | 'cartao' | 'pix' | 'ifood';
  amount: number;
}

export interface CreateSaleRequest {
  customer_name?: string;
  customer_phone?: string;
  items: SaleItem[];
  discount?: number;
  discount_type?: 'percent' | 'fixed';
  payments: PaymentDetail[];
}

export interface Sale {
  id: number;
  cash_session_id: number;
  user_id: number;
  customer_name?: string;
  customer_phone?: string;
  subtotal: number;
  discount: number;
  discount_type?: 'percent' | 'fixed';
  total: number;
  payment_method: string;
  payment_details?: string;
  change_amount: number;
  ifood_commission: number;
  ifood_payment_fee: number;
  status: 'concluida' | 'cancelada';
  cancelled_reason?: string;
  cancelled_at?: string;
  created_at: string;
}

export interface SaleWithItems extends Sale {
  items: {
    id: number;
    sale_id: number;
    product_id?: number;
    product_name: string;
    product_price: number;
    quantity: number;
    subtotal: number;
  }[];
}

export interface Expense {
  id: number;
  cash_session_id: number;
  user_id: number;
  type: 'despesa' | 'sangria' | 'suprimento';
  description: string;
  amount: number;
  category?: string;
  attachment?: string;
  expense_date?: string;
  created_at: string;
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
  payment_methods: Array<{
    method: string;
    total: number;
  }>;
  net_profit: number;
  expected_balance: number;
}

export interface DailyReport {
  date: string;
  sales_count: number;
  sales_total: number;
  expenses_total: number;
  net_profit: number;
  payment_methods: Array<{
    payment_method: string;
    total: number;
  }>;
  top_products: Array<{
    product_name: string;
    quantity: number;
    total: number;
  }>;
}

export interface Notification {
  id: number;
  user_id?: number;
  type: 'estoque_baixo' | 'backup_pendente' | 'venda_cancelada' | 'caixa_aberto' | 'sistema';
  title: string;
  message: string;
  read: number;
  created_at: string;
}

export interface Settings {
  [key: string]: string;
}

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

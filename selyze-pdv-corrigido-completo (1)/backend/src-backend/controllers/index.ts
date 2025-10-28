import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import userService from '../services/users.service';
import productService from '../services/products.service';
import cashService from '../services/cash.service';
import saleService from '../services/sales.service';
import expenseService from '../services/expenses.service';
import reportService from '../services/reports.service';
import notificationService from '../services/notifications.service';
import settingsService from '../services/settings.service';
import logsService from '../services/logs.service';
import { generateSaleReceiptPDF, generateCashClosingPDF } from '../utils/pdf';
import { createBackup, listBackups } from '../utils/backup';

// ===== USERS CONTROLLER =====
export class UsersController {
  async findAll(req: AuthRequest, res: Response): Promise<void> {
    try {
      const users = await userService.findAll();
      res.json(users);
      return;
    } catch (error: any) {
      res.status(500).json({ message: error.message });
      return;
    }
  }

  async findById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const user = await userService.findById(parseInt(req.params.id));
      if (!user) {
        res.status(404).json({ message: 'Usuário não encontrado' });
        return;
      }
      res.json(user);
      return;
    } catch (error: any) {
      res.status(500).json({ message: error.message });
      return;
    }
  }

  async create(req: AuthRequest, res: Response): Promise<void> {
    try {
      const user = await userService.create(req.body);
      res.status(201).json(user);
      return;
    } catch (error: any) {
      res.status(400).json({ message: error.message });
      return;
    }
  }

  async update(req: AuthRequest, res: Response): Promise<void> {
    try {
      const user = await userService.update(parseInt(req.params.id), req.body);
      res.json(user);
      return;
    } catch (error: any) {
      res.status(400).json({ message: error.message });
      return;
    }
  }

  async delete(req: AuthRequest, res: Response): Promise<void> {
    try {
      await userService.delete(parseInt(req.params.id));
      res.json({ message: 'Usuário desativado com sucesso' });
      return;
    } catch (error: any) {
      res.status(400).json({ message: error.message });
      return;
    }
  }

  async resetPassword(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = parseInt(req.params.id);
      const newPassword = await userService.resetPassword(userId);
      res.json({ 
        message: 'Senha resetada com sucesso',
        temporary_password: newPassword
      });
      return;
    } catch (error: any) {
      res.status(400).json({ message: error.message });
      return;
    }
  }
}

// ===== PRODUCTS CONTROLLER =====
export class ProductsController {
  async findAll(req: AuthRequest, res: Response): Promise<void> {
    try {
      const activeOnly = req.query.active !== 'false';
      const products = await productService.findAll(activeOnly);
      res.json(products);
      return;
    } catch (error: any) {
      res.status(500).json({ message: error.message });
      return;
    }
  }

  async findById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const product = await productService.findById(parseInt(req.params.id));
      if (!product) {
        res.status(404).json({ message: 'Produto não encontrado' });
        return;
      }
      res.json(product);
      return;
    } catch (error: any) {
      res.status(500).json({ message: error.message });
      return;
    }
  }

  async findByCategory(req: AuthRequest, res: Response): Promise<void> {
    try {
      const products = await productService.findByCategory(req.params.category);
      res.json(products);
      return;
    } catch (error: any) {
      res.status(500).json({ message: error.message });
      return;
    }
  }

  async findLowStock(req: AuthRequest, res: Response): Promise<void> {
    try {
      const products = await productService.findLowStock();
      res.json(products);
      return;
    } catch (error: any) {
      res.status(500).json({ message: error.message });
      return;
    }
  }

  async create(req: AuthRequest, res: Response): Promise<void> {
    try {
      const product = await productService.create(req.body);
      res.status(201).json(product);
      return;
    } catch (error: any) {
      res.status(400).json({ message: error.message });
      return;
    }
  }

  async update(req: AuthRequest, res: Response): Promise<void> {
    try {
      const product = await productService.update(parseInt(req.params.id), req.body);
      
      if (product.type === 'unitario' && product.stock <= product.min_stock) {
        const notificationService = (await import('../services/notifications.service')).default;
        await notificationService.createLowStockNotification(product);
      }
      
      res.json(product);
      return;
    } catch (error: any) {
      res.status(400).json({ message: error.message });
      return;
    }
  }

  async delete(req: AuthRequest, res: Response): Promise<void> {
    try {
      await productService.delete(parseInt(req.params.id));
      res.json({ message: 'Produto desativado com sucesso' });
      return;
    } catch (error: any) {
      res.status(400).json({ message: error.message });
      return;
    }
  }
}

// ===== CASH CONTROLLER =====
export class CashController {
  async openCash(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ message: 'Usuário não autenticado' });
        return;
      }

      const { opening_balance } = req.body;
      const session = await cashService.openCash(req.user.userId, opening_balance);
      res.status(201).json(session);
      return;
    } catch (error: any) {
      res.status(400).json({ message: error.message });
      return;
    }
  }

  async getOpenCash(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ message: 'Usuário não autenticado' });
        return;
      }

      const session = await cashService.getOpenCash(req.user.userId);
      if (!session) {
        res.status(404).json({ message: 'Nenhum caixa aberto' });
        return;
      }

      res.json(session);
      return;
    } catch (error: any) {
      res.status(500).json({ message: error.message });
      return;
    }
  }

  async getCashSummary(req: AuthRequest, res: Response): Promise<void> {
    try {
      const summary = await cashService.getCashSummary(parseInt(req.params.id));
      res.json(summary);
      return;
    } catch (error: any) {
      res.status(500).json({ message: error.message });
      return;
    }
  }

  async closeCash(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { closing_balance } = req.body;
      const summary = await cashService.closeCash(parseInt(req.params.id), closing_balance);
      const pdf = await generateCashClosingPDF(summary);
      res.json({ summary, pdf: pdf.toString('base64') });
      return;
    } catch (error: any) {
      res.status(400).json({ message: error.message });
      return;
    }
  }

  async getCashHistory(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.query.user_id ? parseInt(req.query.user_id as string) : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const history = await cashService.getCashHistory(userId, limit);
      res.json(history);
      return;
    } catch (error: any) {
      res.status(500).json({ message: error.message });
      return;
    }
  }
}

// ===== SALES CONTROLLER =====
export class SalesController {
  async create(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ message: 'Usuário não autenticado' });
        return;
      }

      const { cash_session_id } = req.body;
      const sale = await saleService.create(cash_session_id, req.user.userId, req.body);
      const pdf = await generateSaleReceiptPDF(sale, sale.items);

      res.status(201).json({ sale, pdf: pdf.toString('base64') });
      return;
    } catch (error: any) {
      res.status(400).json({ message: error.message });
      return;
    }
  }

  async findById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const sale = await saleService.findById(parseInt(req.params.id));
      if (!sale) {
        res.status(404).json({ message: 'Venda não encontrada' });
        return;
      }

      res.json(sale);
      return;
    } catch (error: any) {
      res.status(500).json({ message: error.message });
      return;
    }
  }

  async findByCashSession(req: AuthRequest, res: Response): Promise<void> {
    try {
      const sales = await saleService.findByCashSession(parseInt(req.params.cashSessionId));
      res.json(sales);
      return;
    } catch (error: any) {
      res.status(500).json({ message: error.message });
      return;
    }
  }

  async findByDateRange(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { start_date, end_date } = req.query;
      if (!start_date || !end_date) {
        res.status(400).json({ message: 'Datas inicial e final são obrigatórias' });
        return;
      }

      const sales = await saleService.findByDateRange(start_date as string, end_date as string);
      res.json(sales);
      return;
    } catch (error: any) {
      res.status(500).json({ message: error.message });
      return;
    }
  }

  async cancel(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ message: 'Usuário não autenticado' });
        return;
      }

      const { reason } = req.body;
      if (!reason) {
        res.status(400).json({ message: 'Motivo do cancelamento é obrigatório' });
        return;
      }

      await saleService.cancel(parseInt(req.params.id), reason, req.user.userId);
      res.json({ message: 'Venda cancelada com sucesso' });
      return;
    } catch (error: any) {
      res.status(400).json({ message: error.message });
      return;
    }
  }

  async getReceipt(req: AuthRequest, res: Response): Promise<void> {
    try {
      const sale = await saleService.findById(parseInt(req.params.id));
      if (!sale) {
        res.status(404).json({ message: 'Venda não encontrada' });
        return;
      }

      const pdf = await generateSaleReceiptPDF(sale, sale.items);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=venda-${sale.id}.pdf`);
      res.send(pdf);
      return;
    } catch (error: any) {
      res.status(500).json({ message: error.message });
      return;
    }
  }
}

// ===== EXPENSES CONTROLLER =====
export class ExpensesController {
  async findAll(req: AuthRequest, res: Response): Promise<void> {
    try {
      const expenses = await expenseService.findAll();
      res.json(expenses);
      return;
    } catch (error: any) {
      res.status(500).json({ message: error.message });
      return;
    }
  }

  async create(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ message: 'Usuário não autenticado' });
        return;
      }

      const { cash_session_id } = req.body;
      const attachment = (req as any).file ? (req as any).file.filename : undefined;
      
      // cash_session_id agora é opcional
      const cashId = cash_session_id ? parseInt(cash_session_id) : null;
      
      const expense = await expenseService.create(cashId, req.user.userId, req.body, attachment);
      res.status(201).json(expense);
      return;
    } catch (error: any) {
      console.error('❌ Erro no controller de expenses:', error.message);
      res.status(400).json({ message: error.message });
      return;
    }
  }

  async findByCashSession(req: AuthRequest, res: Response): Promise<void> {
    try {
      const expenses = await expenseService.findByCashSession(parseInt(req.params.cashSessionId));
      res.json(expenses);
      return;
    } catch (error: any) {
      res.status(500).json({ message: error.message });
      return;
    }
  }

  async findByDateRange(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { start_date, end_date } = req.query;
      if (!start_date || !end_date) {
        res.status(400).json({ message: 'Datas inicial e final são obrigatórias' });
        return;
      }

      const expenses = await expenseService.findByDateRange(start_date as string, end_date as string);
      res.json(expenses);
      return;
    } catch (error: any) {
      res.status(500).json({ message: error.message });
      return;
    }
  }

  async delete(req: AuthRequest, res: Response): Promise<void> {
    try {
      await expenseService.delete(parseInt(req.params.id));
      res.json({ message: 'Despesa excluída com sucesso' });
      return;
    } catch (error: any) {
      res.status(400).json({ message: error.message });
      return;
    }
  }
}

// ===== REPORTS CONTROLLER =====
export class ReportsController {
  async getDailyReport(req: AuthRequest, res: Response): Promise<void> {
    try {
      const date = req.query.date ? new Date(req.query.date as string) : undefined;
      const report = await reportService.getDailyReport(date);
      res.json(report);
      return;
    } catch (error: any) {
      res.status(500).json({ message: error.message });
      return;
    }
  }

  async getWeeklyReport(req: AuthRequest, res: Response): Promise<void> {
    try {
      const date = req.query.date ? new Date(req.query.date as string) : undefined;
      const report = await reportService.getWeeklyReport(date);
      res.json(report);
      return;
    } catch (error: any) {
      res.status(500).json({ message: error.message });
      return;
    }
  }

  async getMonthlyReport(req: AuthRequest, res: Response): Promise<void> {
    try {
      const date = req.query.date ? new Date(req.query.date as string) : undefined;
      const report = await reportService.getMonthlyReport(date);
      res.json(report);
      return;
    } catch (error: any) {
      res.status(500).json({ message: error.message });
      return;
    }
  }

  async exportDailyPDF(req: AuthRequest, res: Response): Promise<void> {
    try {
      const date = req.query.date ? new Date(req.query.date as string) : undefined;
      const report = await reportService.getDailyReport(date);
      const pdfBuffer = await reportService.generateReportPDF(report, report.date, report.date);
      
      const fileName = `relatorio-diario-${report.date}.pdf`;
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
      res.send(pdfBuffer);
      return;
    } catch (error: any) {
      console.error('❌ Erro ao gerar PDF diário:', error);
      res.status(500).json({ message: error.message });
      return;
    }
  }

  async exportCSV(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { start_date, end_date } = req.query;
      
      if (!start_date || !end_date) {
        res.status(400).json({ message: 'Datas inicial e final são obrigatórias' });
        return;
      }

      const csv = await reportService.exportToCSV(start_date as string, end_date as string);
      
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename=relatorio-${start_date}-${end_date}.csv`);
      res.send('\uFEFF' + csv); // BOM para UTF-8
      return;
    } catch (error: any) {
      res.status(500).json({ message: error.message });
      return;
    }
  }

  async getDetailedReport(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { start_date, end_date } = req.query;
      
      if (!start_date || !end_date) {
        res.status(400).json({ message: 'Datas inicial e final são obrigatórias' });
        return;
      }

      const report = await reportService.getDetailedReport(start_date as string, end_date as string);
      res.json(report);
      return;
    } catch (error: any) {
      res.status(500).json({ message: error.message });
      return;
    }
  }

  async exportPDF(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { start_date, end_date } = req.query;
      
      if (!start_date || !end_date) {
        res.status(400).json({ message: 'Datas inicial e final são obrigatórias' });
        return;
      }

      const report = await reportService.getDetailedReport(start_date as string, end_date as string);
      const pdfBuffer = await reportService.generateReportPDF(report, start_date as string, end_date as string);
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=relatorio-${start_date}-${end_date}.pdf`);
      res.send(pdfBuffer);
      return;
    } catch (error: any) {
      console.error('❌ Erro ao gerar PDF:', error);
      res.status(500).json({ message: error.message });
      return;
    }
  }
}

// ===== NOTIFICATIONS CONTROLLER =====
export class NotificationsController {
  async findByUser(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ message: 'Usuário não autenticado' });
        return;
      }

      const unreadOnly = req.query.unread === 'true';
      const notifications = await notificationService.findByUser(req.user.userId, unreadOnly);
      res.json(notifications);
      return;
    } catch (error: any) {
      res.status(500).json({ message: error.message });
      return;
    }
  }

  async markAsRead(req: AuthRequest, res: Response): Promise<void> {
    try {
      await notificationService.markAsRead(parseInt(req.params.id));
      res.json({ message: 'Notificação marcada como lida' });
      return;
    } catch (error: any) {
      res.status(400).json({ message: error.message });
      return;
    }
  }

  async markAllAsRead(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ message: 'Usuário não autenticado' });
        return;
      }

      await notificationService.markAllAsRead(req.user.userId);
      res.json({ message: 'Todas as notificações marcadas como lidas' });
      return;
    } catch (error: any) {
      res.status(400).json({ message: error.message });
      return;
    }
  }

  async delete(req: AuthRequest, res: Response): Promise<void> {
    try {
      await notificationService.delete(parseInt(req.params.id));
      res.json({ message: 'Notificação excluída' });
      return;
    } catch (error: any) {
      res.status(400).json({ message: error.message });
      return;
    }
  }
}

// ===== SETTINGS CONTROLLER =====
export class SettingsController {
  async getAll(req: AuthRequest, res: Response): Promise<void> {
    try {
      const settings = await settingsService.getAll();
      res.json(settings);
      return;
    } catch (error: any) {
      res.status(500).json({ message: error.message });
      return;
    }
  }

  async get(req: AuthRequest, res: Response): Promise<void> {
    try {
      const value = await settingsService.get(req.params.key);
      if (value === null) {
        res.status(404).json({ message: 'Configuração não encontrada' });
        return;
      }

      res.json({ key: req.params.key, value });
      return;
    } catch (error: any) {
      res.status(500).json({ message: error.message });
      return;
    }
  }

  async set(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { key, value } = req.body;
      await settingsService.set(key, value);
      res.json({ message: 'Configuração salva com sucesso' });
      return;
    } catch (error: any) {
      res.status(400).json({ message: error.message });
      return;
    }
  }

  async setMultiple(req: AuthRequest, res: Response): Promise<void> {
    try {
      await settingsService.setMultiple(req.body);
      res.json({ message: 'Configurações salvas com sucesso' });
      return;
    } catch (error: any) {
      res.status(400).json({ message: error.message });
      return;
    }
  }
}

// ===== LOGS CONTROLLER =====
export class LogsController {
  async findAll(req: AuthRequest, res: Response): Promise<void> {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;

      const logs = await logsService.findAll(limit, offset);
      res.json(logs);
      return;
    } catch (error: any) {
      res.status(500).json({ message: error.message });
      return;
    }
  }

  async findByUser(req: AuthRequest, res: Response): Promise<void> {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
      const logs = await logsService.findByUser(parseInt(req.params.userId), limit);
      res.json(logs);
      return;
    } catch (error: any) {
      res.status(500).json({ message: error.message });
      return;
    }
  }

  async findByDateRange(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { start_date, end_date } = req.query;
      if (!start_date || !end_date) {
        res.status(400).json({ message: 'Datas inicial e final são obrigatórias' });
        return;
      }

      const logs = await logsService.findByDateRange(start_date as string, end_date as string);
      res.json(logs);
      return;
    } catch (error: any) {
      res.status(500).json({ message: error.message });
      return;
    }
  }
}

// ===== BACKUP CONTROLLER =====
export class BackupController {
  async create(req: AuthRequest, res: Response): Promise<void> {
    try {
      const backupPath = await createBackup();
      res.json({ message: 'Backup criado com sucesso', path: backupPath });
      return;
    } catch (error: any) {
      res.status(500).json({ message: error.message });
      return;
    }
  }

  async list(req: AuthRequest, res: Response): Promise<void> {
    try {
      const backups = listBackups();
      res.json(backups);
      return;
    } catch (error: any) {
      res.status(500).json({ message: error.message });
      return;
    }
  }
}

// ===== EXPORTA TODAS AS INSTÂNCIAS =====
export const usersController = new UsersController();
export const productsController = new ProductsController();
export const cashController = new CashController();
export const salesController = new SalesController();
export const expensesController = new ExpensesController();
export const reportsController = new ReportsController();
export const notificationsController = new NotificationsController();
export const settingsController = new SettingsController();
export const logsController = new LogsController();
export const backupController = new BackupController();

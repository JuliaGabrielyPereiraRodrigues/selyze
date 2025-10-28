import { Router } from 'express';
import express from 'express';
import { auth, authAdmin, authAdminOrGerente } from '../middleware/auth';
import { auditLog } from '../middleware/audit';
import { upload, uploadsPath } from '../middleware/upload';

import authController from '../controllers/auth.controller';
import {
  usersController,
  productsController,
  cashController,
  salesController,
  expensesController,
  reportsController,
  notificationsController,
  settingsController,
  logsController,
  backupController
} from '../controllers';

const router = Router();

// ===== HEALTH =====
router.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ===== AUTH =====
router.post('/auth/login', authController.login);
router.post('/auth/change-password', auth, authController.changePassword);
router.get('/auth/security-question', authController.getSecurityQuestion); 
router.get('/auth/verify-first-login', auth, authController.verifyFirstLogin);
router.post('/auth/verify-security-answer', authController.verifySecurityAnswer);

// ===== USERS =====
router.get('/users', auth, authAdmin, usersController.findAll.bind(usersController));
router.get('/users/:id', auth, authAdmin, usersController.findById.bind(usersController));
router.post('/users', auth, authAdmin, auditLog('CREATE', 'user'), usersController.create.bind(usersController));
router.put('/users/:id', auth, authAdmin, auditLog('UPDATE', 'user'), usersController.update.bind(usersController));
router.post('/users/:id/reset-password', auth, authAdmin, auditLog('RESET_PASSWORD', 'user'), usersController.resetPassword.bind(usersController));
router.delete('/users/:id', auth, authAdmin, auditLog('DELETE', 'user'), usersController.delete.bind(usersController));

// ===== PRODUCTS =====
router.get('/products', auth, productsController.findAll.bind(productsController));
router.get('/products/category/:category', auth, productsController.findByCategory.bind(productsController));
router.get('/products/low-stock', auth, authAdminOrGerente, productsController.findLowStock.bind(productsController));
router.get('/products/:id', auth, productsController.findById.bind(productsController));
router.post('/products', auth, authAdminOrGerente, auditLog('CREATE', 'product'), productsController.create.bind(productsController));
router.put('/products/:id', auth, authAdminOrGerente, auditLog('UPDATE', 'product'), productsController.update.bind(productsController));
router.delete('/products/:id', auth, authAdminOrGerente, auditLog('DELETE', 'product'), productsController.delete.bind(productsController));

// ===== CASH =====
router.post('/cash/open', auth, auditLog('OPEN_CASH', 'cash_session'), cashController.openCash.bind(cashController));
router.get('/cash/open', auth, cashController.getOpenCash.bind(cashController));
router.get('/cash/:id/summary', auth, cashController.getCashSummary.bind(cashController));
router.post('/cash/:id/close', auth, auditLog('CLOSE_CASH', 'cash_session'), cashController.closeCash.bind(cashController));
router.get('/cash/history', auth, authAdminOrGerente, cashController.getCashHistory.bind(cashController));

// ===== SALES =====
router.post('/sales', auth, auditLog('CREATE', 'sale'), salesController.create.bind(salesController));
router.get('/sales/:id', auth, salesController.findById.bind(salesController));
router.get('/sales/:id/receipt', auth, salesController.getReceipt.bind(salesController));
router.get('/sales/cash-session/:cashSessionId', auth, salesController.findByCashSession.bind(salesController));
router.get('/sales/date-range', auth, salesController.findByDateRange.bind(salesController));
router.post('/sales/:id/cancel', auth, authAdminOrGerente, auditLog('CANCEL', 'sale'), salesController.cancel.bind(salesController));

// ===== EXPENSES =====
router.get('/expenses', auth, expensesController.findAll.bind(expensesController));
router.post('/expenses', auth, upload.single('attachment'), auditLog('CREATE', 'expense'), expensesController.create.bind(expensesController));
router.get('/expenses/cash-session/:cashSessionId', auth, expensesController.findByCashSession.bind(expensesController));
router.get('/expenses/date-range', auth, expensesController.findByDateRange.bind(expensesController));
router.delete('/expenses/:id', auth, authAdminOrGerente, auditLog('DELETE', 'expense'), expensesController.delete.bind(expensesController));

// ===== REPORTS =====
router.get('/reports/daily', auth, reportsController.getDailyReport.bind(reportsController));
router.get('/reports/daily/export', auth, authAdminOrGerente, reportsController.exportDailyPDF.bind(reportsController));
router.get('/reports/weekly', auth, reportsController.getWeeklyReport.bind(reportsController));
router.get('/reports/monthly', auth, reportsController.getMonthlyReport.bind(reportsController));
router.get('/reports/export-csv', auth, authAdminOrGerente, reportsController.exportCSV.bind(reportsController));
router.get('/reports/export-pdf', auth, authAdminOrGerente, reportsController.exportPDF.bind(reportsController));
router.get('/reports/detailed', auth, authAdminOrGerente, reportsController.getDetailedReport.bind(reportsController));

// ===== NOTIFICATIONS =====
router.get('/notifications', auth, notificationsController.findByUser.bind(notificationsController));
router.put('/notifications/:id/read', auth, notificationsController.markAsRead.bind(notificationsController));
router.put('/notifications/read-all', auth, notificationsController.markAllAsRead.bind(notificationsController));
router.delete('/notifications/:id', auth, notificationsController.delete.bind(notificationsController));

// ===== BACKUP (rotas específicas primeiro) =====
router.post('/backup', auth, authAdmin, auditLog('CREATE', 'backup'), backupController.create.bind(backupController));
router.get('/backup', auth, authAdmin, backupController.list.bind(backupController));
router.post('/settings/backup', auth, authAdmin, auditLog('CREATE', 'backup'), backupController.create.bind(backupController)); // alternativa

// ===== SETTINGS (genéricas depois das específicas) =====
router.get('/settings', auth, settingsController.getAll.bind(settingsController)); // listar todas
router.get('/settings/:key', auth, settingsController.get.bind(settingsController)); // pegar 1 chave
router.post('/settings', auth, authAdmin, auditLog('UPDATE', 'settings'), settingsController.set.bind(settingsController));
router.put('/settings', auth, authAdmin, auditLog('UPDATE', 'settings'), settingsController.setMultiple.bind(settingsController));
router.post('/settings/multiple', auth, authAdmin, auditLog('UPDATE', 'settings'), settingsController.setMultiple.bind(settingsController));

// ===== LOGS =====
router.get('/logs', auth, authAdmin, logsController.findAll.bind(logsController));
router.get('/logs/user/:userId', auth, authAdmin, logsController.findByUser.bind(logsController));
router.get('/logs/date-range', auth, authAdmin, logsController.findByDateRange.bind(logsController));

// ===== UPLOADS estáticos =====
router.use('/uploads', express.static(uploadsPath));

export default router;

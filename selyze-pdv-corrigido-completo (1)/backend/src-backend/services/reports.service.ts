import { queryAll, queryOne } from '../db/connection';
import { DailyReport } from '../types';
import {
  getStartOfDay,
  getEndOfDay,
  getStartOfWeek,
  getEndOfWeek,
  getStartOfMonth,
  getEndOfMonth
} from '../utils/date';

export class ReportService {
  async getDailyReport(date?: Date): Promise<DailyReport> {
    try {
      const startDate = getStartOfDay(date);
      const endDate = getEndOfDay(date);

      const stats = (await queryOne<any>(
        `SELECT 
          COUNT(*) as sales_count,
          COALESCE(SUM(total), 0) as sales_total,
          COALESCE(SUM(discount), 0) as discount_total
         FROM sales 
         WHERE created_at BETWEEN ? AND ? AND status = 'concluida'`,
        [startDate, endDate]
      )) || { sales_count: 0, sales_total: 0, discount_total: 0 };

      const expenses = (await queryOne<any>(
        "SELECT COALESCE(SUM(amount), 0) as expenses_total FROM expenses WHERE type = 'despesa' AND expense_date BETWEEN date(?) AND date(?)",
        [startDate, endDate]
      )) || { expenses_total: 0 };

      const paymentMethodsData = await queryAll<any>(
        `SELECT 
          payment_method,
          SUM(total) as total
         FROM sales 
         WHERE created_at BETWEEN ? AND ? AND status = 'concluida'
         GROUP BY payment_method`,
        [startDate, endDate]
      );

      const topProducts = await queryAll<any>(
        `SELECT 
          si.product_name,
          SUM(si.quantity) as quantity,
          SUM(si.subtotal) as total
         FROM sale_items si
         INNER JOIN sales s ON si.sale_id = s.id
         WHERE s.created_at BETWEEN ? AND ? AND s.status = 'concluida'
         GROUP BY si.product_name
         ORDER BY quantity DESC
         LIMIT 10`,
        [startDate, endDate]
      );

      return {
        date: startDate,
        sales_count: stats.sales_count,
        sales_total: stats.sales_total,
        expenses_total: expenses.expenses_total,
        net_profit: stats.sales_total - expenses.expenses_total,
        payment_methods: paymentMethodsData || [],
        top_products: topProducts || []
      };
    } catch (error) {
      console.error('❌ Erro em ReportService.getDailyReport:', error);
      throw new Error('Falha ao gerar relatório diário.');
    }
  }

  async getWeeklyReport(date?: Date): Promise<DailyReport> {
    const startDate = getStartOfWeek(date);
    const endDate = getEndOfWeek(date);
    return this.getReportByDateRange(startDate, endDate);
  }

  async getMonthlyReport(date?: Date): Promise<DailyReport> {
    const startDate = getStartOfMonth(date);
    const endDate = getEndOfMonth(date);
    return this.getReportByDateRange(startDate, endDate);
  }

  private async getReportByDateRange(startDate: string, endDate: string): Promise<DailyReport> {
    try {
      const stats = (await queryOne<any>(
        `SELECT 
          COUNT(*) as sales_count,
          COALESCE(SUM(total), 0) as sales_total
         FROM sales 
         WHERE created_at BETWEEN ? AND ? AND status = 'concluida'`,
        [startDate, endDate]
      )) || { sales_count: 0, sales_total: 0 };

      const expenses = (await queryOne<any>(
        "SELECT COALESCE(SUM(amount), 0) as expenses_total FROM expenses WHERE type = 'despesa' AND expense_date BETWEEN date(?) AND date(?)",
        [startDate, endDate]
      )) || { expenses_total: 0 };

      const paymentMethodsData = await queryAll<any>(
        `SELECT 
          payment_method,
          SUM(total) as total
         FROM sales 
         WHERE created_at BETWEEN ? AND ? AND status = 'concluida'
         GROUP BY payment_method`,
        [startDate, endDate]
      );

      const topProducts = await queryAll<any>(
        `SELECT 
          si.product_name,
          SUM(si.quantity) as quantity,
          SUM(si.subtotal) as total
         FROM sale_items si
         INNER JOIN sales s ON si.sale_id = s.id
         WHERE s.created_at BETWEEN ? AND ? AND s.status = 'concluida'
         GROUP BY si.product_name
         ORDER BY quantity DESC
         LIMIT 10`,
        [startDate, endDate]
      );

      return {
        date: startDate,
        sales_count: stats.sales_count,
        sales_total: stats.sales_total,
        expenses_total: expenses.expenses_total,
        net_profit: stats.sales_total - expenses.expenses_total,
        payment_methods: paymentMethodsData || [],
        top_products: topProducts || []
      };
    } catch (error) {
      console.error('❌ Erro em ReportService.getReportByDateRange:', error);
      throw new Error('Falha ao gerar relatório por período.');
    }
  }

  async exportToCSV(startDate: string, endDate: string): Promise<string> {
    try {
      // Buscar vendas do período
      const sales = await queryAll<any>(
        `SELECT 
          s.id,
          s.created_at,
          s.customer_name,
          s.customer_phone,
          s.subtotal,
          s.discount,
          s.total,
          s.payment_method,
          s.status,
          u.name as user_name
         FROM sales s
         LEFT JOIN users u ON s.user_id = u.id
         WHERE s.created_at BETWEEN ? AND ?
         ORDER BY s.created_at DESC`,
        [startDate, endDate]
      );

      // Criar CSV
      let csv = 'ID,Data/Hora,Cliente,Telefone,Subtotal,Desconto,Total,Pagamento,Status,Usuário\n';
      
      for (const sale of sales) {
        const date = new Date(sale.created_at).toLocaleString('pt-BR');
        csv += `${sale.id},"${date}","${sale.customer_name || ''}","${sale.customer_phone || ''}",${sale.subtotal},${sale.discount},${sale.total},"${sale.payment_method}","${sale.status}","${sale.user_name}"\n`;
      }

      return csv;
    } catch (error) {
      console.error('❌ Erro em ReportService.exportToCSV:', error);
      throw new Error('Falha ao exportar relatório CSV.');
    }
  }

  async getDetailedReport(startDate: string, endDate: string): Promise<any> {
    try {
      // Vendas detalhadas
      const sales = await queryAll<any>(
        `SELECT 
          s.*,
          u.name as user_name
         FROM sales s
         LEFT JOIN users u ON s.user_id = u.id
         WHERE s.created_at BETWEEN ? AND ? AND s.status = 'concluida'
         ORDER BY s.created_at DESC`,
        [startDate, endDate]
      );

      // Despesas detalhadas
      const expenses = await queryAll<any>(
        `SELECT * FROM expenses 
         WHERE expense_date BETWEEN date(?) AND date(?)
         ORDER BY expense_date DESC`,
        [startDate, endDate]
      );

      // Estatísticas
      const stats = await this.getReportByDateRange(startDate, endDate);

      return {
        ...stats,
        sales,
        expenses
      };
    } catch (error) {
      console.error('❌ Erro em ReportService.getDetailedReport:', error);
      throw new Error('Falha ao gerar relatório detalhado.');
    }
  }

  async generateReportPDF(report: any, startDate: string, endDate: string): Promise<Buffer> {
    try {
      const PDFDocument = require('pdfkit');
      
      return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 50 });
        const chunks: Buffer[] = [];
        
        doc.on('data', (chunk: Buffer) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);
        
        // Cabeçalho
        doc.fontSize(20).text('Relatório de Vendas', { align: 'center' });
        doc.fontSize(12).text(`Período: ${new Date(startDate).toLocaleDateString('pt-BR')} - ${new Date(endDate).toLocaleDateString('pt-BR')}`, { align: 'center' });
        doc.moveDown(2);
        
        // Resumo
        doc.fontSize(16).text('Resumo Geral', { underline: true });
        doc.moveDown();
        doc.fontSize(12);
        doc.text(`Total de Vendas: R$ ${report.sales_total.toFixed(2)}`);
        doc.text(`Quantidade de Vendas: ${report.sales_count}`);
        doc.text(`Total de Descontos: R$ ${report.discount_total.toFixed(2)}`);
        doc.text(`Total de Despesas: R$ ${report.expenses_total.toFixed(2)}`);
        doc.text(`Lucro Líquido: R$ ${(report.sales_total - report.expenses_total).toFixed(2)}`);
        doc.moveDown(2);
        
        // Métodos de Pagamento
        if (report.payment_methods && report.payment_methods.length > 0) {
          doc.fontSize(16).text('Formas de Pagamento', { underline: true });
          doc.moveDown();
          doc.fontSize(12);
          report.payment_methods.forEach((pm: any) => {
            doc.text(`${pm.method}: R$ ${pm.total.toFixed(2)}`);
          });
          doc.moveDown(2);
        }
        
        // Produtos Mais Vendidos
        if (report.top_products && report.top_products.length > 0) {
          doc.fontSize(16).text('Produtos Mais Vendidos', { underline: true });
          doc.moveDown();
          doc.fontSize(12);
          report.top_products.forEach((product: any, index: number) => {
            doc.text(`${index + 1}. ${product.product_name} - Qtd: ${product.quantity} - Total: R$ ${product.total.toFixed(2)}`);
          });
        }
        
        doc.end();
      });
    } catch (error) {
      console.error('❌ Erro ao gerar PDF:', error);
      throw new Error('Falha ao gerar PDF do relatório.');
    }
  }
}

export default new ReportService();

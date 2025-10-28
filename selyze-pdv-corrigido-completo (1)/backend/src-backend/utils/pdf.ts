import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { Sale, SaleItem, CashSummary } from '../types';

export class PDFGenerator {
  private doc: PDFKit.PDFDocument;
  
  constructor() {
    this.doc = new PDFDocument({ size: 'A4', margin: 50 });
  }
  
  private addHeader(title: string) {
    this.doc
      .fontSize(20)
      .text(title, { align: 'center' })
      .moveDown();
  }
  
  private addLine() {
    this.doc
      .moveTo(50, this.doc.y)
      .lineTo(550, this.doc.y)
      .stroke()
      .moveDown();
  }
  
  private formatCurrency(value: number): string {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }
  
  private formatDate(date: string): string {
    return new Date(date).toLocaleString('pt-BR');
  }
  
  async generateSaleReceipt(sale: Sale, items: SaleItem[]): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      
      this.doc.on('data', (chunk) => chunks.push(chunk));
      this.doc.on('end', () => resolve(Buffer.concat(chunks)));
      this.doc.on('error', reject);
      
      // Cabeçalho
      this.addHeader('COMPROVANTE DE VENDA');
      
      // Informações da venda
      this.doc
        .fontSize(12)
        .text(`Venda #${sale.id}`, { align: 'left' })
        .text(`Data: ${this.formatDate(sale.created_at)}`)
        .moveDown();
      
      if (sale.customer_name) {
        this.doc.text(`Cliente: ${sale.customer_name}`);
        if (sale.customer_phone) {
          this.doc.text(`Telefone: ${sale.customer_phone}`);
        }
        this.doc.moveDown();
      }
      
      this.addLine();
      
      // Itens
      this.doc.fontSize(14).text('Itens da Venda:', { underline: true }).moveDown(0.5);
      
      this.doc.fontSize(10);
      items.forEach((item) => {
        this.doc.text(
          `${item.quantity}x ${item.product_name} - ${this.formatCurrency(item.product_price)}`,
          { continued: true }
        );
        this.doc.text(`   ${this.formatCurrency(item.subtotal)}`, { align: 'right' });
      });
      
      this.doc.moveDown();
      this.addLine();
      
      // Totais
      this.doc.fontSize(12);
      this.doc.text(`Subtotal: ${this.formatCurrency(sale.subtotal)}`, { align: 'right' });
      
      if (sale.discount > 0) {
        const discountLabel = sale.discount_type === 'percent' 
          ? `Desconto (${sale.discount}%):` 
          : 'Desconto:';
        
        const discountValue = sale.discount_type === 'percent'
          ? sale.subtotal * (sale.discount / 100)
          : sale.discount;
        
        this.doc.text(`${discountLabel} -${this.formatCurrency(discountValue)}`, { align: 'right' });
      }
      
      this.doc
        .fontSize(14)
        .text(`TOTAL: ${this.formatCurrency(sale.total)}`, { align: 'right', underline: true })
        .moveDown();
      
      // Forma de pagamento
      this.doc.fontSize(12);
      
      if (sale.payment_method === 'multiplo' && sale.payment_details) {
        const payments = JSON.parse(sale.payment_details);
        this.doc.text('Formas de Pagamento:', { underline: true });
        payments.forEach((p: any) => {
          this.doc.text(`  ${p.method.toUpperCase()}: ${this.formatCurrency(p.amount)}`);
        });
      } else {
        this.doc.text(`Forma de Pagamento: ${sale.payment_method.toUpperCase()}`);
      }
      
      if (sale.change_amount > 0) {
        this.doc.text(`Troco: ${this.formatCurrency(sale.change_amount)}`);
      }
      
      this.doc.moveDown(2);
      
      // Rodapé
      this.doc
        .fontSize(10)
        .text('Obrigado pela preferência!', { align: 'center' })
        .text('Volte sempre!', { align: 'center' });
      
      this.doc.end();
    });
  }
  
  async generateCashClosingReport(summary: CashSummary): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      
      this.doc.on('data', (chunk) => chunks.push(chunk));
      this.doc.on('end', () => resolve(Buffer.concat(chunks)));
      this.doc.on('error', reject);
      
      // Cabeçalho
      this.addHeader('RELATÓRIO DE FECHAMENTO DE CAIXA');
      
      // Informações da sessão
      this.doc
        .fontSize(12)
        .text(`Caixa #${summary.session.id}`)
        .text(`Abertura: ${this.formatDate(summary.session.opened_at)}`)
        .text(`Fechamento: ${this.formatDate(summary.session.closed_at || new Date().toISOString())}`)
        .moveDown();
      
      this.addLine();
      
      // Resumo de vendas
      this.doc
        .fontSize(14)
        .text('Resumo de Vendas', { underline: true })
        .fontSize(12)
        .moveDown(0.5);
      
      this.doc.text(`Total de Vendas: ${summary.sales_count}`);
      this.doc.text(`Valor Total: ${this.formatCurrency(summary.sales_total)}`);
      this.doc.text(`Descontos: -${this.formatCurrency(summary.discount_total)}`);
      this.doc.moveDown();
      
      // Formas de pagamento
      this.doc.fontSize(14).text('Formas de Pagamento', { underline: true }).fontSize(12).moveDown(0.5);
      summary.payment_methods.forEach((pm) => {
        this.doc.text(`${pm.method.toUpperCase()}: ${this.formatCurrency(pm.total)}`);
      });
      this.doc.moveDown();
      
      this.addLine();
      
      // Despesas
      this.doc.fontSize(14).text('Despesas e Movimentações', { underline: true }).fontSize(12).moveDown(0.5);
      this.doc.text(`Despesas: -${this.formatCurrency(summary.expenses_total)}`);
      this.doc.text(`Sangrias: -${this.formatCurrency(summary.sangrias_total)}`);
      this.doc.text(`Suprimentos: +${this.formatCurrency(summary.suprimentos_total)}`);
      this.doc.moveDown();
      
      // Taxas iFood
      if (summary.ifood_commission_total > 0 || summary.ifood_payment_fee_total > 0) {
        this.doc.fontSize(14).text('Taxas iFood', { underline: true }).fontSize(12).moveDown(0.5);
        this.doc.text(`Comissão (12%): -${this.formatCurrency(summary.ifood_commission_total)}`);
        this.doc.text(`Taxa de Pagamento (3.2%): -${this.formatCurrency(summary.ifood_payment_fee_total)}`);
        this.doc.moveDown();
      }
      
      this.addLine();
      
      // Totais finais
    this.doc.text(`Saldo Inicial: ${this.formatCurrency(summary.session.opening_balance)}`);
    this.doc.text(`Saldo Esperado: ${this.formatCurrency(summary.expected_balance)}`);

    this.doc.font('Helvetica-Bold')
      .text(`Lucro Líquido: ${this.formatCurrency(summary.net_profit)}`)
      .font('Helvetica'); // volta pro padrão
      this.doc.end();
    });
  }
}

export async function generateSaleReceiptPDF(sale: Sale, items: SaleItem[]): Promise<Buffer> {
  const generator = new PDFGenerator();
  return generator.generateSaleReceipt(sale, items);
}

export async function generateCashClosingPDF(summary: CashSummary): Promise<Buffer> {
  const generator = new PDFGenerator();
  return generator.generateCashClosingReport(summary);
}

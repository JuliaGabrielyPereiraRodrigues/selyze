/**
 * Sistema de Impressão para Comprovantes Não-Fiscais
 * Suporte para impressoras térmicas 58mm/80mm
 */

interface PrinterConfig {
  printerName?: string;
  paperWidth: '58mm' | '80mm';
  marginTop: number;
  marginBottom: number;
  fontSize: number;
  autocut: boolean;
}

interface ReceiptItem {
  name: string;
  quantity: number;
  price: number;
  subtotal: number;
}

interface ReceiptData {
  // Cabeçalho
  storeName: string;
  storeAddress?: string;
  storePhone?: string;
  storeCNPJ?: string;
  
  // Venda
  saleNumber: number;
  saleDate: Date;
  cashier: string;
  customer?: {
    name?: string;
    phone?: string;
  };
  
  // Itens
  items: ReceiptItem[];
  
  // Totais
  subtotal: number;
  discount?: number;
  discountType?: 'percent' | 'fixed';
  total: number;
  
  // Pagamentos
  payments: Array<{
    method: string;
    amount: number;
  }>;
  
  change?: number;
  
  // Observações
  observations?: string;
}

class PrinterService {
  private config: PrinterConfig = {
    paperWidth: '80mm',
    marginTop: 10,
    marginBottom: 10,
    fontSize: 12,
    autocut: true,
  };

  constructor(config?: Partial<PrinterConfig>) {
    if (config) {
      this.config = { ...this.config, ...config };
    }
  }

  /**
   * Gera HTML formatado para impressão térmica
   */
  private generateReceiptHTML(data: ReceiptData): string {
    const formatCurrency = (value: number) => 
      new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    
    const formatDate = (date: Date) => 
      new Intl.DateTimeFormat('pt-BR', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);

    const paymentMethodNames: Record<string, string> = {
      dinheiro: 'Dinheiro',
      cartao: 'Cartão',
      pix: 'PIX',
      ifood: 'iFood'
    };

    const styles = `
      <style>
        @page {
          size: ${this.config.paperWidth} auto;
          margin: ${this.config.marginTop}mm ${this.config.marginBottom}mm;
        }
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Courier New', monospace;
          font-size: ${this.config.fontSize}px;
          line-height: 1.3;
          width: 100%;
          max-width: ${this.config.paperWidth};
        }
        
        .receipt {
          width: 100%;
          padding: 5px;
        }
        
        .header {
          text-align: center;
          margin-bottom: 10px;
          padding-bottom: 5px;
          border-bottom: 1px dashed #000;
        }
        
        .store-name {
          font-size: 16px;
          font-weight: bold;
          margin-bottom: 3px;
        }
        
        .store-info {
          font-size: 10px;
          color: #333;
        }
        
        .section {
          margin: 8px 0;
        }
        
        .line {
          display: flex;
          justify-content: space-between;
          margin: 2px 0;
        }
        
        .dashed {
          border-bottom: 1px dashed #000;
          padding-bottom: 5px;
          margin-bottom: 5px;
        }
        
        .items-table {
          width: 100%;
          margin: 5px 0;
        }
        
        .item-row {
          margin: 3px 0;
        }
        
        .item-name {
          font-weight: bold;
        }
        
        .item-details {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          color: #555;
        }
        
        .totals {
          margin-top: 10px;
          padding-top: 5px;
          border-top: 1px dashed #000;
        }
        
        .total-line {
          font-size: 14px;
          font-weight: bold;
          margin: 5px 0;
        }
        
        .payments {
          margin: 10px 0;
          padding: 5px 0;
          border-top: 1px dashed #000;
        }
        
        .change {
          font-size: 14px;
          font-weight: bold;
          text-align: center;
          margin: 10px 0;
          padding: 5px;
          border: 1px solid #000;
        }
        
        .footer {
          text-align: center;
          margin-top: 15px;
          padding-top: 10px;
          border-top: 1px dashed #000;
          font-size: 10px;
        }
        
        .qrcode {
          text-align: center;
          margin: 10px 0;
        }
        
        @media print {
          body { margin: 0; }
          .receipt { page-break-inside: avoid; }
        }
      </style>
    `;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Comprovante #${data.saleNumber}</title>
        ${styles}
      </head>
      <body>
        <div class="receipt">
          <!-- Cabeçalho -->
          <div class="header">
            <div class="store-name">${data.storeName}</div>
            ${data.storeAddress ? `<div class="store-info">${data.storeAddress}</div>` : ''}
            ${data.storePhone ? `<div class="store-info">Tel: ${data.storePhone}</div>` : ''}
            ${data.storeCNPJ ? `<div class="store-info">CNPJ: ${data.storeCNPJ}</div>` : ''}
          </div>
          
          <!-- Informações da Venda -->
          <div class="section">
            <div class="line">
              <span>Venda: #${String(data.saleNumber).padStart(6, '0')}</span>
              <span>${formatDate(data.saleDate)}</span>
            </div>
            <div class="line">
              <span>Atendente: ${data.cashier}</span>
            </div>
            ${data.customer?.name ? `
              <div class="line">
                <span>Cliente: ${data.customer.name}</span>
              </div>
            ` : ''}
            ${data.customer?.phone ? `
              <div class="line">
                <span>Telefone: ${data.customer.phone}</span>
              </div>
            ` : ''}
          </div>
          
          <!-- Itens -->
          <div class="section dashed">
            <div class="items-table">
              ${data.items.map(item => `
                <div class="item-row">
                  <div class="item-name">${item.name}</div>
                  <div class="item-details">
                    <span>${item.quantity} x ${formatCurrency(item.price)}</span>
                    <span>${formatCurrency(item.subtotal)}</span>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
          
          <!-- Totais -->
          <div class="totals">
            <div class="line">
              <span>Subtotal:</span>
              <span>${formatCurrency(data.subtotal)}</span>
            </div>
            ${data.discount ? `
              <div class="line">
                <span>Desconto${data.discountType === 'percent' ? ` (${data.discount}%)` : ''}:</span>
                <span>-${formatCurrency(
                  data.discountType === 'percent' 
                    ? data.subtotal * (data.discount / 100)
                    : data.discount
                )}</span>
              </div>
            ` : ''}
            <div class="total-line line">
              <span>TOTAL:</span>
              <span>${formatCurrency(data.total)}</span>
            </div>
          </div>
          
          <!-- Pagamentos -->
          <div class="payments">
            <div style="font-weight: bold; margin-bottom: 5px;">Formas de Pagamento:</div>
            ${data.payments.map(payment => `
              <div class="line">
                <span>${paymentMethodNames[payment.method] || payment.method}:</span>
                <span>${formatCurrency(payment.amount)}</span>
              </div>
            `).join('')}
          </div>
          
          ${data.change && data.change > 0 ? `
            <div class="change">
              TROCO: ${formatCurrency(data.change)}
            </div>
          ` : ''}
          
          ${data.observations ? `
            <div class="section">
              <div style="font-size: 10px;">
                <strong>Obs:</strong> ${data.observations}
              </div>
            </div>
          ` : ''}
          
          <!-- Rodapé -->
          <div class="footer">
            <div>*** COMPROVANTE NÃO FISCAL ***</div>
            <div style="margin-top: 5px;">Obrigado pela preferência!</div>
            <div style="margin-top: 3px;">Volte sempre!</div>
          </div>
        </div>
      </body>
      </html>
    `;

    return html;
  }

  /**
   * Imprime o comprovante
   */
  async print(data: ReceiptData): Promise<void> {
    const html = this.generateReceiptHTML(data);
    
    // Criar iframe oculto para impressão
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.width = '0px';
    iframe.style.height = '0px';
    iframe.style.left = '-500px';
    iframe.style.top = '-500px';
    document.body.appendChild(iframe);

    const iframeWindow = iframe.contentWindow;
    if (!iframeWindow) {
      document.body.removeChild(iframe);
      throw new Error('Não foi possível criar janela de impressão');
    }

    // Escrever HTML no iframe
    iframeWindow.document.open();
    iframeWindow.document.write(html);
    iframeWindow.document.close();

    // Aguardar carregamento e imprimir
    return new Promise((resolve, reject) => {
      iframe.onload = () => {
        setTimeout(() => {
          try {
            iframeWindow.focus();
            iframeWindow.print();
            
            // Remover iframe após impressão
            setTimeout(() => {
              document.body.removeChild(iframe);
              resolve();
            }, 100);
          } catch (error) {
            document.body.removeChild(iframe);
            reject(error);
          }
        }, 250);
      };
    });
  }

  /**
   * Gera preview do comprovante em nova janela
   */
  preview(data: ReceiptData): void {
    const html = this.generateReceiptHTML(data);
    const previewWindow = window.open('', '_blank', 'width=400,height=600');
    
    if (previewWindow) {
      previewWindow.document.open();
      previewWindow.document.write(html);
      previewWindow.document.close();
    }
  }

  /**
   * Testa conexão com impressora
   */
  async testPrint(): Promise<boolean> {
    const testData: ReceiptData = {
      storeName: 'TESTE DE IMPRESSÃO',
      saleNumber: 999999,
      saleDate: new Date(),
      cashier: 'Sistema',
      items: [
        { name: 'Item Teste', quantity: 1, price: 10, subtotal: 10 }
      ],
      subtotal: 10,
      total: 10,
      payments: [
        { method: 'dinheiro', amount: 10 }
      ]
    };

    try {
      await this.print(testData);
      return true;
    } catch (error) {
      console.error('Erro ao testar impressão:', error);
      return false;
    }
  }

  /**
   * Configurar impressora
   */
  configure(config: Partial<PrinterConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

// Exportar instância única
export const printer = new PrinterService();

// Exportar também a classe para múltiplas instâncias se necessário
export { PrinterService, type PrinterConfig, type ReceiptData, type ReceiptItem };
import { useState, useEffect, useRef } from 'react';
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalFooter } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { PaymentDetail } from '@/types';
import { toast } from 'sonner';
import { 
  CreditCard, 
  DollarSign, 
  Smartphone, 
  ShoppingBag,
  Calculator,
  X
} from 'lucide-react';

interface PaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  total: number;
  onConfirm: (payments: PaymentDetail[]) => void;
}

// Valores rápidos predefinidos para pagamento
const QUICK_VALUES = [10, 20, 50, 100, 150, 200];

// Ícones por método de pagamento
const PAYMENT_ICONS = {
  dinheiro: DollarSign,
  cartao: CreditCard,
  pix: Smartphone,
  ifood: ShoppingBag,
};

export default function PaymentModal({
  open,
  onOpenChange,
  total,
  onConfirm,
}: PaymentModalProps) {
  const [payments, setPayments] = useState<PaymentDetail[]>([
    { method: 'dinheiro', amount: 0 },
  ]);
  const [receivedAmount, setReceivedAmount] = useState<string>('');
  const firstInputRef = useRef<HTMLInputElement>(null);

  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const remaining = Math.max(0, total - totalPaid);
  const change = Math.max(0, totalPaid - total);

  // Auto-focus no primeiro campo quando abrir
  useEffect(() => {
    if (open && firstInputRef.current) {
      firstInputRef.current.focus();
      // Resetar estado ao abrir
      setPayments([{ method: 'dinheiro', amount: 0 }]);
      setReceivedAmount('');
    }
  }, [open]);

  // Atalhos de teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return;

      switch (e.key) {
        case 'F1':
          e.preventDefault();
          handleQuickPayment('dinheiro');
          break;
        case 'F2':
          e.preventDefault();
          handleQuickPayment('cartao');
          break;
        case 'F3':
          e.preventDefault();
          handleQuickPayment('pix');
          break;
        case 'F4':
          e.preventDefault();
          handleQuickPayment('ifood');
          break;
        case 'Enter':
          if (e.ctrlKey) {
            e.preventDefault();
            handleConfirm();
          }
          break;
        case 'Escape':
          e.preventDefault();
          onOpenChange(false);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, payments, totalPaid, total]);

  const handleQuickPayment = (method: string) => {
    const paymentMethod = method as 'dinheiro' | 'cartao' | 'pix' | 'ifood';
    // Preencher o primeiro pagamento com o total ou adicionar novo
    if (payments.length === 1 && payments[0].amount === 0) {
      setPayments([{ method: paymentMethod, amount: total }]);
    } else {
      const newPayment: PaymentDetail = { method: paymentMethod, amount: remaining };
      setPayments([...payments, newPayment]);
    }
  };

  const handleAddPayment = () => {
    const remainingAmount = Math.max(0, total - totalPaid);
    setPayments([...payments, { method: 'cartao', amount: remainingAmount }]);
  };

  const handleRemovePayment = (index: number) => {
    if (payments.length > 1) {
      setPayments(payments.filter((_, i) => i !== index));
    } else {
      toast.error('Deve haver pelo menos um método de pagamento');
    }
  };

  const handleUpdatePayment = (index: number, field: string, value: any) => {
    const updated = [...payments];
    updated[index] = { ...updated[index], [field]: value };
    
    // Auto-completar próximo pagamento se houver falta
    if (field === 'amount' && index < updated.length - 1) {
      const paidSoFar = updated.slice(0, index + 1).reduce((sum, p) => sum + p.amount, 0);
      if (paidSoFar < total && index === updated.length - 2) {
        updated[index + 1].amount = total - paidSoFar;
      }
    }
    
    setPayments(updated);
  };

  const handleQuickValue = (value: number) => {
    // Aplicar ao último pagamento ativo
    const lastIndex = payments.length - 1;
    handleUpdatePayment(lastIndex, 'amount', value);
  };

  const handleReceivedAmount = () => {
    const amount = parseFloat(receivedAmount);
    if (!isNaN(amount) && amount > 0) {
      setPayments([{ method: 'dinheiro', amount }]);
      setReceivedAmount('');
    }
  };

  const handleConfirm = () => {
    if (totalPaid < total) {
      toast.error(`Faltam R$ ${(total - totalPaid).toFixed(2)} para completar o pagamento`);
      return;
    }

    const validPayments = payments.filter(p => p.amount > 0);
    if (validPayments.length === 0) {
      toast.error('Adicione pelo menos um método de pagamento');
      return;
    }

    // Se há troco, ajustar o pagamento em dinheiro
    if (change > 0) {
      const cashPaymentIndex = validPayments.findIndex(p => p.method === 'dinheiro');
      if (cashPaymentIndex === -1) {
        toast.warning('Troco disponível apenas para pagamentos em dinheiro');
      }
    }

    onConfirm(validPayments);
    onOpenChange(false);
    setPayments([{ method: 'dinheiro', amount: 0 }]);
    setReceivedAmount('');
    toast.success('Pagamento confirmado!');
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent className="max-w-2xl">
        <ModalHeader>
          <ModalTitle>Finalizar Pagamento</ModalTitle>
        </ModalHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
          {/* Coluna Esquerda - Resumo e Valores Rápidos */}
          <div className="space-y-4">
            <div className="bg-primary/10 p-4 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Total da Venda</p>
              <p className="text-3xl font-bold">R$ {total.toFixed(2)}</p>
            </div>

            {/* Valor Recebido Rápido (Dinheiro) */}
            <div className="space-y-2">
              <Label>Valor Recebido (Dinheiro)</Label>
              <div className="flex gap-2">
                <Input
                  ref={firstInputRef}
                  type="number"
                  min="0"
                  step="0.01"
                  value={receivedAmount}
                  onChange={(e) => setReceivedAmount(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleReceivedAmount();
                    }
                  }}
                  placeholder="Digite o valor recebido"
                  className="text-lg"
                />
                <Button onClick={handleReceivedAmount} size="sm">
                  <Calculator size={16} />
                </Button>
              </div>
            </div>

            {/* Valores Rápidos */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Valores Rápidos</Label>
              <div className="grid grid-cols-3 gap-2">
                {QUICK_VALUES.map(value => (
                  <Button
                    key={value}
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickValue(value)}
                    className="font-mono"
                  >
                    R$ {value}
                  </Button>
                ))}
              </div>
            </div>

            {/* Atalhos de Teclado */}
            <div className="bg-muted/50 p-3 rounded-lg text-xs space-y-1">
              <p className="font-semibold mb-2">Atalhos Rápidos:</p>
              <div className="grid grid-cols-2 gap-1">
                <p><kbd>F1</kbd> Dinheiro</p>
                <p><kbd>F2</kbd> Cartão</p>
                <p><kbd>F3</kbd> PIX</p>
                <p><kbd>F4</kbd> iFood</p>
                <p><kbd>Ctrl+Enter</kbd> Confirmar</p>
                <p><kbd>Esc</kbd> Cancelar</p>
              </div>
            </div>
          </div>

          {/* Coluna Direita - Métodos de Pagamento */}
          <div className="space-y-4">
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {payments.map((payment, index) => {
                const Icon = PAYMENT_ICONS[payment.method as keyof typeof PAYMENT_ICONS] || DollarSign;
                return (
                  <div key={index} className="bg-muted/30 p-3 rounded-lg space-y-2">
                    <div className="flex gap-2 items-end">
                      <div className="flex-1">
                        <Label className="text-xs mb-1 flex items-center gap-1">
                          <Icon size={14} />
                          Método {index + 1}
                        </Label>
                        <select
                          value={payment.method}
                          onChange={(e) =>
                            handleUpdatePayment(index, 'method', e.target.value)
                          }
                          className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                        >
                          <option value="dinheiro">💵 Dinheiro</option>
                          <option value="cartao">💳 Cartão</option>
                          <option value="pix">📱 PIX</option>
                          <option value="ifood">🛍️ iFood</option>
                        </select>
                      </div>
                      <div className="flex-1">
                        <Label className="text-xs mb-1 block">Valor</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={payment.amount || ''}
                          onChange={(e) =>
                            handleUpdatePayment(index, 'amount', parseFloat(e.target.value) || 0)
                          }
                          placeholder="0,00"
                          className="font-mono"
                        />
                      </div>
                      {payments.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemovePayment(index)}
                          className="h-10 w-10 p-0 text-destructive"
                        >
                          <X size={16} />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <Button
              variant="outline"
              onClick={handleAddPayment}
              className="w-full"
              disabled={totalPaid >= total}
            >
              + Adicionar Forma de Pagamento
            </Button>

            {/* Resumo Final */}
            <div className="space-y-2 pt-4 border-t">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total da Venda:</span>
                <span className="font-mono">R$ {total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Pago:</span>
                <span className="font-mono font-semibold">R$ {totalPaid.toFixed(2)}</span>
              </div>
              {remaining > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-destructive">Faltando:</span>
                  <span className="font-mono font-semibold text-destructive">
                    R$ {remaining.toFixed(2)}
                  </span>
                </div>
              )}
              {change > 0 && (
                <div className="flex justify-between text-lg pt-2 border-t">
                  <span className="text-green-600 font-semibold">Troco:</span>
                  <span className="font-mono font-bold text-green-600">
                    R$ {change.toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        <ModalFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar (Esc)
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={totalPaid < total}
            className="bg-green-600 hover:bg-green-700 min-w-[200px]"
          >
            {totalPaid < total 
              ? `Faltam R$ ${remaining.toFixed(2)}` 
              : 'Confirmar Pagamento (Ctrl+Enter)'
            }
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { useCashStore } from '@/store/cashStore';
import { useAuthStore } from '@/store/authStore';
import { useStoreSettings } from '@/hooks/useStoreSettings';
import { Product, SaleItem, PaymentDetail } from '@/types';
import { formatCurrency } from '@/lib/utils';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Trash2, Plus, Minus } from 'lucide-react';
import { printer, type ReceiptData } from '@/lib/printer';

export default function PDVPage() {
  const { openCash } = useCashStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState<'percent' | 'fixed'>('percent');
  const [showPayment, setShowPayment] = useState(false);
  const [loading, setLoading] = useState(false);

  // Produto genérico
  const [genericName, setGenericName] = useState('');
  const [genericPrice, setGenericPrice] = useState('');
  const [genericQuantity, setGenericQuantity] = useState(1);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const response = await api.get('/products');
      setProducts(response.data.filter((p: Product) => p.active === 1));
    } catch (error) {
      toast.error('Erro ao carregar produtos');
    }
  };

  const addToCart = (product: Product) => {
    // Verificar se produto unitário tem estoque
    if (product.type === 'unitario' && product.stock <= 0) {
      toast.error(`${product.name} está sem estoque!`);
      return;
    }
    
    const existingItem = cart.find(item => item.product_id === product.id);
    
    if (existingItem) {
      // Verificar estoque antes de adicionar mais unidades
      if (product.type === 'unitario' && product.stock < existingItem.quantity + 1) {
        toast.error(`Estoque insuficiente de ${product.name}. Disponível: ${product.stock}`);
        return;
      }
      
      setCart(cart.map(item =>
        item.product_id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, {
        product_id: product.id,
        product_name: product.name,
        product_price: product.price,
        quantity: 1,
      }]);
    }
    toast.success(`${product.name} adicionado ao carrinho`);
  };

  const addGenericToCart = () => {
    if (!genericName || !genericPrice) {
      toast.error('Preencha o nome e o preço do produto');
      return;
    }

    const price = parseFloat(genericPrice.replace(',', '.'));
    if (isNaN(price) || price <= 0) {
      toast.error('Preço inválido');
      return;
    }

    setCart([...cart, {
      product_name: genericName,
      product_price: price,
      quantity: genericQuantity,
    }]);

    toast.success('Produto genérico adicionado');
    setGenericName('');
    setGenericPrice('');
    setGenericQuantity(1);
  };

  const updateQuantity = (index: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(index);
      return;
    }
    
    setCart(cart.map((item, i) => 
      i === index ? { ...item, quantity } : item
    ));
  };

  const removeFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
    toast.info('Item removido do carrinho');
  };

  const calculateSubtotal = () => {
    return cart.reduce((sum, item) => sum + (item.product_price * item.quantity), 0);
  };

  const calculateDiscount = () => {
    const subtotal = calculateSubtotal();
    if (discountType === 'percent') {
      return subtotal * (discount / 100);
    }
    return discount;
  };

  const calculateTotal = () => {
    return calculateSubtotal() - calculateDiscount();
  };

  const handleFinalize = () => {
    if (cart.length === 0) {
      toast.error('Carrinho vazio');
      return;
    }

    if (!openCash) {
      toast.error('Abra o caixa primeiro');
      return;
    }

    setShowPayment(true);
  };

  const handleClear = () => {
    if (cart.length === 0) return;
    
    if (confirm('Deseja limpar o carrinho?')) {
      setCart([]);
      setCustomerName('');
      setCustomerPhone('');
      setDiscount(0);
      toast.info('Carrinho limpo');
    }
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!openCash) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">Caixa Fechado</h2>
        <p className="text-muted-foreground">Abra o caixa para realizar vendas</p>
      </div>
    );
  }

  if (showPayment) {
    return <PaymentScreen 
      cart={cart}
      subtotal={calculateSubtotal()}
      discount={calculateDiscount()}
      total={calculateTotal()}
      customerName={customerName}
      customerPhone={customerPhone}
      discountValue={discount}
      discountType={discountType}
      onBack={() => setShowPayment(false)}
      onSuccess={() => {
        setCart([]);
        setCustomerName('');
        setCustomerPhone('');
        setDiscount(0);
        setShowPayment(false);
      }}
    />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Ponto de Venda</h2>
          <p className="text-muted-foreground">Adicione produtos ao carrinho</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleClear}>
            Limpar Carrinho
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Produtos */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Produtos</CardTitle>
              <Input
                placeholder="Buscar produto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-[400px] overflow-y-auto">
                {filteredProducts.map((product) => {
                  const isOutOfStock = product.type === 'unitario' && product.stock <= 0;
                  const isLowStock = product.type === 'unitario' && product.stock > 0 && product.stock <= product.min_stock;
                  
                  return (
                    <Button
                      key={product.id}
                      variant="outline"
                      className={`h-auto p-4 flex flex-col items-start gap-1 ${isOutOfStock ? 'opacity-50 cursor-not-allowed' : ''}`}
                      onClick={() => addToCart(product)}
                      disabled={isOutOfStock}
                    >
                      <span className="font-semibold text-left">{product.name}</span>
                      <span className="text-lg text-primary">{formatCurrency(product.price)}</span>
                      {product.type === 'unitario' && (
                        <span className={`text-xs ${isOutOfStock ? 'text-destructive font-semibold' : isLowStock ? 'text-orange-500' : 'text-muted-foreground'}`}>
                          {isOutOfStock ? '❌ Sem estoque' : `Estoque: ${product.stock}`}
                        </span>
                      )}
                    </Button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Produto Genérico */}
          <Card>
            <CardHeader>
              <CardTitle>Produto Genérico</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nome do Produto</Label>
                  <Input
                    placeholder="Ex: Marmita especial"
                    value={genericName}
                    onChange={(e) => setGenericName(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Preço (R$)</Label>
                  <Input
                    placeholder="0,00"
                    value={genericPrice}
                    onChange={(e) => setGenericPrice(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Label>Quantidade</Label>
                  <Input
                    type="number"
                    min="1"
                    value={genericQuantity}
                    onChange={(e) => setGenericQuantity(parseInt(e.target.value) || 1)}
                  />
                </div>
                <Button onClick={addGenericToCart} className="mt-6">
                  Adicionar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Carrinho */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Carrinho ({cart.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {cart.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Carrinho vazio</p>
                ) : (
                  cart.map((item, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{item.product_name}</div>
                        <div className="text-sm text-muted-foreground">
                          {formatCurrency(item.product_price)}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => updateQuantity(index, item.quantity - 1)}
                        >
                          <Minus size={16} />
                        </Button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => updateQuantity(index, item.quantity + 1)}
                        >
                          <Plus size={16} />
                        </Button>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeFromCart(index)}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  ))
                )}
              </div>

              {/* Cliente */}
              <div className="space-y-2 pt-4 border-t">
                <Label>Cliente (opcional)</Label>
                <Input
                  placeholder="Nome"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
                <Input
                  placeholder="Telefone"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                />
              </div>

              {/* Desconto */}
              <div className="space-y-2 pt-4 border-t">
                <Label>Desconto</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={discount || ''}
                    onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                  />
                  <select
                    className="px-4 rounded-md border border-input bg-background"
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as 'percent' | 'fixed')}
                  >
                    <option value="percent">%</option>
                    <option value="fixed">R$</option>
                  </select>
                </div>
              </div>

              {/* Totais */}
              <div className="space-y-2 pt-4 border-t">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(calculateSubtotal())}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm text-destructive">
                    <span>Desconto:</span>
                    <span>-{formatCurrency(calculateDiscount())}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold pt-2 border-t">
                  <span>Total:</span>
                  <span>{formatCurrency(calculateTotal())}</span>
                </div>
              </div>

              <Button
                className="w-full"
                size="lg"
                onClick={handleFinalize}
                disabled={cart.length === 0}
              >
                Finalizar Venda
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Componente de Tela de Pagamento Completo
// ✅ SUBSTITUIR a função PaymentScreen completa em PDVPage.tsx

function PaymentScreen({ cart, subtotal, discount, total, customerName, customerPhone, discountValue, discountType, onBack, onSuccess }: any) {
  const { openCash } = useCashStore();
  const [paymentMethod, setPaymentMethod] = useState<'dinheiro' | 'cartao' | 'pix' | 'ifood' | 'multiplo'>('dinheiro');
  const [receivedAmount, setReceivedAmount] = useState('');
  const { user } = useAuthStore();
  const { settings } = useStoreSettings();
  
  // ✅ NOVO: Estado para múltiplos pagamentos
  const [multiplePayments, setMultiplePayments] = useState<PaymentDetail[]>([]);
  const [currentMethod, setCurrentMethod] = useState<'dinheiro' | 'cartao' | 'pix' | 'ifood'>('dinheiro');
  const [currentAmount, setCurrentAmount] = useState('');
  const [processing, setProcessing] = useState(false);

  // ✅ NOVO: Adicionar pagamento
  const addPayment = () => {
    const amount = parseFloat(currentAmount);
    if (!amount || amount <= 0) {
      toast.error('Digite um valor válido');
      return;
    }

    const totalPaid = multiplePayments.reduce((sum, p) => sum + p.amount, 0);
    if (totalPaid + amount > total) {
      toast.error('O total dos pagamentos não pode exceder o valor da venda');
      return;
    }

    setMultiplePayments([
      ...multiplePayments,
      { method: currentMethod, amount }
    ]);
    setCurrentAmount('');
    toast.success(`Pagamento de R$ ${amount.toFixed(2)} via ${currentMethod} adicionado`);
  };

  // ✅ NOVO: Remover pagamento
  const removePayment = (index: number) => {
    setMultiplePayments(multiplePayments.filter((_, i) => i !== index));
  };

  // ✅ NOVO: Calcular restante
  const getRemainingAmount = () => {
    const totalPaid = multiplePayments.reduce((sum, p) => sum + p.amount, 0);
    return total - totalPaid;
  };

  const calculateChange = () => {
    if (paymentMethod !== 'dinheiro') return 0;
    const received = parseFloat(receivedAmount) || 0;
    return Math.max(0, received - total);
  };

  const handlePayment = async () => {
    if (!openCash) {
      toast.error('Caixa não está aberto');
      return;
    }

    // ✅ VALIDAÇÕES
    if (paymentMethod === 'multiplo') {
      const totalPaid = multiplePayments.reduce((sum, p) => sum + p.amount, 0);
      if (Math.abs(totalPaid - total) > 0.01) {
        toast.error(`Falta pagar R$ ${getRemainingAmount().toFixed(2)}`);
        return;
      }
    } else if (paymentMethod === 'dinheiro') {
      const received = parseFloat(receivedAmount) || 0;
      if (received < total) {
        toast.error('Valor recebido é menor que o total');
        return;
      }
    }

    setProcessing(true);
    try {
      // Payload da venda
      const saleData = {
        cash_session_id: openCash.id,
        items: cart.map((item: any) => ({
          product_id: item.product_id,         // pode vir undefined para produto genérico
          product_name: item.product_name,
          quantity: item.quantity,
          price: item.product_price,
        })),
        payments: paymentMethod === 'multiplo'
          ? multiplePayments
          : [{ method: paymentMethod, amount: total }],
        total: total,
        discount: discountValue || 0,
        discount_type: discountType,
        customer_name: customerName || undefined,
        customer_phone: customerPhone || undefined,
      };

      // Cria a venda
      const response = await api.post('/sales', saleData);
      const sale = response.data.sale;

      toast.success('Venda realizada com sucesso!');

      // ------- IMPRESSÃO (condicional) -------
      const buildReceiptData = (): ReceiptData => ({
        storeName: settings?.store_name || 'PDV Marmitaria',
        storeAddress: settings?.store_address || '',
        storePhone: settings?.store_phone || '',
        storeCNPJ: settings?.store_cnpj || '',
        saleNumber: sale.id,
        saleDate: new Date(sale.created_at),
        cashier: user?.name || 'Operador',
        customer: customerName
          ? { name: customerName, phone: customerPhone }
          : undefined,
        items: cart.map((item: any) => ({
          name: item.product_name,
          quantity: item.quantity,
          price: item.product_price,
          subtotal: item.product_price * item.quantity,
        })),
        subtotal: subtotal,
        discount: discountValue > 0 ? discountValue : undefined,
        discountType: discountType,
        total: total,
        payments: paymentMethod === 'multiplo'
          ? multiplePayments
          : [{ method: paymentMethod, amount: total }],
        change:
          paymentMethod === 'dinheiro' && receivedAmount
            ? parseFloat(receivedAmount) - total
            : undefined,
      });

      // Só tenta imprimir se a impressora estiver habilitada
      if (settings?.printer_enabled) {
        try {
          if (settings?.auto_print) {
            // Impressão automática
            await printer.print(buildReceiptData());
            toast.success('Cupom impresso automaticamente!');
          } else {
            // Pergunta se quer imprimir
            if (confirm('Deseja imprimir o cupom da venda?')) {
              await printer.print(buildReceiptData());
              toast.success('Cupom impresso!');
            }
          }
        } catch (printError) {
          console.error('Erro ao imprimir:', printError);
          toast.warning('Venda concluída, mas houve erro na impressão');
        }
      }
      // --------------------------------------

      onSuccess(); // finalize fluxo (limpa carrinho, fecha modal, etc.)
    } catch (error: any) {
      const errorMsg = error?.response?.data?.message || 'Erro ao processar venda';
      toast.error(errorMsg);
    } finally {
      setProcessing(false);
    }
  };

  const QUICK_VALUES = [20, 50, 100, 150, 200];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Finalizar Pagamento</h2>
          <p className="text-muted-foreground">Selecione a forma de pagamento</p>
        </div>
        <Button variant="outline" onClick={onBack}>
          Voltar
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Resumo da Venda */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Resumo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm text-destructive">
                    <span>Desconto:</span>
                    <span>-{formatCurrency(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-xl font-bold pt-2 border-t">
                  <span>Total:</span>
                  <span className="text-primary">{formatCurrency(total)}</span>
                </div>
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm font-medium mb-2">{cart.length} itens</p>
                <div className="space-y-1 max-h-[200px] overflow-y-auto">
                  {cart.map((item: any, index: number) => (
                    <div key={index} className="text-sm flex justify-between">
                      <span className="truncate">{item.quantity}x {item.product_name}</span>
                      <span className="ml-2 font-medium">{formatCurrency(item.product_price * item.quantity)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {customerName && (
                <div className="pt-4 border-t text-sm">
                  <p className="font-medium">Cliente:</p>
                  <p>{customerName}</p>
                  {customerPhone && <p className="text-muted-foreground">{customerPhone}</p>}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Formas de Pagamento */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Forma de Pagamento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Botões de Método */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {[
                  { id: 'dinheiro', label: 'Dinheiro', icon: '💵' },
                  { id: 'cartao', label: 'Cartão', icon: '💳' },
                  { id: 'pix', label: 'PIX', icon: '📱' },
                  { id: 'ifood', label: 'iFood', icon: '🍔' },
                  { id: 'multiplo', label: 'Múltiplo', icon: '🔀' },
                ].map((method) => (
                  <Button
                    key={method.id}
                    variant={paymentMethod === method.id ? 'default' : 'outline'}
                    className="h-20 flex flex-col gap-2"
                    onClick={() => setPaymentMethod(method.id as any)}
                  >
                    <span className="text-2xl">{method.icon}</span>
                    <span className="text-xs">{method.label}</span>
                  </Button>
                ))}
              </div>

              {/* ✅ NOVO: Interface para Múltiplos Pagamentos */}
              {paymentMethod === 'multiplo' && (
                <div className="space-y-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm font-medium mb-2">Pagamentos Adicionados:</p>
                    {multiplePayments.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Nenhum pagamento adicionado</p>
                    ) : (
                      <div className="space-y-2">
                        {multiplePayments.map((payment, index) => (
                          <div key={index} className="flex justify-between items-center bg-background p-2 rounded">
                            <span className="text-sm capitalize">{payment.method}</span>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">R$ {payment.amount.toFixed(2)}</span>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => removePayment(index)}
                              >
                                ✕
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <div className="mt-3 pt-3 border-t flex justify-between text-sm">
                      <span>Total Pago:</span>
                      <span className="font-bold">
                        R$ {multiplePayments.reduce((sum, p) => sum + p.amount, 0).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm mt-1">
                      <span>Restante:</span>
                      <span className={`font-bold ${getRemainingAmount() > 0 ? 'text-red-500' : 'text-green-500'}`}>
                        R$ {getRemainingAmount().toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label>Método</Label>
                        <select
                          value={currentMethod}
                          onChange={(e) => setCurrentMethod(e.target.value as any)}
                          className="w-full h-10 px-3 rounded-md border border-input bg-background"
                        >
                          <option value="dinheiro">Dinheiro</option>
                          <option value="cartao">Cartão</option>
                          <option value="pix">PIX</option>
                          <option value="ifood">iFood</option>
                        </select>
                      </div>
                      <div>
                        <Label>Valor (R$)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={currentAmount}
                          onChange={(e) => setCurrentAmount(e.target.value)}
                          placeholder="0,00"
                        />
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      onClick={addPayment}
                      disabled={!currentAmount || parseFloat(currentAmount) <= 0}
                      className="w-full"
                    >
                      Adicionar Pagamento
                    </Button>
                  </div>
                </div>
              )}

              {/* Campo de Valor Recebido (Dinheiro) */}
              {paymentMethod === 'dinheiro' && (
                <div className="space-y-4">
                  <div>
                    <Label>Valor Recebido (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min={total}
                      placeholder="0,00"
                      value={receivedAmount}
                      onChange={(e) => setReceivedAmount(e.target.value)}
                      className="h-14 text-xl text-center font-bold"
                      autoFocus
                    />
                  </div>

                  {/* Valores Rápidos */}
                  <div className="flex flex-wrap gap-2">
                    {QUICK_VALUES.map((value) => (
                      <Button
                        key={value}
                        size="sm"
                        variant="outline"
                        onClick={() => setReceivedAmount(value.toString())}
                      >
                        R$ {value}
                      </Button>
                    ))}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setReceivedAmount(total.toFixed(2))}
                      className="bg-primary/10"
                    >
                      Exato
                    </Button>
                  </div>

                  {/* Troco */}
                  {receivedAmount && parseFloat(receivedAmount) >= total && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg"
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-medium">Troco:</span>
                        <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                          {formatCurrency(calculateChange())}
                        </span>
                      </div>
                    </motion.div>
                  )}
                </div>
              )}

              {/* Informação para outros métodos */}
              {paymentMethod !== 'dinheiro' && paymentMethod !== 'multiplo' && (
                <div className="p-4 bg-muted rounded-lg text-center">
                  <p className="text-sm text-muted-foreground">
                    Valor a ser pago: <span className="font-bold text-foreground text-lg">{formatCurrency(total)}</span>
                  </p>
                  {paymentMethod === 'ifood' && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                      ⚠️ Taxas do iFood serão calculadas automaticamente
                    </p>
                  )}
                </div>
              )}

              {/* Botões de Ação */}
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={onBack}
                  className="flex-1"
                  disabled={processing}
                >
                  Cancelar
                </Button>
                <Button
                  size="lg"
                  onClick={handlePayment}
                  disabled={
                    processing || 
                    (paymentMethod === 'dinheiro' && (!receivedAmount || parseFloat(receivedAmount) < total)) ||
                    (paymentMethod === 'multiplo' && Math.abs(getRemainingAmount()) > 0.01)
                  }
                  className="flex-1 bg-green-600 hover:bg-green-700 text-lg font-semibold"
                >
                  {processing ? (
                    <span className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Processando...
                    </span>
                  ) : (
                    `Confirmar Pagamento`
                  )}
                </Button>
              </div>

              <p className="text-xs text-center text-muted-foreground">
                Atalhos: F1-F4 para métodos | Ctrl+Enter para confirmar | ESC para cancelar
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
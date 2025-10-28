import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { useCashStore } from '@/store/cashStore';
import api from '@/lib/api';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { CashSummary } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { CheckCircle2, TrendingUp, DollarSign } from 'lucide-react';

export default function CloseCashPage() {
  const navigate = useNavigate();
  const { openCash, closeCash, isLoading } = useCashStore(); // ✅ MUDANÇA: Usar openCash diretamente
  const [closingBalance, setClosingBalance] = useState('');
  const [summary, setSummary] = useState<CashSummary | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);
  const [finalSummary, setFinalSummary] = useState<CashSummary | null>(null);

  useEffect(() => {
    const loadSummary = async () => {
      console.log('CloseCashPage: Iniciando carregamento de resumo'); // ✅ DEBUG: Log inicial
      console.log('CloseCashPage: openCash no store:', openCash); // ✅ DEBUG: Verificar se openCash existe
      
      if (!openCash) {
        console.error('CloseCashPage: Nenhum caixa aberto encontrado (openCash é null)'); // ✅ DEBUG: Erro se openCash null
        toast.error('Nenhum caixa aberto');
        navigate('/');
        return;
      }

      console.log('CloseCashPage: Sessão encontrada:', openCash.id); // ✅ DEBUG: Confirma sessão

      try {
        const response = await api.get(`/cash/${openCash.id}/summary`);
        console.log('CloseCashPage: Resposta da API:', response.data); // ✅ DEBUG: Mostra dados retornados
        setSummary(response.data);
        setLoadingData(false);
      } catch (error: any) {
        console.error('CloseCashPage: Erro ao carregar resumo:', error.response?.data || error.message); // ✅ DEBUG: Detalhes do erro
        toast.error('Erro ao carregar resumo do caixa');
        navigate('/');
      }
    };

    loadSummary();
  }, [openCash]); // ✅ MUDANÇA: Dependência em openCash

  const handleCloseCash = async () => {
    console.log('CloseCashPage: Iniciando fechamento de caixa'); // ✅ DEBUG: Log ao clicar
    if (!closingBalance || parseFloat(closingBalance) < 0) {
      console.error('CloseCashPage: Saldo final inválido'); // ✅ DEBUG: Validação falhou
      toast.error('Digite um valor válido para o saldo final');
      return;
    }

    if (!openCash?.id) {
      console.error('CloseCashPage: Sessão de caixa não encontrada (openCash.id é null)'); // ✅ DEBUG: Sessão null
      toast.error('Sessão de caixa não encontrada');
      return;
    }

    try {
      console.log('CloseCashPage: Chamando closeCash com ID:', openCash.id); // ✅ DEBUG: Antes da chamada
      const closedSummary = await closeCash(openCash.id, parseFloat(closingBalance));
      console.log('CloseCashPage: Resumo fechado:', closedSummary); // ✅ DEBUG: Resposta do fechamento
      setFinalSummary(closedSummary);
      setShowSuccess(true);
      toast.success('Caixa fechado com sucesso!');
    } catch (error: any) {
      console.error('CloseCashPage: Erro ao fechar caixa:', error.response?.data || error.message); // ✅ DEBUG: Detalhes do erro
      toast.error(error.message || 'Erro ao fechar caixa');
    }
  };

  if (loadingData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando resumo do caixa...</p>
        </div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center">
        <p className="text-muted-foreground">Erro ao carregar dados</p>
      </div>
    );
  }

  // ✅ NOVA: Tela de sucesso com resumo final
  if (showSuccess && finalSummary) {
    const difference = parseFloat(closingBalance) - finalSummary.expected_balance;
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-background p-4">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center mb-6"
          >
            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="h-12 w-12 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-green-600 dark:text-green-400 mb-2">
              Caixa Fechado!
            </h1>
            <p className="text-muted-foreground">Resumo do expediente</p>
          </motion.div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-3 mb-2">
                <DollarSign className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">Total de Vendas</p>
              </div>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {finalSummary.sales_count}
              </p>
              <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                {formatCurrency(finalSummary.sales_total)}
              </p>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
                <p className="text-sm text-green-700 dark:text-green-300 font-medium">Lucro Líquido</p>
              </div>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                {formatCurrency(finalSummary.net_profit)}
              </p>
            </Card>

            <Card className="p-6">
              <p className="text-sm text-muted-foreground mb-1">Saldo Inicial</p>
              <p className="text-2xl font-bold">{formatCurrency(finalSummary.session.opening_balance)}</p>
            </Card>

            <Card className="p-6">
              <p className="text-sm text-muted-foreground mb-1">Saldo Final</p>
              <p className="text-2xl font-bold">{formatCurrency(parseFloat(closingBalance))}</p>
            </Card>

            <Card className="p-6">
              <p className="text-sm text-muted-foreground mb-1">Saldo Esperado</p>
              <p className="text-2xl font-bold">{formatCurrency(finalSummary.expected_balance)}</p>
            </Card>

            <Card className={`p-6 ${difference >= 0 ? 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800'}`}>
              <p className={`text-sm mb-1 ${difference >= 0 ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                {difference >= 0 ? 'Sobra' : 'Falta'}
              </p>
              <p className={`text-2xl font-bold ${difference >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {formatCurrency(Math.abs(difference))}
              </p>
            </Card>
          </div>

          {/* Métodos de Pagamento */}
          <Card className="p-6 mb-6">
            <h3 className="font-semibold mb-4">Formas de Pagamento</h3>
            <div className="space-y-2">
              {finalSummary.payment_methods.map((pm) => (
                <div key={pm.method} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                  <span className="capitalize font-medium">{pm.method}</span>
                  <span className="text-lg font-bold">{formatCurrency(pm.total)}</span>
                </div>
              ))}
            </div>
          </Card>

          <Button
            onClick={() => navigate('/dashboard')}
            className="w-full h-14 text-lg font-semibold"
          >
            Voltar ao Dashboard
          </Button>
        </div>
      </div>
    );
  }

  // Tela de fechamento (formulário)
  const expectedBalance = summary.expected_balance;
  const difference = parseFloat(closingBalance || '0') - expectedBalance;
  const isDifference = Math.abs(difference) > 0.01;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4">
      <div className="max-w-2xl mx-auto">
        <Card className="mb-6">
          <div className="p-8">
            <h1 className="text-3xl font-bold mb-2">Fechar Caixa</h1>
            <p className="text-muted-foreground">Resumo do expediente</p>
          </div>
        </Card>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card className="p-4">
            <p className="text-sm text-muted-foreground mb-1">Saldo Inicial</p>
            <p className="text-2xl font-bold">R$ {summary.session.opening_balance.toFixed(2)}</p>
          </Card>

          <Card className="p-4">
            <p className="text-sm text-muted-foreground mb-1">Vendas</p>
            <p className="text-2xl font-bold">{summary.sales_count}</p>
            <p className="text-sm text-muted-foreground">R$ {summary.sales_total.toFixed(2)}</p>
          </Card>

          <Card className="p-4">
            <p className="text-sm text-muted-foreground mb-1">Despesas</p>
            <p className="text-2xl font-bold">R$ {summary.expenses_total.toFixed(2)}</p>
          </Card>

          <Card className="p-4">
            <p className="text-sm text-muted-foreground mb-1">Sangrias + Suprimentos</p>
            <p className="text-2xl font-bold">
              R$ {(summary.sangrias_total + summary.suprimentos_total).toFixed(2)}
            </p>
          </Card>

          <Card className="p-4 bg-green-950 border-green-700">
            <p className="text-sm text-green-300 mb-1">Lucro Líquido</p>
            <p className="text-2xl font-bold text-green-400">
              R$ {summary.net_profit.toFixed(2)}
            </p>
          </Card>

          <Card className="p-4 border-2 border-blue-700">
            <p className="text-sm text-blue-300 mb-1">Saldo Esperado</p>
            <p className="text-2xl font-bold text-blue-400">
              R$ {expectedBalance.toFixed(2)}
            </p>
          </Card>
        </div>

        <Card className="p-6 mb-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="closing-balance" className="text-base mb-3 block">
                Saldo Final Contado (R$) *
              </Label>
              <Input
                id="closing-balance"
                type="number"
                min="0"
                step="0.01"
                value={closingBalance}
                onChange={(e) => setClosingBalance(e.target.value)}
                placeholder="0,00"
                className="h-12 text-lg"
                autoFocus
              />
            </div>

            {closingBalance && isDifference && (
              <div className={`p-4 rounded-lg ${difference > 0 ? 'bg-green-950 border border-green-700' : 'bg-red-950 border border-green-700'}`}>
                <p className={`text-sm font-semibold ${difference > 0 ? 'text-green-300' : 'text-red-300'}`}>
                  {difference > 0 ? '+ Sobra de' : '- Falta de'} R$ {Math.abs(difference).toFixed(2)}
                </p>
              </div>
            )}
          </div>
        </Card>

        <div className="flex gap-4">
          <Button
            variant="outline"
            onClick={() => navigate('/')}
            className="flex-1 h-12"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleCloseCash}
            disabled={isLoading || !closingBalance}
            className="flex-1 h-12 bg-red-600 hover:bg-red-700"
          >
            {isLoading ? 'Fechando...' : 'Fechar Caixa'}
          </Button>
        </div>
      </div>
    </div>
  );
}
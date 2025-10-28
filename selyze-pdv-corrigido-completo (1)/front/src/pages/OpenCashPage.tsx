import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { useCashStore } from '@/store/cashStore';
import { toast } from 'sonner';
import { DollarSign } from 'lucide-react';

export default function OpenCashPage() {
  const navigate = useNavigate();
  const { openNewCash, isLoading } = useCashStore();
  const [openingBalance, setOpeningBalance] = useState('');

  const handleOpenCash = async () => {
    if (!openingBalance || parseFloat(openingBalance) < 0) {
      toast.error('Digite um valor válido para o saldo inicial');
      return;
    }

    try {
      await openNewCash(parseFloat(openingBalance));
      toast.success('Caixa aberto com sucesso!');
      navigate('/pdv');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao abrir caixa');
      console.error('Erro:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && openingBalance && !isLoading) {
      handleOpenCash();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md"
      >
        <Card className="shadow-2xl">
          <div className="p-8">
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring' }}
                className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <DollarSign className="h-8 w-8 text-primary" />
              </motion.div>
              <h1 className="text-3xl font-bold mb-2">Abrir Caixa</h1>
              <p className="text-muted-foreground">Informe o saldo inicial para iniciar o expediente</p>
            </div>

            <div className="space-y-6">
              <div>
                <Label htmlFor="opening-balance" className="text-sm mb-2 block">
                  Saldo Inicial (R$) *
                </Label>
                {/* ✅ REMOVIDO type="password" - agora mostra o valor */}
                <Input
                  id="opening-balance"
                  type="number"
                  min="0"
                  step="0.01"
                  value={openingBalance}
                  onChange={(e) => setOpeningBalance(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="0,00"
                  className="h-12 text-lg text-center font-bold"
                  autoFocus
                />
                {/* ✅ REMOVIDO texto sobre ocultação */}
              </div>

              <div className="bg-muted/50 p-4 rounded-lg border border-border">
                <p className="text-sm font-medium mb-2">💡 Instruções:</p>
                <ul className="text-sm space-y-1.5 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span>Digite o valor em dinheiro que está no caixa</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span>Este será o saldo inicial do seu dia de trabalho</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span>Após abrir, você poderá realizar vendas no PDV</span>
                  </li>
                </ul>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={handleOpenCash}
                  disabled={isLoading || !openingBalance}
                  className="w-full h-14 text-lg font-semibold bg-green-600 hover:bg-green-700"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Abrindo Caixa...
                    </span>
                  ) : (
                    'Abrir Caixa'
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate('/dashboard')}
                  disabled={isLoading}
                  className="w-full h-12"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
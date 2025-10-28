import { useState, useEffect } from 'react';
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalFooter } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Expense } from '@/types';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';

interface ExpenseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expense?: Expense;
  onSave: (data: Partial<Expense>, file?: File) => Promise<void>;
  isLoading?: boolean;
}

export default function ExpenseModal({
  open,
  onOpenChange,
  expense,
  onSave,
  isLoading = false,
}: ExpenseModalProps) {
  const { user } = useAuthStore();
  const [formData, setFormData] = useState<{
    type: 'despesa' | 'sangria' | 'suprimento';
    description: string;
    amount: number;
    category: string;
    expense_date: string;
    attachment?: File | null;
  }>({
    type: 'despesa',
    description: '',
    amount: 0,
    category: '',
    expense_date: format(new Date(), 'yyyy-MM-dd'),
    attachment: null,
  });

  const [password, setPassword] = useState('');
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

  useEffect(() => {
    if (expense) {
      setFormData({
        type: expense.type,
        description: expense.description,
        amount: expense.amount,
        category: expense.category || '',
        expense_date: expense.expense_date ? format(new Date(expense.expense_date), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
        attachment: null,
      });
    } else {
      setFormData({
        type: 'despesa',
        description: '',
        amount: 0,
        category: '',
        expense_date: format(new Date(), 'yyyy-MM-dd'),
        attachment: null,
      });
    }
  }, [expense, open]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'amount' ? parseFloat(value) || 0 : value,
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      // Validar tamanho (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Arquivo muito grande. Máximo 5MB');
        return;
      }
      // Validar tipo
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
      if (!validTypes.includes(file.type)) {
        toast.error('Tipo de arquivo inválido. Use JPG, PNG ou PDF');
        return;
      }
    }
    setFormData(prev => ({ ...prev, attachment: file }));
  };

  const handleSubmit = async () => {
    if (!formData.description.trim()) {
      toast.error('Descrição é obrigatória');
      return;
    }
    if (formData.amount <= 0) {
      toast.error('Valor deve ser maior que zero');
      return;
    }
    if (!formData.expense_date) {
      toast.error('Data é obrigatória');
      return;
    }

    // Verificar se precisa de senha para sangria ou suprimento
    if ((formData.type === 'sangria' || formData.type === 'suprimento') && user?.role !== 'admin' && user?.role !== 'gerente') {
      setShowPasswordConfirm(true);
      return;
    }

    try {
      const { attachment, ...dataToSave } = formData;
      await onSave(dataToSave, attachment || undefined);
      toast.success(expense ? 'Movimentação atualizada com sucesso!' : 'Movimentação registrada com sucesso!');
      onOpenChange(false);
    } catch (error) {
      toast.error('Erro ao salvar movimentação');
    }
  };

  const confirmWithPassword = async () => {
    if (!password.trim()) {
      toast.error('Digite sua senha');
      return;
    }

    try {
      await api.post('/auth/verify-password', { password });
      const { attachment, ...dataToSave } = formData;
      await onSave(dataToSave, attachment || undefined);
      toast.success(expense ? 'Movimentação atualizada com sucesso!' : 'Movimentação registrada com sucesso!');
      onOpenChange(false);
      setShowPasswordConfirm(false);
      setPassword('');
    } catch (error) {
      toast.error('Senha incorreta');
    }
  };

  const typeLabels = {
    despesa: 'Despesa',
    sangria: 'Sangria (Saque)',
    suprimento: 'Suprimento',
  };

  const typeDescriptions = {
    despesa: 'Gastos operacionais do negócio (luz, água, aluguel, produtos, etc)',
    sangria: 'Retirada de dinheiro do caixa para segurança ou outros fins',
    suprimento: 'Entrada de dinheiro no caixa (além das vendas)',
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent className="max-w-lg">
        <ModalHeader>
          <ModalTitle>
            {expense ? 'Editar ' : 'Registrar '} {typeLabels[formData.type]}
          </ModalTitle>
        </ModalHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="type">Tipo *</Label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="despesa">💸 Despesa</option>
              <option value="sangria">🏦 Sangria (Saque)</option>
              <option value="suprimento">💰 Suprimento</option>
            </select>
            <p className="text-xs text-muted-foreground mt-1">
              {typeDescriptions[formData.type]}
            </p>
          </div>

          <div>
            <Label htmlFor="expense_date">Data *</Label>
            <Input
              id="expense_date"
              name="expense_date"
              type="date"
              value={formData.expense_date}
              onChange={handleChange}
              max={format(new Date(), 'yyyy-MM-dd')}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Data em que a movimentação ocorreu
            </p>
          </div>

          {formData.type === 'despesa' && (
            <div>
              <Label htmlFor="category">Categoria</Label>
              <Input
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                placeholder="Ex: Limpeza, Manutenção, Fornecedor..."
              />
            </div>
          )}

          <div>
            <Label htmlFor="description">Descrição *</Label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Descreva detalhadamente o motivo da movimentação"
              className="w-full h-24 px-3 py-2 rounded-md border border-input bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <Label htmlFor="amount">Valor (R$) *</Label>
            <Input
              id="amount"
              name="amount"
              type="number"
              min="0"
              step="0.01"
              value={formData.amount}
              onChange={handleChange}
              placeholder="0,00"
              className="text-lg font-semibold"
            />
          </div>

          <div>
            <Label htmlFor="attachment">Anexar Comprovante (Opcional)</Label>
            <Input
              id="attachment"
              type="file"
              accept="image/jpeg,image/jpg,image/png,application/pdf"
              onChange={handleFileChange}
              className="cursor-pointer"
            />
            <p className="text-xs text-muted-foreground mt-1">
              JPG, PNG ou PDF - Máximo 5MB
            </p>
            {formData.attachment && (
              <div className="mt-2 p-2 bg-green-500/10 border border-green-500/20 rounded flex items-center justify-between">
                <span className="text-sm text-green-600 dark:text-green-400">
                  📎 {formData.attachment.name}
                </span>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, attachment: null }))}
                  className="text-red-600 hover:text-red-700 text-xs"
                >
                  Remover
                </button>
              </div>
            )}
          </div>
        </div>

        <ModalFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? 'Salvando...' : 'Salvar Movimentação'}
          </Button>
        </ModalFooter>

        {showPasswordConfirm && (
          <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-950 border border-yellow-500 rounded">
            <p className="text-sm font-medium mb-2">Confirme sua senha para liberar esta operação:</p>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Digite sua senha"
              className="mb-2"
            />
            <div className="flex gap-2">
              <Button onClick={confirmWithPassword} disabled={!password}>
                Confirmar
              </Button>
              <Button variant="outline" onClick={() => setShowPasswordConfirm(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        )}
      </ModalContent>
    </Modal>
  );
}
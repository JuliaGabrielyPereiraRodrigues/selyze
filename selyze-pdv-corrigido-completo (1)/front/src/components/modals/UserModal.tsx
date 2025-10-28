import { useState, useEffect } from 'react';
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalFooter } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { User, UserRole } from '@/types';
import { toast } from 'sonner';

interface UserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: User;
  onSave: (data: Partial<User>) => Promise<void>;
  isLoading?: boolean;
}

export default function UserModal({
  open,
  onOpenChange,
  user,
  onSave,
  isLoading = false,
}: UserModalProps) {
  const [formData, setFormData] = useState({
    username: '',
    name: '',
    email: '',
    role: 'caixa' as UserRole,
    security_question: '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username,
        name: user.name,
        email: user.email || '',
        role: user.role,
        security_question: user.security_question || '',
      });
    } else {
      setFormData({
        username: '',
        name: '',
        email: '',
        role: 'caixa',
        security_question: '',
      });
    }
  }, [user, open]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = async () => {
    if (!formData.username.trim()) {
      toast.error('Nome de usuário é obrigatório');
      return;
    }
    if (!formData.name.trim()) {
      toast.error('Nome completo é obrigatório');
      return;
    }
    if (!formData.email.trim()) {
      toast.error('E-mail é obrigatório');
      return;
    }
    if (!validateEmail(formData.email)) {
      toast.error('E-mail inválido');
      return;
    }

    try {
      await onSave({
        ...formData,
        ...(user && { id: user.id }),
      });
      toast.success(user ? 'Usuário atualizado com sucesso!' : 'Usuário criado com sucesso!');
      onOpenChange(false);
    } catch (error) {
      toast.error('Erro ao salvar usuário');
    }
  };

  const roleLabels = {
    admin: { label: 'Administrador', desc: 'Acesso total ao sistema' },
    gerente: { label: 'Gerente', desc: 'Gerencia vendas e relatórios' },
    caixa: { label: 'Operador de Caixa', desc: 'Realiza vendas no PDV' },
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent className="max-w-2xl">
        <ModalHeader>
          <ModalTitle>
            {user ? 'Editar Usuário' : 'Novo Usuário'}
          </ModalTitle>
        </ModalHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="username">Nome de Usuário *</Label>
              <Input
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder=""
                disabled={!!user}
              />
              {!!user && (
                <p className="text-xs text-muted-foreground mt-1">
                  O nome de usuário não pode ser alterado
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="name">Nome Completo *</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder=""
              />
            </div>
          </div>

          <div>
            <Label htmlFor="email">E-mail *</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder=""
            />
            <p className="text-xs text-muted-foreground mt-1">
              {user ? 'Usado para recuperação de senha' : 'A senha inicial será enviada para este e-mail'}
            </p>
          </div>

          <div>
            <Label htmlFor="role">Perfil de Acesso *</Label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {Object.entries(roleLabels).map(([value, { label, desc }]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground mt-1">
              {roleLabels[formData.role].desc}
            </p>
          </div>

          <div>
            <Label htmlFor="security_question">Pergunta de Segurança (Opcional)</Label>
            <Input
              id="security_question"
              name="security_question"
              value={formData.security_question}
              onChange={handleChange}
              placeholder=""
            />
            <p className="text-xs text-muted-foreground mt-1">
              Usado como alternativa para recuperação de senha
            </p>
          </div>

          {!user && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <p className="text-sm text-blue-600 dark:text-blue-400 font-medium mb-1">
                ℹ️ Informação importante
              </p>
              <p className="text-xs text-muted-foreground">
                Uma senha temporária será gerada automaticamente e enviada para o e-mail informado. 
                O usuário deverá alterar a senha no primeiro acesso.
              </p>
            </div>
          )}
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
            {isLoading ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Salvando...
              </span>
            ) : (
              'Salvar Usuário'
            )}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

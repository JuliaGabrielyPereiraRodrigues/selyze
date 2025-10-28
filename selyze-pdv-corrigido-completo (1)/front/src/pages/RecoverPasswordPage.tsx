import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import api from '@/lib/api';
import { toast } from 'sonner';

export default function RecoverPasswordPage() {
  const navigate = useNavigate();
  
  const [step, setStep] = useState<'username' | 'security' | 'password'>('username');
  const [username, setUsername] = useState('');
  const [securityQuestion, setSecurityQuestion] = useState('');
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleFindUser = async () => {
    if (!username.trim()) {
      toast.error('Digite um nome de usuário');
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.get(`/auth/security-question?username=${username}`);
      setSecurityQuestion(response.data.question);
      setStep('security');
    } catch (error) {
      toast.error('Usuário não encontrado ou sem pergunta de segurança');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyAnswer = async () => {
    if (!securityAnswer.trim()) {
      toast.error('Digite a resposta para a pergunta de segurança');
      return;
    }

    setIsLoading(true);
    try {
      await api.post('/auth/verify-security-answer', {
        username,
        answer: securityAnswer,
      });
      setStep('password');
      toast.success('Resposta correta! Agora defina sua nova senha.');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Resposta incorreta');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword.trim() || !confirmPassword.trim()) {
      toast.error('Digite a nova senha');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('As senhas não conferem');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('A senha deve ter no mínimo 6 caracteres');
      return;
    }

    setIsLoading(true);
    try {
      // ⚠️ ATENÇÃO: Este endpoint precisa ser criado no backend
      // Por enquanto, usar o endpoint existente que já existe
      await api.post('/auth/recover-password', {
        username,
        securityAnswer,
        newPassword,
      });
      
      toast.success('Senha alterada com sucesso!');
      navigate('/login');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao alterar senha');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <div className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Recuperar Senha</h1>
            {step === 'username' && <p className="text-muted-foreground">Digite seu usuário</p>}
            {step === 'security' && <p className="text-muted-foreground">Responda a pergunta de segurança</p>}
            {step === 'password' && <p className="text-muted-foreground">Digite sua nova senha</p>}
          </div>

          <div className="space-y-6">
            {/* Username */}
            {step === 'username' && (
              <>
                <div>
                  <Label htmlFor="username" className="text-base mb-3 block">
                    Nome de Usuário *
                  </Label>
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Seu nome de usuário"
                    className="h-12 text-lg"
                    autoFocus
                    onKeyPress={(e) => e.key === 'Enter' && handleFindUser()}
                  />
                </div>

                <Button
                  onClick={handleFindUser}
                  disabled={isLoading || !username}
                  className="w-full h-12 text-base"
                >
                  {isLoading ? 'Buscando...' : 'Próximo'}
                </Button>
              </>
            )}

            {/* Security Question */}
            {step === 'security' && (
              <>
                <div className="bg-muted p-4 rounded-lg mb-4">
                  <p className="text-sm text-muted-foreground mb-2">Pergunta de Segurança:</p>
                  <p className="font-semibold">{securityQuestion}</p>
                </div>

                <div>
                  <Label htmlFor="answer" className="text-base mb-3 block">
                    Resposta *
                  </Label>
                  <Input
                    id="answer"
                    type="text"
                    value={securityAnswer}
                    onChange={(e) => setSecurityAnswer(e.target.value)}
                    placeholder="Digite a resposta"
                    className="h-12 text-lg"
                    autoFocus
                    onKeyPress={(e) => e.key === 'Enter' && handleVerifyAnswer()}
                  />
                </div>

                <div className="flex gap-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setStep('username');
                      setSecurityAnswer('');
                    }}
                    disabled={isLoading}
                    className="flex-1 h-12"
                  >
                    Voltar
                  </Button>
                  <Button
                    onClick={handleVerifyAnswer}
                    disabled={isLoading || !securityAnswer}
                    className="flex-1 h-12 text-base"
                  >
                    {isLoading ? 'Verificando...' : 'Próximo'}
                  </Button>
                </div>
              </>
            )}

            {/* Password */}
            {step === 'password' && (
              <>
                <div>
                  <Label htmlFor="newPassword" className="text-base mb-3 block">
                    Nova Senha *
                  </Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Digite a nova senha"
                    className="h-12 text-lg"
                    autoFocus
                  />
                </div>

                <div>
                  <Label htmlFor="confirmPassword" className="text-base mb-3 block">
                    Confirmar Senha *
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirme a nova senha"
                    className="h-12 text-lg"
                  />
                </div>

                <div className="bg-muted p-4 rounded-lg text-sm text-muted-foreground">
                  <p>Requisitos da senha:</p>
                  <ul className="mt-2 space-y-1">
                    <li>• Mínimo 6 caracteres</li>
                    <li>• Evite senhas simples</li>
                  </ul>
                </div>

                <div className="flex gap-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setStep('security');
                      setNewPassword('');
                      setConfirmPassword('');
                    }}
                    disabled={isLoading}
                    className="flex-1 h-12"
                  >
                    Voltar
                  </Button>
                  <Button
                    onClick={handleResetPassword}
                    disabled={isLoading || !newPassword || !confirmPassword}
                    className="flex-1 h-12 text-base bg-green-600 hover:bg-green-700"
                  >
                    {isLoading ? 'Alterando...' : 'Alterar Senha'}
                  </Button>
                </div>
              </>
            )}

            <div className="text-center">
              <Button
                variant="ghost"
                onClick={() => navigate('/login')}
                className="text-sm"
              >
                Voltar ao Login
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
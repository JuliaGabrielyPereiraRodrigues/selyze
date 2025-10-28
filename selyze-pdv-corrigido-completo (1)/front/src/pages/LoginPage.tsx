import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isLoading } = useAuthStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // ✅ NOVO: Modal de primeiro login
  const [showFirstLoginModal, setShowFirstLoginModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !password) {
      toast.error('Preencha todos os campos');
      return;
    }

    try {
      const result = await login({ username, password });
      
      // ✅ VERIFICAR PRIMEIRO LOGIN
      if (result.user.first_login === 1) {
        toast.warning('É necessário alterar sua senha no primeiro acesso');
        setShowFirstLoginModal(true);
        return;
      }
      
      toast.success('Login realizado com sucesso!');
      navigate('/');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  // ✅ NOVO: Trocar senha no primeiro login
  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) {
      toast.error('Preencha a nova senha');
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

    if (newPassword === password) {
      toast.error('A nova senha deve ser diferente da senha temporária');
      return;
    }

    setChangingPassword(true);
    try {
      const { changePassword } = useAuthStore.getState();
      await changePassword(password, newPassword);
      
      toast.success('Senha alterada com sucesso!');
      setShowFirstLoginModal(false);
      navigate('/');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md"
      >
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-3xl text-center">SELYZE PDV</CardTitle>
            <CardDescription className="text-center">
              Entre com suas credenciais para acessar o sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Usuário</Label>
                <Input
                  id="username"
                  placeholder="Digite seu usuário"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isLoading || showFirstLoginModal}
                  autoFocus
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Digite sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading || showFirstLoginModal}
                />
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                size="lg"
                disabled={isLoading || showFirstLoginModal}
              >
                {isLoading ? 'Entrando...' : 'Entrar'}
              </Button>

              <button
                type="button"
                onClick={() => navigate('/recuperar-senha')}
                className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
                disabled={showFirstLoginModal}
              >
                Esqueci minha senha
              </button>
            </form>

            {/* ✅ MODAL DE PRIMEIRO LOGIN */}
            {showFirstLoginModal && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-6 p-6 bg-amber-50 dark:bg-amber-950 border-2 border-amber-500 rounded-lg"
              >
                <h3 className="text-lg font-bold mb-2 text-amber-800 dark:text-amber-200">
                  🔒 Primeiro Acesso
                </h3>
                <p className="text-sm text-amber-700 dark:text-amber-300 mb-4">
                  Por segurança, você deve alterar sua senha temporária.
                </p>

                <div className="space-y-3">
                  <div>
                    <Label htmlFor="newPassword">Nova Senha</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      placeholder="Digite a nova senha"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      disabled={changingPassword}
                    />
                  </div>

                  <div>
                    <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Confirme a nova senha"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={changingPassword}
                    />
                  </div>

                  <div className="bg-amber-100 dark:bg-amber-900 p-3 rounded text-xs">
                    <p className="font-semibold mb-1">Requisitos:</p>
                    <ul className="space-y-1 text-amber-800 dark:text-amber-200">
                      <li>• Mínimo 6 caracteres</li>
                      <li>• Diferente da senha temporária</li>
                      <li>• Evite senhas óbvias</li>
                    </ul>
                  </div>

                  <Button
                    onClick={handleChangePassword}
                    disabled={changingPassword || !newPassword || !confirmPassword}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    {changingPassword ? 'Alterando...' : 'Confirmar Nova Senha'}
                  </Button>
                </div>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
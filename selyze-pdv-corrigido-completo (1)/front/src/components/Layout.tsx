import { Outlet, useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import { useCashStore } from '@/store/cashStore';
import { Button } from '@/components/ui/Button';
import { Moon, Sun, LogOut } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import ConfirmModal from './modals/ConfirmModal';
import SystemAlerts from './SystemAlerts';

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const { openCash, fetchOpenCash } = useCashStore();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    fetchOpenCash();
  }, []);

  const handleLogout = async () => {
    if (openCash) {
      toast.error('Feche o caixa antes de sair');
      navigate('/caixa/fechar');
      return;
    }
    
    setShowLogoutConfirm(true);
  };

  const confirmLogout = async () => {
    await logout();
    toast.success('Logout realizado com sucesso');
    navigate('/login');
  };

  const getMenuItems = () => {
    const role = user?.role;
    
    const commonItems = [
      { path: '/', label: 'Dashboard' },
      { path: '/pdv', label: 'PDV' },
      { path: '/produtos', label: 'Produtos' },
    ];

    const gerenteItems = [
      ...commonItems,
      { path: '/despesas', label: 'Despesas' },
      { path: '/relatorios', label: 'Relatórios' },
    ];

    const adminItems = [
      ...gerenteItems,
      { path: '/usuarios', label: 'Usuários' },
      { path: '/configuracoes', label: 'Configurações' },
      { path: '/logs', label: 'Logs' },
    ];

    if (role === 'admin') return adminItems;
    if (role === 'gerente') return gerenteItems;
    return commonItems;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-8">
              <h1 className="text-xl font-bold">SELYZE PDV</h1>
              <nav className="hidden md:flex gap-4">
                {getMenuItems().map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`px-4 py-2 rounded-md transition-colors ${
                      location.pathname === item.path
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-accent'
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <div className="text-sm font-medium">{user?.name}</div>
                <div className="text-xs text-muted-foreground">
                  {user?.role === 'admin' ? 'Administrador' : user?.role === 'gerente' ? 'Gerente' : 'Caixa'}
                </div>
              </div>

              <SystemAlerts />

              <Button
                variant="ghost"
                size="sm"
                onClick={toggleTheme}
              >
                {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
              >
                <LogOut size={20} />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Caixa Status */}
      {openCash && (
        <div className="bg-primary/10 border-b border-primary/20 py-2">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-center text-sm">
              <span>✅ Caixa aberto desde: {new Date(openCash.opened_at).toLocaleString('pt-BR')}</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Modal de Confirmação de Logout */}
      <ConfirmModal
        open={showLogoutConfirm}
        onOpenChange={setShowLogoutConfirm}
        title="Confirmar Saída"
        description="Tem certeza que deseja sair do sistema?"
        onConfirm={confirmLogout}
      />
    </div>
  );
}

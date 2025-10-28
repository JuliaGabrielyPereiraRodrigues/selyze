import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import { useEffect, ReactNode } from 'react';

// Pages
import LoginPage from '@/pages/LoginPage';
import Dashboard from '@/pages/Dashboard';
import PDVPage from '@/pages/PDVPage';
import ProductsPage from '@/pages/ProductsPage';
import ExpensesPage from '@/pages/ExpensesPage';
import ReportsPage from '@/pages/ReportsPage';
import UsersPage from '@/pages/UsersPage';
import SettingsPage from '@/pages/SettingsPage';
import LogsPage from '@/pages/LogsPage';
import OpenCashPage from '@/pages/OpenCashPage';
import CloseCashPage from '@/pages/CloseCashPage';
import RecoverPasswordPage from '@/pages/RecoverPasswordPage';
import Layout from '@/components/Layout';

// Protected Route
function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
}

function App() {
  const { theme } = useThemeStore();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/recuperar-senha" element={<RecoverPasswordPage />} />
          
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="pdv" element={<PDVPage />} />
            <Route path="produtos" element={<ProductsPage />} />
            <Route path="despesas" element={<ExpensesPage />} />
            <Route path="relatorios" element={<ReportsPage />} />
            <Route path="usuarios" element={<UsersPage />} />
            <Route path="configuracoes" element={<SettingsPage />} />
            <Route path="logs" element={<LogsPage />} />
            <Route path="abrir-caixa" element={<OpenCashPage />} />
            <Route path="fechar-caixa" element={<CloseCashPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
      
      <Toaster 
        position="top-right"
        toastOptions={{
          style: {
            background: 'hsl(var(--card))',
            color: 'hsl(var(--foreground))',
            border: '1px solid hsl(var(--border))',
          },
        }}
      />
    </>
  );
}

export default App;

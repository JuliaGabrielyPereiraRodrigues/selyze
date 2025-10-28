import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useCashStore } from '@/store/cashStore';
import { useAuthStore } from '@/store/authStore';
import { useReports } from '@/hooks/useReports';
import { useNavigate } from 'react-router-dom';
import { DollarSign, ShoppingCart, TrendingUp, Package, Clock, AlertCircle, TrendingDown } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { openCash, fetchOpenCash } = useCashStore();
  const { dailyReport, isLoading, getDailyReport } = useReports();
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    console.log('Dashboard: Iniciando carregamento de dados');
    fetchOpenCash();
    getDailyReport(); // Busca relatório de hoje
    setGreetingMessage();
  }, []);

  const setGreetingMessage = () => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Bom dia');
    else if (hour < 18) setGreeting('Boa tarde');
    else setGreeting('Boa noite');
  };

  // Usa dados do relatório diário
  const displaySalesTotal = dailyReport?.sales_total || 0;
  const displaySalesCount = dailyReport?.sales_count || 0;
  const displayExpensesTotal = dailyReport?.expenses_total || 0;
  const displayNetProfit = dailyReport?.net_profit || 0;
  const totalProductsSold = dailyReport?.top_products?.reduce((sum, p) => sum + p.quantity, 0) || 0;

  console.log('Dashboard: Dados exibidos:', {
    displaySalesTotal,
    displaySalesCount,
    displayExpensesTotal,
    displayNetProfit,
    totalProductsSold,
    hasReport: !!dailyReport
  });

  const stats = [
    {
      title: 'Vendas Hoje',
      value: displaySalesCount,
      icon: ShoppingCart,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Faturamento',
      value: formatCurrency(displaySalesTotal),
      icon: DollarSign,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      title: 'Despesas Hoje',
      value: formatCurrency(displayExpensesTotal),
      icon: TrendingDown,
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
    },
    {
      title: 'Lucro Líquido',
      value: formatCurrency(displayNetProfit),
      icon: TrendingUp,
      color: displayNetProfit >= 0 ? 'text-green-500' : 'text-red-500',
      bgColor: displayNetProfit >= 0 ? 'bg-green-500/10' : 'bg-red-500/10',
    },
    {
      title: 'Produtos Vendidos',
      value: totalProductsSold,
      icon: Package,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando informações...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com saudação */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden bg-gradient-to-br from-primary/20 via-primary/10 to-transparent p-8 rounded-xl border border-primary/30 shadow-lg"
      >
        <div className="relative z-10">
          <h1 className="text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            {greeting}, {user?.name || 'Usuário'}!
          </h1>
          <p className="text-lg text-muted-foreground mb-4">
            {format(new Date(), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </p>
          
          {openCash ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400 bg-green-500/10 px-4 py-2 rounded-lg">
                <Clock className="h-5 w-5" />
                <span className="text-sm font-medium">
                  Caixa aberto desde {format(new Date(openCash.opened_at), "HH:mm")}
                </span>
              </div>
              <Button 
                size="sm"
                variant="outline"
                onClick={() => navigate('/fechar-caixa')}
                className="border-red-500 text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
              >
                Fechar Caixa
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 bg-amber-500/10 px-4 py-2 rounded-lg">
                <AlertCircle className="h-5 w-5" />
                <span className="text-sm font-medium">Caixa fechado</span>
              </div>
              <Button 
                size="sm"
                onClick={() => navigate('/abrir-caixa')}
                className="bg-green-600 hover:bg-green-700"
              >
                Abrir Caixa Agora
              </Button>
            </div>
          )}
        </div>
        
        {/* Background decorativo */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-0" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary/5 rounded-full blur-3xl -z-0" />
      </motion.div>

      {/* Cards de estatísticas */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="hover:shadow-lg transition-shadow duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Resumo Visual do Dia */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Meta de Vendas */}
        <Card className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-blue-500/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🎯 Meta do Dia
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const meta = 1500; // Meta fixa de R$ 1.500/dia (depois pode vir das configurações)
              const progresso = Math.min((displaySalesTotal / meta) * 100, 100);
              const faltam = Math.max(meta - displaySalesTotal, 0);
              
              return (
                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-sm text-muted-foreground">Vendido</p>
                      <p className="text-3xl font-bold">{formatCurrency(displaySalesTotal)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Meta</p>
                      <p className="text-2xl font-bold">{formatCurrency(meta)}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progresso</span>
                      <span className="font-bold">{progresso.toFixed(1)}%</span>
                    </div>
                    <div className="h-4 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progresso}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className={`h-full rounded-full ${
                          progresso >= 100 ? 'bg-green-500' : 
                          progresso >= 70 ? 'bg-blue-500' : 
                          'bg-orange-500'
                        }`}
                      />
                    </div>
                  </div>
                  
                  {progresso >= 100 ? (
                    <div className="p-3 bg-green-500/20 border border-green-500/30 rounded-lg text-center">
                      <p className="text-green-700 dark:text-green-400 font-semibold">
                        🎉 Parabéns! Meta batida!
                      </p>
                    </div>
                  ) : (
                    <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                      <p className="text-sm text-muted-foreground">
                        Faltam <span className="font-bold text-foreground">{formatCurrency(faltam)}</span> para bater a meta
                      </p>
                    </div>
                  )}
                </div>
              );
            })()}
          </CardContent>
        </Card>

        {/* Comparativo Semana */}
        <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              📊 Desempenho Semanal
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              // Simulação de dados da semana (depois pode vir da API)
              const mediaSemanal = displaySalesTotal > 0 ? displaySalesTotal : 800;
              const melhorDia = Math.max(displaySalesTotal, mediaSemanal * 1.2);
              const diasAbertos = 5; // Exemplo
              
              return (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-card rounded-lg border">
                      <p className="text-xs text-muted-foreground mb-1">Média/Dia</p>
                      <p className="text-xl font-bold">{formatCurrency(mediaSemanal)}</p>
                    </div>
                    <div className="p-3 bg-card rounded-lg border">
                      <p className="text-xs text-muted-foreground mb-1">Melhor Dia</p>
                      <p className="text-xl font-bold text-green-600">{formatCurrency(melhorDia)}</p>
                    </div>
                  </div>
                  
                  <div className="p-3 bg-card rounded-lg border">
                    <p className="text-xs text-muted-foreground mb-2">Dias em operação esta semana</p>
                    <div className="flex gap-2">
                      {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((dia, i) => (
                        <div
                          key={i}
                          className={`flex-1 h-12 flex items-center justify-center rounded-lg font-bold text-sm
                            ${i < diasAbertos 
                              ? 'bg-green-500/20 text-green-600 border border-green-500/30' 
                              : 'bg-muted text-muted-foreground'
                            }`}
                        >
                          {dia}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                    <p className="text-sm">
                      💡 <span className="font-semibold">Dica:</span> Você já trabalhou {diasAbertos} dias esta semana!
                    </p>
                  </div>
                </div>
              );
            })()}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { useReports } from '@/hooks/useReports';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion } from 'framer-motion';

export default function ReportsPage() {
  const {
    dailyReport,
    weeklyReport,
    monthlyReport,
    isLoading,
    getDailyReport,
    getWeeklyReport,
    getMonthlyReport,
    exportPDF,
    exportCSV,
  } = useReports();

  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedWeek, setSelectedWeek] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM-dd'));

  // Carrega relatórios apenas na montagem inicial
  useEffect(() => {
    console.log('🎬 Componente montado, carregando relatórios iniciais');
    getDailyReport();
    getWeeklyReport();
    getMonthlyReport();
  }, []); // SEM dependências - só roda uma vez

  // Handlers
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    console.log('📅 Data diária mudou para:', newDate);
    setSelectedDate(newDate);
    getDailyReport(new Date(newDate));
  };

  const handleWeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    console.log('📅 Data semanal mudou para:', newDate);
    setSelectedWeek(newDate);
    getWeeklyReport(new Date(newDate));
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const monthDate = e.target.value + '-01';
    console.log('📅 Mês mudou para:', monthDate);
    setSelectedMonth(monthDate);
    getMonthlyReport(new Date(monthDate));
  };

  const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'];

  const renderReportContent = (report: any, type: string) => {
    console.log(`🎨 [RENDER] Renderizando ${type}:`, {
      report_exists: !!report,
      isLoading,
      report_keys: report ? Object.keys(report) : 'null',
      sales_count: report?.sales_count,
      sales_total: report?.sales_total
    });

    if (isLoading) {
      return (
        <Card className="p-8 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-muted-foreground">Carregando relatório...</p>
          </div>
        </Card>
      );
    }

    if (!report) {
      console.log(`❌ [RENDER] ${type} sem dados - report é null/undefined`);
      return (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">Nenhum dado disponível para este período</p>
          <p className="text-xs text-muted-foreground mt-2">Verifique o console para mais detalhes</p>
        </Card>
      );
    }

    console.log(`✅ [RENDER] ${type} vai renderizar cards com dados`);

    // DEBUG: Mostra estrutura do relatório
    console.log('📊 Estrutura do relatório recebido:', {
      type,
      keys: Object.keys(report),
      sales_count: report.sales_count,
      sales_total: report.sales_total,
      has_payment_methods: !!report.payment_methods,
      has_top_products: !!report.top_products,
      full_report: report
    });

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-6"
      >
        {/* Cards de Resumo */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="p-4">
            <p className="text-sm text-muted-foreground mb-1">Vendas</p>
            <p className="text-2xl font-bold">{report.sales_count || 0}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-muted-foreground mb-1">Total Vendas</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              R$ {(report.sales_total || 0).toFixed(2)}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-muted-foreground mb-1">Ticket Médio</p>
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              R$ {report.sales_count > 0 ? (report.sales_total / report.sales_count).toFixed(2) : '0.00'}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-muted-foreground mb-1">Despesas</p>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
              R$ {(report.expenses_total || 0).toFixed(2)}
            </p>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-green-500/30">
            <p className="text-sm font-medium mb-1">Lucro Líquido</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              R$ {(report.net_profit || 0).toFixed(2)}
            </p>
          </Card>
        </div>

        {/* Card de Taxas iFood (se houver vendas iFood) */}
        {report.payment_methods && report.payment_methods.some((pm: any) => pm.payment_method === 'ifood') && (
          <Card className="p-6 bg-gradient-to-br from-orange-500/10 to-red-500/10 border-orange-500/30">
            <div className="flex items-start gap-3">
              <div className="p-3 bg-orange-500/20 rounded-lg">
                <svg className="w-6 h-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  💰 Análise de Vendas iFood
                  <span className="text-xs font-normal text-muted-foreground">(Comissão 12% + Taxa Pgto 3.2%)</span>
                </h3>
                
                {(() => {
                  const ifoodSales = report.payment_methods.find((pm: any) => pm.payment_method === 'ifood');
                  const ifoodTotal = ifoodSales?.total || 0;
                  const commission = ifoodTotal * 0.12; // 12%
                  const paymentFee = ifoodTotal * 0.032; // 3.2%
                  const totalFees = commission + paymentFee;
                  const netIfood = ifoodTotal - totalFees;
                  
                  return (
                    <div className="grid md:grid-cols-4 gap-4">
                      <div className="bg-card/50 p-4 rounded-lg border border-border">
                        <p className="text-xs text-muted-foreground mb-1">Total iFood</p>
                        <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                          R$ {ifoodTotal.toFixed(2)}
                        </p>
                      </div>
                      
                      <div className="bg-card/50 p-4 rounded-lg border border-border">
                        <p className="text-xs text-muted-foreground mb-1">Comissão iFood (12%)</p>
                        <p className="text-xl font-bold text-red-600 dark:text-red-400">
                          - R$ {commission.toFixed(2)}
                        </p>
                      </div>
                      
                      <div className="bg-card/50 p-4 rounded-lg border border-border">
                        <p className="text-xs text-muted-foreground mb-1">Taxa Pagamento (3.2%)</p>
                        <p className="text-xl font-bold text-red-600 dark:text-red-400">
                          - R$ {paymentFee.toFixed(2)}
                        </p>
                      </div>
                      
                      <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 p-4 rounded-lg border border-green-500/50">
                        <p className="text-xs font-medium mb-1">Você Recebe</p>
                        <p className="text-xl font-bold text-green-600 dark:text-green-400">
                          R$ {netIfood.toFixed(2)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          ({((netIfood / ifoodTotal) * 100).toFixed(1)}% do total)
                        </p>
                      </div>
                    </div>
                  );
                })()}
                
                <div className="mt-3 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                  <p className="text-xs text-amber-700 dark:text-amber-400">
                    💡 <strong>Dica:</strong> O iFood desconta 15.2% do total (12% comissão + 3.2% taxa de pagamento). 
                    Considere isso ao precificar seus produtos!
                  </p>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Gráficos de pagamento */}
        {report.payment_methods && report.payment_methods.length > 0 && (
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Métodos de Pagamento</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={report.payment_methods}
                      dataKey="total"
                      nameKey="payment_method"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={(entry) => `${entry.payment_method}: R$ ${entry.total.toFixed(2)}`}
                    >
                      {report.payment_methods.map((_: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => `R$ ${parseFloat(value).toFixed(2)}`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Distribuição de Receita</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={report.payment_methods}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="payment_method" stroke="hsl(var(--foreground))" />
                    <YAxis stroke="hsl(var(--foreground))" />
                    <Tooltip
                      formatter={(value: any) => `R$ ${parseFloat(value).toFixed(2)}`}
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                    />
                    <Bar dataKey="total" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
        )}

        {/* Top Produtos */}
        {report.top_products && report.top_products.length > 0 && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Top 10 Produtos Mais Vendidos</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2">Posição</th>
                    <th className="text-left py-3 px-2">Produto</th>
                    <th className="text-right py-3 px-2">Quantidade</th>
                    <th className="text-right py-3 px-2">Total Vendido</th>
                  </tr>
                </thead>
                <tbody>
                  {report.top_products.map((product: any, idx: number) => (
                    <tr key={idx} className="border-b hover:bg-muted/50 transition-colors">
                      <td className="py-3 px-2">
                        <span
                          className={`inline-flex items-center justify-center w-7 h-7 rounded-full font-bold text-xs
                          ${idx === 0 ? 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400' : ''}
                          ${idx === 1 ? 'bg-gray-500/20 text-gray-600 dark:text-gray-400' : ''}
                          ${idx === 2 ? 'bg-orange-500/20 text-orange-600 dark:text-orange-400' : ''}
                          ${idx > 2 ? 'bg-muted text-muted-foreground' : ''}`}
                        >
                          {idx + 1}
                        </span>
                      </td>
                      <td className="py-3 px-2 font-medium">{product.product_name}</td>
                      <td className="text-right py-3 px-2">{product.quantity}</td>
                      <td className="text-right py-3 px-2 font-semibold text-primary">
                        R$ {(product.total || 0).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </motion.div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Relatórios Gerenciais</h1>
          <p className="text-muted-foreground">Visualize o desempenho do seu negócio</p>
        </div>
      </div>

      <Tabs defaultValue="daily" className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto">
          <TabsTrigger value="daily">📅 Diário</TabsTrigger>
          <TabsTrigger value="weekly">📊 Semanal</TabsTrigger>
          <TabsTrigger value="monthly">📈 Mensal</TabsTrigger>
        </TabsList>

        {/* Diário */}
        <TabsContent value="daily" className="space-y-6 mt-6">
          <Card className="p-6">
            <div className="flex items-end gap-4 flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <label className="text-sm font-medium mb-2 block">Selecionar Data</label>
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={handleDateChange}
                  className="h-10"
                  max={format(new Date(), 'yyyy-MM-dd')}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => exportCSV(selectedDate, selectedDate)}
                  disabled={!dailyReport || isLoading}
                  variant="outline"
                >
                  📊 Exportar CSV
                </Button>
                <Button
                  onClick={() => exportPDF('daily', { date: selectedDate })}
                  disabled={!dailyReport || isLoading}
                >
                  📄 Exportar PDF
                </Button>
              </div>
            </div>
          </Card>

          {renderReportContent(dailyReport, 'daily')}
        </TabsContent>

        {/* Semanal */}
        <TabsContent value="weekly" className="space-y-6 mt-6">
          <Card className="p-6">
            <div className="flex items-end gap-4 flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <label className="text-sm font-medium mb-2 block">Selecionar Semana</label>
                <Input
                  type="date"
                  value={selectedWeek}
                  onChange={handleWeekChange}
                  className="h-10"
                  max={format(new Date(), 'yyyy-MM-dd')}
                />
                {selectedWeek && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Período:{' '}
                    {format(startOfWeek(new Date(selectedWeek), { weekStartsOn: 0 }), 'dd/MM/yyyy', { locale: ptBR })} até{' '}
                    {format(endOfWeek(new Date(selectedWeek), { weekStartsOn: 0 }), 'dd/MM/yyyy', { locale: ptBR })}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    const start = format(startOfWeek(new Date(selectedWeek), { weekStartsOn: 0 }), 'yyyy-MM-dd');
                    const end = format(endOfWeek(new Date(selectedWeek), { weekStartsOn: 0 }), 'yyyy-MM-dd');
                    exportCSV(start, end);
                  }}
                  disabled={!weeklyReport || isLoading}
                  variant="outline"
                >
                  📊 Exportar CSV
                </Button>
                <Button
                  onClick={() => exportPDF('weekly', { date: selectedWeek })}
                  disabled={!weeklyReport || isLoading}
                >
                  📄 Exportar PDF
                </Button>
              </div>
            </div>
          </Card>

          {renderReportContent(weeklyReport, 'weekly')}
        </TabsContent>

        {/* Mensal */}
        <TabsContent value="monthly" className="space-y-6 mt-6">
          <Card className="p-6">
            <div className="flex items-end gap-4 flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <label className="text-sm font-medium mb-2 block">Selecionar Mês</label>
                <Input
                  type="month"
                  value={selectedMonth.substring(0, 7)}
                  onChange={handleMonthChange}
                  className="h-10"
                  max={format(new Date(), 'yyyy-MM')}
                />
                {selectedMonth && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Período:{' '}
                    {format(startOfMonth(new Date(selectedMonth)), 'dd/MM/yyyy', { locale: ptBR })} até{' '}
                    {format(endOfMonth(new Date(selectedMonth)), 'dd/MM/yyyy', { locale: ptBR })}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    const start = format(startOfMonth(new Date(selectedMonth)), 'yyyy-MM-dd');
                    const end = format(endOfMonth(new Date(selectedMonth)), 'yyyy-MM-dd');
                    exportCSV(start, end);
                  }}
                  disabled={!monthlyReport || isLoading}
                  variant="outline"
                >
                  📊 Exportar CSV
                </Button>
                <Button
                  onClick={() => exportPDF('monthly', { date: selectedMonth })}
                  disabled={!monthlyReport || isLoading}
                >
                  📄 Exportar PDF
                </Button>
              </div>
            </div>
          </Card>

          {renderReportContent(monthlyReport, 'monthly')}
        </TabsContent>
      </Tabs>
    </div>
  );
}
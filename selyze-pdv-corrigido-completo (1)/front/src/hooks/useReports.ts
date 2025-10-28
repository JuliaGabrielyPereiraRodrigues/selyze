import { useState, useEffect } from 'react';
import { DailyReport } from '@/types';
import api from '@/lib/api';
import { toast } from 'sonner';
import { formatISO } from 'date-fns';

export function useReports() {
  const [dailyReport, setDailyReport] = useState<DailyReport | null>(null);
  const [weeklyReport, setWeeklyReport] = useState<any>(null);
  const [monthlyReport, setMonthlyReport] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  // DEBUG: Log sempre que os estados mudarem
  useEffect(() => {
    console.log('🔄 [STATE] dailyReport mudou:', dailyReport);
  }, [dailyReport]);

  useEffect(() => {
    console.log('🔄 [STATE] weeklyReport mudou:', weeklyReport);
  }, [weeklyReport]);

  useEffect(() => {
    console.log('🔄 [STATE] monthlyReport mudou:', monthlyReport);
  }, [monthlyReport]);

  // ✅ DIÁRIO: Usa /reports/daily SEM query param (usa data atual do servidor)
  const getDailyReport = async (date?: Date) => {
    setIsLoading(true);
    try {
      const targetDate = date || new Date();
      const dateStr = formatISO(targetDate, { representation: 'date' });

      console.log('📊 [DIÁRIO] Buscando relatório para:', dateStr);

      // Sempre envia o parâmetro date
      const response = await api.get('/reports/daily', { 
        params: { date: dateStr }
      });
      
      console.log('✅ [DIÁRIO] Relatório recebido:', {
        status: response.status,
        data: response.data,
        has_sales_count: 'sales_count' in response.data,
        has_payment_methods: 'payment_methods' in response.data,
        has_top_products: 'top_products' in response.data,
        sales_count_value: response.data.sales_count,
        sales_total_value: response.data.sales_total,
        payment_methods_length: response.data.payment_methods?.length,
        top_products_length: response.data.top_products?.length
      });

      setDailyReport(response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ [DIÁRIO] Erro completo:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        url: error.config?.url
      });
      toast.error('Erro ao carregar relatório diário');
      setDailyReport(null);
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ SEMANAL: Usa /reports/weekly SEM query param (usa semana atual do servidor)
  const getWeeklyReport = async (date?: Date) => {
    setIsLoading(true);
    try {
      const targetDate = date || new Date();
      const dateStr = formatISO(targetDate, { representation: 'date' });

      console.log('📊 [SEMANAL] Buscando relatório para:', dateStr);

      // Sempre envia o parâmetro date
      const response = await api.get('/reports/weekly', { 
        params: { date: dateStr }
      });

      console.log('✅ [SEMANAL] Relatório recebido:', {
        status: response.status,
        data: response.data,
        has_sales_count: 'sales_count' in response.data,
        has_payment_methods: 'payment_methods' in response.data,
        has_top_products: 'top_products' in response.data,
        sales_count_value: response.data.sales_count,
        sales_total_value: response.data.sales_total,
        payment_methods_length: response.data.payment_methods?.length,
        top_products_length: response.data.top_products?.length
      });

      setWeeklyReport(response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ [SEMANAL] Erro completo:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        url: error.config?.url
      });
      toast.error('Erro ao carregar relatório semanal');
      setWeeklyReport(null);
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ MENSAL: Usa /reports/monthly com query param
  const getMonthlyReport = async (date?: Date) => {
    setIsLoading(true);
    try {
      const targetDate = date || new Date();
      const dateStr = formatISO(targetDate, { representation: 'date' });

      const response = await api.get('/reports/monthly', {
        params: { date: dateStr }
      });

      console.log('✅ Relatório mensal carregado:', response.data);
      setMonthlyReport(response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Erro ao carregar relatório mensal:', error);
      toast.error('Erro ao carregar relatório mensal');
      setMonthlyReport(null);
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ EXPORT PDF: Usa a rota correta do backend /reports/export-pdf
  const exportPDF = async (type: 'daily' | 'weekly' | 'monthly', params?: any) => {
    try {
      const targetDate = params?.date ? new Date(params.date) : new Date();
      let startDate: Date;
      let endDate: Date;

      if (type === 'daily') {
        startDate = new Date(targetDate);
        endDate = new Date(targetDate);
      } else if (type === 'weekly') {
        startDate = new Date(targetDate);
        startDate.setDate(targetDate.getDate() - targetDate.getDay());
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
      } else {
        startDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
        endDate = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0);
      }

      const startStr = formatISO(startDate, { representation: 'date' });
      const endStr = formatISO(endDate, { representation: 'date' });

      console.log('📄 Exportando PDF:', { start_date: startStr, end_date: endStr });

      const response = await api.get('/reports/export-pdf', {
        params: { 
          start_date: startStr, 
          end_date: endStr 
        },
        responseType: 'blob',
        timeout: 30000 // 30 segundos de timeout
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `relatorio-${type}-${startStr}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Relatório exportado com sucesso!');
    } catch (error: any) {
      console.error('❌ Erro ao exportar PDF:', error.response?.data || error.message);
      
      if (error.code === 'ECONNABORTED') {
        toast.error('Tempo esgotado ao gerar PDF. Tente um período menor.');
      } else if (error.response?.status === 500) {
        toast.error('Erro no servidor ao gerar PDF. Verifique os logs do backend.');
      } else {
        toast.error('Erro ao exportar relatório');
      }
    }
  };

  // ✅ EXPORT CSV: Usa /reports/export-csv
  const exportCSV = async (startDate: string, endDate: string) => {
    try {
      console.log('📊 Exportando CSV:', { start_date: startDate, end_date: endDate });

      const response = await api.get('/reports/export-csv', {
        params: { start_date: startDate, end_date: endDate },
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'text/csv' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `relatorio-${startDate}-a-${endDate}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('CSV exportado com sucesso!');
    } catch (error: any) {
      console.error('❌ Erro ao exportar CSV:', error);
      toast.error('Erro ao exportar CSV');
    }
  };

  // Carrega relatório diário na inicialização
  useEffect(() => {
    getDailyReport();
  }, []);

  return {
    dailyReport,
    weeklyReport,
    monthlyReport,
    isLoading,
    getDailyReport,
    getWeeklyReport,
    getMonthlyReport,
    exportPDF,
    exportCSV,
  };
}
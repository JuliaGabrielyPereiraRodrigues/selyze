import { useEffect } from 'react';
import { useSaleStore } from '@/store/saleStore';
import { useCashStore } from '@/store/cashStore';

export function useSales() {
  const saleStore = useSaleStore();
  const { currentSession } = useCashStore();

  useEffect(() => {
    if (currentSession) {
      saleStore.getSales(currentSession.id);
    }
  }, [currentSession?.id]);

  const totalSales = saleStore.sales.reduce((sum, sale) => sum + sale.total, 0);
  const totalItems = saleStore.sales.reduce((sum, sale) => {
    const items = sale.payment_details ? JSON.parse(sale.payment_details) : [];
    return sum + items.length;
  }, 0);

  return {
    ...saleStore,
    totalSales,
    totalItems,
    salesCount: saleStore.sales.length,
  };
}

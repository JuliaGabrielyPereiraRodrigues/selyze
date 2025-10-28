import { useState, useEffect } from 'react';
import api from '@/lib/api';

interface StoreSettings {
  store_name: string;
  store_address: string;
  store_phone: string;
  store_cnpj: string;
  auto_print: boolean;
  printer_enabled: boolean;
}

export function useStoreSettings() {
  const [settings, setSettings] = useState<StoreSettings>({
    store_name: 'PDV Marmitaria',
    store_address: '',
    store_phone: '',
    store_cnpj: '',
    auto_print: true,
    printer_enabled: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await api.get('/settings');
      const data = response.data;
      
      setSettings({
        store_name: data.store_name || 'PDV Marmitaria',
        store_address: data.store_address || '',
        store_phone: data.store_phone || '',
        store_cnpj: data.store_cnpj || '',
        auto_print: data.auto_print === 'true' || data.auto_print === true,
        printer_enabled: data.printer_enabled === 'true' || data.printer_enabled === true,
      });
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    } finally {
      setLoading(false);
    }
  };

  return { settings, loading, reload: loadSettings };
}
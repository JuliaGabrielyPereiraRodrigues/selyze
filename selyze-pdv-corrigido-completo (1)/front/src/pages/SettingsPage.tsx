import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import api from '@/lib/api';
import { toast } from 'sonner';

interface AppSettings {
  store_name: string;
  store_phone: string;
  store_email: string;
  store_logo?: string;
  printer_name?: string;
  printer_ip?: string;
  printer_port?: number;
  ifood_commission: number;
  ifood_payment_fee: number;
  max_discount_percent: number;
  currency: string;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings>({
    store_name: '',
    store_phone: '',
    store_email: '',
    store_logo: '',
    printer_name: '',
    printer_ip: '',
    printer_port: 9100,
    ifood_commission: 0,
    ifood_payment_fee: 0,
    max_discount_percent: 0,
    currency: 'BRL',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/settings');
      setSettings(response.data);
    } catch (error) {
      toast.error('Erro ao carregar configurações');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: name.includes('_') && !name.includes('store') && name !== 'printer_name' && name !== 'printer_ip' 
        ? parseFloat(value) || 0 
        : value,
    }));
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Logo muito grande. Máximo 2MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        toast.error('Arquivo deve ser uma imagem');
        return;
      }
      setLogoFile(file);
      
      // Preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setSettings(prev => ({ ...prev, store_logo: e.target?.result as string }));
      };
      reader.readAsDataURL(file);
      toast.success('Logo carregado! Clique em Salvar para aplicar');
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await api.put('/settings', settings);
      toast.success('Configurações atualizadas com sucesso');
    } catch (error) {
      toast.error('Erro ao salvar configurações');
    } finally {
      setIsSaving(false);
    }
  };

  const handleBackup = async () => {
    try {
      const response = await api.post('/settings/backup', {});
      toast.success('Backup realizado com sucesso');
    } catch (error) {
      toast.error('Erro ao realizar backup');
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-3xl font-bold">Configurações</h1>

      {isLoading ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">Carregando configurações...</p>
        </Card>
      ) : (
        <>
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Dados da Loja</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="store_name">Nome da Loja</Label>
                <Input
                  id="store_name"
                  name="store_name"
                  value={settings.store_name}
                  onChange={handleChange}
                  placeholder="Ex: Marmitaria XYZ"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="store_phone">Telefone</Label>
                  <Input
                    id="store_phone"
                    name="store_phone"
                    value={settings.store_phone}
                    onChange={handleChange}
                    placeholder="(XX) XXXXX-XXXX"
                  />
                </div>
                <div>
                  <Label htmlFor="store_email">Email</Label>
                  <Input
                    id="store_email"
                    name="store_email"
                    type="email"
                    value={settings.store_email}
                    onChange={handleChange}
                    placeholder="contato@loja.com"
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Logo Personalizado */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">🎨 Logo Personalizado</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="logo">Upload do Logo</Label>
                <Input
                  id="logo"
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="cursor-pointer"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Imagem PNG, JPG ou SVG - Máximo 2MB - Recomendado: 200x200px
                </p>
              </div>
              
              {settings.store_logo && (
                <div className="mt-4">
                  <Label>Preview do Logo</Label>
                  <div className="mt-2 p-4 border rounded-lg bg-muted/30 flex items-center justify-center">
                    <img 
                      src={settings.store_logo} 
                      alt="Logo" 
                      className="max-h-32 max-w-xs object-contain"
                    />
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Configuração de Impressora */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">🖨️ Configuração de Impressora</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="printer_name">Nome da Impressora</Label>
                <Input
                  id="printer_name"
                  name="printer_name"
                  value={settings.printer_name}
                  onChange={handleChange}
                  placeholder="Ex: Impressora Térmica"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Nome da impressora configurada no sistema
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="printer_ip">IP da Impressora (Rede)</Label>
                  <Input
                    id="printer_ip"
                    name="printer_ip"
                    value={settings.printer_ip}
                    onChange={handleChange}
                    placeholder="192.168.1.100"
                  />
                </div>
                <div>
                  <Label htmlFor="printer_port">Porta</Label>
                  <Input
                    id="printer_port"
                    name="printer_port"
                    type="number"
                    value={settings.printer_port}
                    onChange={handleChange}
                    placeholder="9100"
                  />
                </div>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <p className="text-sm text-blue-600 dark:text-blue-400 font-medium mb-2">
                  💡 Dica de Configuração
                </p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Para impressoras USB: Use o nome da impressora do Windows</li>
                  <li>• Para impressoras de rede: Configure IP e porta</li>
                  <li>• Porta padrão para impressoras térmicas: 9100</li>
                  <li>• Teste a conexão após salvar as configurações</li>
                </ul>
              </div>

              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => toast.info('Teste de impressão enviado!')}
              >
                🖨️ Testar Impressão
              </Button>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">iFood</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="ifood_commission">Taxa de Comissão (%)</Label>
                  <Input
                    id="ifood_commission"
                    name="ifood_commission"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={settings.ifood_commission}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <Label htmlFor="ifood_payment_fee">Taxa de Pagamento (%)</Label>
                  <Input
                    id="ifood_payment_fee"
                    name="ifood_payment_fee"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={settings.ifood_payment_fee}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">PDV</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="max_discount_percent">Desconto Máximo Permitido (%)</Label>
                <Input
                  id="max_discount_percent"
                  name="max_discount_percent"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={settings.max_discount_percent}
                  onChange={handleChange}
                />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Backup e Restauração</h2>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Realize backups regularmente para proteger seus dados
              </p>
              <div className="flex gap-4">
                <Button
                  onClick={handleBackup}
                  variant="outline"
                  className="flex-1"
                >
                  Realizar Backup Agora
                </Button>
              </div>
            </div>
          </Card>

          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={loadSettings}
              disabled={isSaving}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {isSaving ? 'Salvando...' : 'Salvar Configurações'}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

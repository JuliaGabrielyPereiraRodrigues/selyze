import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { AuditLog } from '@/types';
import api from '@/lib/api';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function LogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filterUser, setFilterUser] = useState('');
  const [filterAction, setFilterAction] = useState('');
  const [filterDate, setFilterDate] = useState('');

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    setIsLoading(true);
    try {
      const params: any = {};
      if (filterUser) params.user_id = filterUser;
      if (filterAction) params.action = filterAction;
      if (filterDate) params.date = filterDate;

      const response = await api.get('/logs', { params });
      setLogs(response.data);
    } catch (error) {
      toast.error('Erro ao carregar logs');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const response = await api.get('/logs/export', {
        params: {
          user_id: filterUser,
          action: filterAction,
          date: filterDate,
        },
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `logs-${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (error) {
      toast.error('Erro ao exportar logs');
    }
  };

  const handleClearFilters = () => {
    setFilterUser('');
    setFilterAction('');
    setFilterDate('');
  };

  const actionColors: Record<string, string> = {
    'CREATE': 'bg-green-500/20 text-green-600 dark:text-green-400 border border-green-500/30',
    'UPDATE': 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30',
    'DELETE': 'bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/30',
    'LOGIN': 'bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/30',
    'LOGOUT': 'bg-gray-500/20 text-gray-600 dark:text-gray-400 border border-gray-500/30',
    'OPEN_CASH': 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30',
    'CLOSE_CASH': 'bg-orange-500/20 text-orange-600 dark:text-orange-400 border border-orange-500/30',
    'CANCEL': 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30',
  };

  const getActionDescription = (action: string, entityType: string) => {
    const descriptions: Record<string, string> = {
      'CREATE': 'Criou',
      'UPDATE': 'Atualizou',
      'DELETE': 'Excluiu',
      'LOGIN': 'Entrou no sistema',
      'LOGOUT': 'Saiu do sistema',
      'OPEN_CASH': 'Abriu o caixa',
      'CLOSE_CASH': 'Fechou o caixa',
      'CANCEL': 'Cancelou',
    };

    const entityNames: Record<string, string> = {
      'user': 'usuário',
      'product': 'produto',
      'sale': 'venda',
      'expense': 'despesa',
      'cash_session': 'sessão de caixa',
      'settings': 'configurações',
      'backup': 'backup',
    };

    const actionDesc = descriptions[action] || action;
    const entityName = entityNames[entityType] || entityType;
    
    if (action === 'LOGIN' || action === 'LOGOUT') {
      return actionDesc;
    }
    
    return `${actionDesc} ${entityName}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Logs de Auditoria</h1>
        <Button
          onClick={handleExport}
          disabled={logs.length === 0}
          variant="outline"
        >
          Exportar CSV
        </Button>
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Filtros</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label className="text-xs mb-2 block">ID do Usuário</Label>
            <Input
              type="number"
              value={filterUser}
              onChange={(e) => setFilterUser(e.target.value)}
              placeholder="Filtrar por ID..."
            />
          </div>
          <div>
            <Label className="text-xs mb-2 block">Ação</Label>
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
            >
              <option value="">Todas as ações</option>
              <option value="CREATE">Criar</option>
              <option value="UPDATE">Atualizar</option>
              <option value="DELETE">Deletar</option>
              <option value="LOGIN">Login</option>
              <option value="LOGOUT">Logout</option>
            </select>
          </div>
          <div>
            <Label className="text-xs mb-2 block">Data</Label>
            <Input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
            />
          </div>
        </div>

        <div className="flex gap-4 mt-4">
          <Button
            onClick={loadLogs}
            className="flex-1"
          >
            Filtrar
          </Button>
          <Button
            variant="outline"
            onClick={handleClearFilters}
            className="flex-1"
          >
            Limpar Filtros
          </Button>
        </div>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Usuário</TableHead>
              <TableHead>Ação</TableHead>
              <TableHead>Data/Hora</TableHead>
              <TableHead>Detalhes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  <p className="text-muted-foreground">Carregando logs...</p>
                </TableCell>
              </TableRow>
            ) : logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  <p className="text-muted-foreground">Nenhum log encontrado</p>
                </TableCell>
              </TableRow>
            ) : (
              logs.map(log => (
                <TableRow key={log.id}>
                  <TableCell className="text-sm font-mono">#{log.id}</TableCell>
                  <TableCell className="text-sm">
                    {log.user_id ? (
                      <div className="flex flex-col">
                        <span className="font-medium">{(log as any).user_name || `Usuário #${log.user_id}`}</span>
                        {(log as any).username && (
                          <span className="text-xs text-muted-foreground">@{(log as any).username}</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Sistema</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className={`px-3 py-1.5 rounded-md text-xs font-medium ${
                      actionColors[log.action] || 'bg-gray-500/20 text-gray-600 dark:text-gray-400'
                    }`}>
                      {getActionDescription(log.action, log.entity_type)}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(log.created_at), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })}
                  </TableCell>
                  <TableCell className="text-xs max-w-xs">
                    {log.new_values ? (
                      <details className="cursor-pointer">
                        <summary className="text-primary hover:underline">Ver detalhes</summary>
                        <div className="mt-2 p-2 bg-muted rounded text-xs">
                          <pre className="whitespace-pre-wrap">{JSON.stringify(JSON.parse(log.new_values), null, 2)}</pre>
                        </div>
                      </details>
                    ) : log.old_values ? (
                      <details className="cursor-pointer">
                        <summary className="text-primary hover:underline">Ver detalhes</summary>
                        <div className="mt-2 p-2 bg-muted rounded text-xs">
                          <pre className="whitespace-pre-wrap">{JSON.stringify(JSON.parse(log.old_values), null, 2)}</pre>
                        </div>
                      </details>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

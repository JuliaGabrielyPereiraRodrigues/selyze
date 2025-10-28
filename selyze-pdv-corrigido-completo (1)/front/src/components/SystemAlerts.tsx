import { useState, useEffect } from 'react';
import { Bell, X, Check, AlertCircle, AlertTriangle, Info, Archive } from 'lucide-react';
import { Button } from './ui/Button';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/api';
import { Notification } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

export default function SystemAlerts() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    fetchNotifications();
    // Atualizar a cada 30 segundos
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await api.get<Notification[]>('/notifications');
      setNotifications(response.data);
    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
    }
  };

  const markAsRead = async (id: number) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, read: 1 } : n))
      );
    } catch (error) {
      toast.error('Erro ao marcar notificação como lida');
    }
  };

  const markAllAsRead = async () => {
    setIsLoading(true);
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, read: 1 })));
      toast.success('Todas notificações marcadas como lidas');
    } catch (error) {
      toast.error('Erro ao marcar notificações');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteNotification = async (id: number) => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n.id !== id));
      toast.success('Notificação removida');
    } catch (error) {
      toast.error('Erro ao remover notificação');
    }
  };

  const getIcon = (type: Notification['type']) => {
    const iconClass = 'w-5 h-5';
    switch (type) {
      case 'estoque_baixo':
        return <AlertTriangle className={`${iconClass} text-yellow-500`} />;
      case 'backup_pendente':
        return <Archive className={`${iconClass} text-blue-500`} />;
      case 'venda_cancelada':
        return <AlertCircle className={`${iconClass} text-red-500`} />;
      case 'caixa_aberto':
        return <Info className={`${iconClass} text-green-500`} />;
      case 'sistema':
      default:
        return <Bell className={`${iconClass} text-gray-500`} />;
    }
  };

  return (
    <div className="relative">
      {/* Botão de Notificações */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-accent transition-colors"
        aria-label="Notificações"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Painel de Notificações */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Overlay */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Painel */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 mt-2 w-96 max-h-[600px] bg-card border border-border rounded-lg shadow-2xl z-50 overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="p-4 border-b border-border bg-muted/30">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-lg">Notificações</h3>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1 hover:bg-accent rounded-md transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>
                
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={markAllAsRead}
                    disabled={isLoading}
                    className="w-full text-xs"
                  >
                    <Check size={14} className="mr-1" />
                    Marcar todas como lidas
                  </Button>
                )}
              </div>

              {/* Lista de Notificações */}
              <div className="overflow-y-auto flex-1">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    <Bell size={48} className="mx-auto mb-3 opacity-30" />
                    <p className="text-sm">Nenhuma notificação</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {notifications.map((notification) => (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className={`p-4 hover:bg-accent/50 transition-colors cursor-pointer ${
                          !notification.read ? 'bg-primary/5' : ''
                        }`}
                        onClick={() => !notification.read && markAsRead(notification.id)}
                      >
                        <div className="flex gap-3">
                          {/* Ícone */}
                          <div className="flex-shrink-0 mt-0.5">
                            {getIcon(notification.type)}
                          </div>

                          {/* Conteúdo */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="font-medium text-sm leading-tight">
                                {notification.title}
                              </h4>
                              {!notification.read && (
                                <span className="flex-shrink-0 w-2 h-2 bg-primary rounded-full mt-1" />
                              )}
                            </div>
                            
                            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                              {notification.message}
                            </p>
                            
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(notification.created_at), {
                                  addSuffix: true,
                                  locale: ptBR,
                                })}
                              </span>
                              
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteNotification(notification.id);
                                }}
                                className="text-xs text-red-600 hover:text-red-700 hover:underline"
                              >
                                Remover
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              {notifications.length > 0 && (
                <div className="p-3 border-t border-border bg-muted/30">
                  <p className="text-xs text-center text-muted-foreground">
                    {notifications.length} notificação{notifications.length !== 1 && 'ões'} no total
                  </p>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

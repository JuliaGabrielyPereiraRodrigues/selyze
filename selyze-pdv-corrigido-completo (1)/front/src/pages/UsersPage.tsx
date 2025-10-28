import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { useUsers } from '@/hooks/useUsers';
import UserModal from '@/components/modals/UserModal';
import ConfirmModal from '@/components/modals/ConfirmModal';
import { User } from '@/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function UsersPage() {
  const {
    users,
    isLoading,
    createUser,
    updateUser,
    deleteUser,
    resetPassword,
  } = useUsers();

  const [userModal, setUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [resetTarget, setResetTarget] = useState<User | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  const handleCreate = async (data: Partial<User>) => {
    setModalLoading(true);
    try {
      await createUser(data as any);
      setUserModal(false);
      setSelectedUser(null);
    } finally {
      setModalLoading(false);
    }
  };

  const handleUpdate = async (data: Partial<User>) => {
    if (!selectedUser) return;
    setModalLoading(true);
    try {
      await updateUser(selectedUser.id, data);
      setUserModal(false);
      setSelectedUser(null);
    } finally {
      setModalLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setModalLoading(true);
    try {
      await deleteUser(deleteTarget.id);
      setConfirmDelete(false);
      setDeleteTarget(null);
    } finally {
      setModalLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resetTarget) return;
    setModalLoading(true);
    try {
      await resetPassword(resetTarget.id);
      setConfirmReset(false);
      setResetTarget(null);
    } finally {
      setModalLoading(false);
    }
  };

  const roleLabels = {
    admin: 'Administrador',
    gerente: 'Gerente',
    caixa: 'Operador de Caixa',
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Usuários</h1>
        <Button
          onClick={() => {
            setSelectedUser(null);
            setUserModal(true);
          }}
          className="bg-green-600 hover:bg-green-700"
        >
          + Novo Usuário
        </Button>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome de Usuário</TableHead>
              <TableHead>Nome Completo</TableHead>
              <TableHead>Perfil</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Primeiro Login</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <p className="text-muted-foreground">Carregando usuários...</p>
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <p className="text-muted-foreground">Nenhum usuário encontrado</p>
                </TableCell>
              </TableRow>
            ) : (
              users.map(user => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.username}</TableCell>
                  <TableCell>{user.name}</TableCell>
                  <TableCell className="text-sm">{roleLabels[user.role]}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      user.active ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'
                    }`}>
                      {user.active ? 'Ativo' : 'Inativo'}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm">
                    {user.first_login ? (
                      <span className="text-orange-500">Pendente</span>
                    ) : (
                      format(new Date(user.created_at), 'dd/MM/yyyy', { locale: ptBR })
                    )}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedUser(user);
                        setUserModal(true);
                      }}
                    >
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setResetTarget(user);
                        setConfirmReset(true);
                      }}
                    >
                      Resetar Senha
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        setDeleteTarget(user);
                        setConfirmDelete(true);
                      }}
                    >
                      Remover
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <UserModal
        open={userModal}
        onOpenChange={setUserModal}
        user={selectedUser || undefined}
        onSave={selectedUser ? handleUpdate : handleCreate}
        isLoading={modalLoading}
      />

      <ConfirmModal
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Confirmar exclusão"
        description={`Deseja realmente remover o usuário "${deleteTarget?.username}"?`}
        confirmText="Remover"
        cancelText="Cancelar"
        isDestructive
        isLoading={modalLoading}
        onConfirm={handleDelete}
      />

      <ConfirmModal
        open={confirmReset}
        onOpenChange={setConfirmReset}
        title="Resetar Senha"
        description={`Deseja resetar a senha do usuário "${resetTarget?.username}"? Uma nova senha será enviada por email.`}
        confirmText="Resetar"
        cancelText="Cancelar"
        isLoading={modalLoading}
        onConfirm={handleResetPassword}
      />
    </div>
  );
}

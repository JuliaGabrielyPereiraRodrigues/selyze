import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { useExpenses } from '@/hooks/useExpenses';
import ExpenseModal from '@/components/modals/ExpenseModal';
import ConfirmModal from '@/components/modals/ConfirmModal';
import { Expense } from '@/types';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function ExpensesPage() {
  const {
    expenses,
    isLoading,
    createExpense,
    updateExpense,
    deleteExpense,
    expensesByType,
    totalExpenses,
    totalSangria,
    totalSuprimento,
  } = useExpenses();

  const [expenseModal, setExpenseModal] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Expense | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('despesa');

  const handleCreate = async (data: Partial<Expense>, file?: File) => {
    setModalLoading(true);
    try {
      await createExpense(data, file);
      setExpenseModal(false);
      setSelectedExpense(null);
    } finally {
      setModalLoading(false);
    }
  };

  const handleUpdate = async (data: Partial<Expense>, file?: File) => {
    if (!selectedExpense) return;
    setModalLoading(true);
    try {
      await updateExpense(selectedExpense.id, data);
      setExpenseModal(false);
      setSelectedExpense(null);
    } finally {
      setModalLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setModalLoading(true);
    try {
      await deleteExpense(deleteTarget.id);
      setConfirmDelete(false);
      setDeleteTarget(null);
    } finally {
      setModalLoading(false);
    }
  };

  const typeLabels = {
    despesa: 'Despesas',
    sangria: 'Sangrias',
    suprimento: 'Suprimentos',
  };

  const renderExpenseTable = (items: Expense[]) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Descrição</TableHead>
          {activeTab === 'despesa' && <TableHead>Categoria</TableHead>}
          <TableHead>Valor</TableHead>
          <TableHead>Data</TableHead>
          <TableHead className="text-right">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.length === 0 ? (
          <TableRow>
            <TableCell colSpan={activeTab === 'despesa' ? 5 : 4} className="text-center py-8">
              <p className="text-muted-foreground">Nenhum registro encontrado</p>
            </TableCell>
          </TableRow>
        ) : (
          items.map(expense => (
            <TableRow key={expense.id}>
              <TableCell className="font-medium">{expense.description}</TableCell>
              {activeTab === 'despesa' && <TableCell className="text-sm">{expense.category || '-'}</TableCell>}
              <TableCell>R$ {expense.amount.toFixed(2)}</TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {format(new Date(expense.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
              </TableCell>
              <TableCell className="text-right space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedExpense(expense);
                    setExpenseModal(true);
                  }}
                >
                  Editar
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => {
                    setDeleteTarget(expense);
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
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Movimentação de Caixa</h1>
        <Button
          onClick={() => {
            setSelectedExpense(null);
            setExpenseModal(true);
          }}
          className="bg-green-600 hover:bg-green-700"
        >
          + Registrar Movimentação
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4 border-l-4 border-l-orange-500">
          <p className="text-sm text-muted-foreground mb-1">Total Despesas</p>
          <p className="text-2xl font-bold">R$ {totalExpenses.toFixed(2)}</p>
        </Card>
        <Card className="p-4 border-l-4 border-l-red-500">
          <p className="text-sm text-muted-foreground mb-1">Total Sangrias</p>
          <p className="text-2xl font-bold">R$ {totalSangria.toFixed(2)}</p>
        </Card>
        <Card className="p-4 border-l-4 border-l-blue-500">
          <p className="text-sm text-muted-foreground mb-1">Total Suprimentos</p>
          <p className="text-2xl font-bold">R$ {totalSuprimento.toFixed(2)}</p>
        </Card>
      </div>

      <Card>
        <Tabs defaultValue="despesa" onValueChange={setActiveTab} className="w-full">
          <div className="border-b px-6">
            <TabsList className="bg-transparent p-0 h-auto">
              <TabsTrigger value="despesa" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
                Despesas ({expensesByType.despesa.length})
              </TabsTrigger>
              <TabsTrigger value="sangria" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
                Sangrias ({expensesByType.sangria.length})
              </TabsTrigger>
              <TabsTrigger value="suprimento" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
                Suprimentos ({expensesByType.suprimento.length})
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="p-0">
            <TabsContent value="despesa" className="mt-0">
              {renderExpenseTable(expensesByType.despesa)}
            </TabsContent>
            <TabsContent value="sangria" className="mt-0">
              {renderExpenseTable(expensesByType.sangria)}
            </TabsContent>
            <TabsContent value="suprimento" className="mt-0">
              {renderExpenseTable(expensesByType.suprimento)}
            </TabsContent>
          </div>
        </Tabs>
      </Card>

      <ExpenseModal
        open={expenseModal}
        onOpenChange={setExpenseModal}
        expense={selectedExpense || undefined}
        onSave={selectedExpense ? handleUpdate : handleCreate}
        isLoading={modalLoading}
      />

      <ConfirmModal
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Confirmar exclusão"
        description="Deseja realmente remover este registro de movimentação?"
        confirmText="Remover"
        cancelText="Cancelar"
        isDestructive
        isLoading={modalLoading}
        onConfirm={handleDelete}
      />
    </div>
  );
}

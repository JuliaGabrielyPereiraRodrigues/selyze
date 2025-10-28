import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { useProducts } from '@/hooks/useProducts';
import ProductModal from '@/components/modals/ProductModal';
import ConfirmModal from '@/components/modals/ConfirmModal';
import { Product } from '@/types';
import { toast } from 'sonner';

export default function ProductsPage() {
  const {
    products,
    isLoading,
    createProduct,
    updateProduct,
    deleteProduct,
    searchTerm,
    setSearchTerm,
    categoryFilter,
    setCategoryFilter,
    filteredProducts,
  } = useProducts();

  const [productModal, setProductModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  const handleCreate = async (data: Partial<Product>) => {
    setModalLoading(true);
    try {
      await createProduct(data);
      setProductModal(false);
      setSelectedProduct(null);
    } finally {
      setModalLoading(false);
    }
  };

  const handleUpdate = async (data: Partial<Product>) => {
    if (!selectedProduct) return;
    setModalLoading(true);
    try {
      await updateProduct(selectedProduct.id, data);
      setProductModal(false);
      setSelectedProduct(null);
    } finally {
      setModalLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setModalLoading(true);
    try {
      await deleteProduct(deleteTarget.id);
      setConfirmDelete(false);
      setDeleteTarget(null);
    } finally {
      setModalLoading(false);
    }
  };

  const categories = [
    { value: '', label: 'Todas as categorias' },
    { value: 'marmita', label: 'Marmita' },
    { value: 'bebida', label: 'Bebida' },
    { value: 'sobremesa', label: 'Sobremesa' },
    { value: 'adicional', label: 'Adicional' },
    { value: 'generico', label: 'Genérico' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Produtos</h1>
        <Button
          onClick={() => {
            setSelectedProduct(null);
            setProductModal(true);
          }}
          className="bg-green-600 hover:bg-green-700"
        >
          + Novo Produto
        </Button>
      </div>

      <Card className="p-6">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-xs mb-2 block">Pesquisar</Label>
              <Input
                placeholder="Nome ou descrição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <Label className="text-xs mb-2 block">Categoria</Label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
              >
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm('');
                  setCategoryFilter('');
                }}
                className="w-full"
              >
                Limpar Filtros
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Preço</TableHead>
              <TableHead>Estoque</TableHead>
              <TableHead>Mínimo</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <p className="text-muted-foreground">Carregando produtos...</p>
                </TableCell>
              </TableRow>
            ) : filteredProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <p className="text-muted-foreground">Nenhum produto encontrado</p>
                </TableCell>
              </TableRow>
            ) : (
              filteredProducts.map(product => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell className="text-sm capitalize">{product.category}</TableCell>
                  <TableCell>R$ {product.price.toFixed(2)}</TableCell>
                  <TableCell>
                    <span className={product.stock < product.min_stock ? 'text-red-500 font-semibold' : ''}>
                      {product.stock}
                    </span>
                  </TableCell>
                  <TableCell>{product.min_stock}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedProduct(product);
                        setProductModal(true);
                      }}
                    >
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        setDeleteTarget(product);
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

      <ProductModal
        open={productModal}
        onOpenChange={setProductModal}
        product={selectedProduct || undefined}
        onSave={selectedProduct ? handleUpdate : handleCreate}
        isLoading={modalLoading}
      />

      <ConfirmModal
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Confirmar exclusão"
        description={`Deseja realmente remover o produto "${deleteTarget?.name}"?`}
        confirmText="Remover"
        cancelText="Cancelar"
        isDestructive
        isLoading={modalLoading}
        onConfirm={handleDelete}
      />
    </div>
  );
}

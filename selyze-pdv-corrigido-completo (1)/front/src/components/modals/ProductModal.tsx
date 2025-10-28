import { useState, useEffect } from 'react';
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalFooter } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Product } from '@/types';

interface ProductModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Product;
  onSave: (data: Partial<Product>) => Promise<void>;
  isLoading?: boolean;
}

export default function ProductModal({
  open,
  onOpenChange,
  product,
  onSave,
  isLoading = false,
}: ProductModalProps) {
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    price: number;
    category: 'marmita' | 'bebida' | 'sobremesa' | 'adicional' | 'generico';
    type: 'generico' | 'unitario';
    stock: number;
    min_stock: number;
  }>({
    name: '',
    description: '',
    price: 0,
    category: 'generico',
    type: 'generico',
    stock: 0,
    min_stock: 0,
  });

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        description: product.description || '',
        price: product.price,
        category: product.category,
        type: product.type,
        stock: product.stock,
        min_stock: product.min_stock,
      });
    } else {
      setFormData({
        name: '',
        description: '',
        price: 0,
        category: 'generico',
        type: 'generico',
        stock: 0,
        min_stock: 0,
      });
    }
  }, [product, open]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'price' || name === 'stock' || name === 'min_stock'
        ? parseFloat(value) || 0
        : value,
    }));
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      alert('Nome do produto é obrigatório');
      return;
    }
    if (formData.price <= 0) {
      alert('Preço deve ser maior que zero');
      return;
    }

    await onSave({
      ...formData,
      ...(product && { id: product.id }),
    });
    onOpenChange(false);
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent className="max-w-lg">
        <ModalHeader>
          <ModalTitle>
            {product ? 'Editar Produto' : 'Novo Produto'}
          </ModalTitle>
        </ModalHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label>Nome do Produto *</Label>
            <Input
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder=""
            />
          </div>

          <div>
            <Label>Descrição</Label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder=""
              className="w-full h-20 px-3 py-2 rounded-md border border-input bg-background text-sm resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Preço *</Label>
              <Input
                name="price"
                type="number"
                min="0"
                step="0.01"
                value={formData.price}
                onChange={handleChange}
                placeholder=""
              />
            </div>
            <div>
              <Label>Tipo</Label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
              >
                <option value="generico">Genérico (Estoque Infinito)</option>
                <option value="unitario">Unitário (Controle de Estoque)</option>
              </select>
            </div>
          </div>

          <div>
            <Label>Categoria</Label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
            >
              <option value="generico">Genérico</option>
              <option value="marmita">Marmita</option>
              <option value="bebida">Bebida</option>
              <option value="sobremesa">Sobremesa</option>
              <option value="adicional">Adicional</option>
            </select>
          </div>

          {/* Campos de estoque - apenas para produtos unitários */}
          {formData.type === 'unitario' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Estoque Atual</Label>
                  <Input
                    name="stock"
                    type="number"
                    min="0"
                    value={formData.stock}
                    onChange={handleChange}
                    placeholder=""
                  />
                </div>
                <div>
                  <Label>Estoque Mínimo</Label>
                  <Input
                    name="min_stock"
                    type="number"
                    min="0"
                    value={formData.min_stock}
                    onChange={handleChange}
                    placeholder=""
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                💡 O sistema notificará quando o estoque atingir o mínimo configurado
              </p>
            </>
          )}
          
          {formData.type === 'generico' && (
            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md p-3">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                ℹ️ Produtos genéricos não possuem controle de estoque
              </p>
            </div>
          )}
        </div>

        <ModalFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? 'Salvando...' : 'Salvar Produto'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

import { useEffect, useState } from 'react';
import { useProductStore } from '@/store/productStore';
import { Product } from '@/types';

export function useProducts() {
  const store = useProductStore();
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');

  useEffect(() => {
    store.getProducts();
  }, []);

  useEffect(() => {
    let filtered = store.products;

    if (searchTerm) {
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (categoryFilter) {
      filtered = filtered.filter(p => p.category === categoryFilter);
    }

    setFilteredProducts(filtered);
  }, [store.products, searchTerm, categoryFilter]);

  return {
    ...store,
    filteredProducts,
    searchTerm,
    setSearchTerm,
    categoryFilter,
    setCategoryFilter,
  };
}

import { queryAll, queryOne, execute } from '../db/connection';
import { Product } from '../types';

export class ProductService {
  async findAll(activeOnly: boolean = true): Promise<Product[]> {
    try {
      const sql = activeOnly
        ? 'SELECT * FROM products WHERE active = 1 ORDER BY category, name'
        : 'SELECT * FROM products ORDER BY category, name';

      const products = await queryAll<Product>(sql);
      return products || [];
    } catch (error) {
      console.error('❌ Erro em ProductService.findAll:', error);
      throw new Error('Falha ao buscar produtos.');
    }
  }

  async findById(id: number): Promise<Product | null> {
    try {
      const product = await queryOne<Product>('SELECT * FROM products WHERE id = ?', [id]);
      return product || null;
    } catch (error) {
      console.error('❌ Erro em ProductService.findById:', error);
      throw new Error('Falha ao buscar produto.');
    }
  }

  async findByCategory(category: string): Promise<Product[]> {
    try {
      const products = await queryAll<Product>(
        'SELECT * FROM products WHERE category = ? AND active = 1 ORDER BY name',
        [category]
      );
      return products || [];
    } catch (error) {
      console.error('❌ Erro em ProductService.findByCategory:', error);
      throw new Error('Falha ao buscar produtos por categoria.');
    }
  }

  async findLowStock(): Promise<Product[]> {
    try {
      const lowStock = await queryAll<Product>(
        'SELECT * FROM products WHERE type = "unitario" AND stock <= min_stock AND active = 1 ORDER BY stock'
      );
      return lowStock || [];
    } catch (error) {
      console.error('❌ Erro em ProductService.findLowStock:', error);
      throw new Error('Falha ao verificar produtos com estoque baixo.');
    }
  }

  async create(data: Partial<Product>): Promise<Product> {
    try {
      await execute(
        `INSERT INTO products (name, description, price, category, type, stock, min_stock, image)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          data.name,
          data.description || null,
          data.price,
          data.category,
          data.type,
          data.stock || 0,
          data.min_stock || 0,
          data.image || null
        ]
      );

      const inserted = await queryOne<{ id: number }>('SELECT last_insert_rowid() AS id');
      if (!inserted || !inserted.id) throw new Error('Erro ao obter ID do produto recém-criado.');

      const product = await this.findById(inserted.id);
      if (!product) throw new Error('Erro ao criar produto.');

      return product;
    } catch (error) {
      console.error('❌ Erro em ProductService.create:', error);
      throw new Error('Falha ao criar produto.');
    }
  }

  async update(id: number, data: Partial<Product>): Promise<Product> {
    try {
      const product = await this.findById(id);
      if (!product) throw new Error('Produto não encontrado.');

      const updates: string[] = [];
      const values: any[] = [];

      if (data.name !== undefined) { updates.push('name = ?'); values.push(data.name); }
      if (data.description !== undefined) { updates.push('description = ?'); values.push(data.description); }
      if (data.price !== undefined) { updates.push('price = ?'); values.push(data.price); }
      if (data.category !== undefined) { updates.push('category = ?'); values.push(data.category); }
      if (data.type !== undefined) { updates.push('type = ?'); values.push(data.type); }
      if (data.stock !== undefined) { updates.push('stock = ?'); values.push(data.stock); }
      if (data.min_stock !== undefined) { updates.push('min_stock = ?'); values.push(data.min_stock); }
      if (data.image !== undefined) { updates.push('image = ?'); values.push(data.image); }

      if (updates.length === 0) return product;

      updates.push("updated_at = datetime('now', 'localtime')");
      values.push(id);

      await execute(`UPDATE products SET ${updates.join(', ')} WHERE id = ?`, values);

      const updatedProduct = await this.findById(id);
      if (!updatedProduct) throw new Error('Erro ao atualizar produto.');

      return updatedProduct;
    } catch (error) {
      console.error('❌ Erro em ProductService.update:', error);
      throw new Error('Falha ao atualizar produto.');
    }
  }

  async delete(id: number): Promise<void> {
    try {
      await execute(
        `UPDATE products SET active = 0, updated_at = datetime('now', 'localtime') WHERE id = ?`,
        [id]
      );
    } catch (error) {
      console.error('❌ Erro em ProductService.delete:', error);
      throw new Error('Falha ao excluir produto.');
    }
  }

  async activate(id: number): Promise<void> {
    try {
      await execute(
        `UPDATE products SET active = 1, updated_at = datetime('now', 'localtime') WHERE id = ?`,
        [id]
      );
    } catch (error) {
      console.error('❌ Erro em ProductService.activate:', error);
      throw new Error('Falha ao ativar produto.');
    }
  }

  async updateStock(id: number, quantity: number): Promise<void> {
    try {
      await execute(
        `UPDATE products SET stock = stock + ?, updated_at = datetime('now', 'localtime') WHERE id = ?`,
        [quantity, id]
      );
    } catch (error) {
      console.error('❌ Erro em ProductService.updateStock:', error);
      throw new Error('Falha ao atualizar estoque.');
    }
  }

  // ✅ CORRIGIDO: Retorna produto atualizado em vez de criar notificação aqui
  async decrementStock(id: number, quantity: number): Promise<Product | null> {
    try {
      const product = await this.findById(id);
      if (!product) throw new Error('Produto não encontrado.');

      if (product.type !== 'unitario') return null;

      if (product.stock < quantity) {
        throw new Error(`Estoque insuficiente para ${product.name}`);
      }

      await this.updateStock(id, -quantity);
      
      // Retorna o produto atualizado para que o controller decida criar notificação
      const updatedProduct = await this.findById(id);
      return updatedProduct;
    } catch (error) {
      console.error('❌ Erro em ProductService.decrementStock:', error);
      throw new Error('Falha ao decrementar estoque.');
    }
  }
}

export default new ProductService();
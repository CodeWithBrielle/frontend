export interface Product {
  id: number;
  name: string;
  sku: string;
  category_id: number | null;
  category_name?: string;
  supplier_id?: number | null;
  supplier_name?: string;
  price: number;
  unit: string;
  min_stock_level: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

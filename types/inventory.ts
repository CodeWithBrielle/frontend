export interface Inventory {
  id: number;
  branch_id: number;
  product_id: number;
  quantity: number;
  location?: string;
  last_updated: string;
}

export interface StockMovement {
  id: number;
  product_id: number;
  branch_id: number;
  type: 'IN' | 'OUT';
  quantity: number;
  reason?: string;
  reference_id?: number;
  movement_date: string;
  created_by: number;
}

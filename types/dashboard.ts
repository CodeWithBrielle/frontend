export interface DashboardSummary {
  totalProducts: number;
  lowStockCount: number;
  expiringSoonCount: number;
  supplierCount: number;
  movementsToday: number;
  outOfStockCount: number;
}

export interface RecentMovementItem {
  product: string;
  SKU: string;
  movementType: string;
  quantity: number;
  user: string;
  branch: string;
  date: string;
  remarks: string;
}

export interface LowStockItem {
  product: string;
  SKU: string;
  quantity: number;
  branch: string;
}

export interface ExpiringSoonItem {
  product: string;
  SKU: string;
  quantity: number;
  branch: string;
  expirationDate: string;
}

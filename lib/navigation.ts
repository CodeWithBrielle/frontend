import { 
  LayoutDashboard, 
  Package, 
  Tags, 
  Truck, 
  Warehouse, 
  ArrowDownToLine, 
  ArrowUpFromLine, 
  AlertTriangle, 
  History, 
  Users, 
  BarChart3, 
  Settings 
} from "lucide-react";

export interface NavItem {
  name: string;
  href: string;
  icon: any;
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

export const navigationGroups: NavGroup[] = [
  {
    title: "Overview",
    items: [
      { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    ]
  },
  {
    title: "Catalog",
    items: [
      { name: "Products", href: "/products", icon: Package },
      { name: "Categories", href: "/categories", icon: Tags },
      { name: "Suppliers", href: "/suppliers", icon: Truck },
    ]
  },
  {
    title: "Operations",
    items: [
      { name: "Inventory", href: "/inventory", icon: Warehouse },
      { name: "Stock In", href: "/stock-in", icon: ArrowDownToLine },
      { name: "Stock Out", href: "/stock-out", icon: ArrowUpFromLine },
      { name: "Expiration", href: "/expiration", icon: AlertTriangle },
      { name: "Movement History", href: "/movement-history", icon: History },
    ]
  },
  {
    title: "Workspace",
    items: [
      { name: "Staff", href: "/staff", icon: Users },
      { name: "Reports", href: "/reports", icon: BarChart3 },
      { name: "Settings", href: "/settings", icon: Settings },
    ]
  }
];

// Flat list helper if needed for simple mapping
export const flatNavigation = navigationGroups.flatMap(group => group.items);

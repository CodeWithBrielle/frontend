"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { fetchApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { FileDown, Search } from "lucide-react";

type ApiEnvelope<T> = { success?: boolean; data?: T } | T;

function unwrapData<T>(payload: ApiEnvelope<T>): T {
  if (payload && typeof payload === "object" && "data" in payload) {
    return (payload as { data: T }).data;
  }
  return payload as T;
}

interface InventoryItem {
  inventory_id: number;
  product_id: number;
  product_name: string;
  product_sku: string;
  category_name?: string;
  supplier_name?: string;
  branch_id: number;
  branch_name: string;
  quantity: number;
  unit?: string; // Added unit
  reorder_level: number;
  expiration_date?: string;
  stock_status: 'out_of_stock' | 'low_stock' | 'healthy';
}

interface MovementItem {
  movement_id: number;
  product_name: string;
  product_sku: string;
  branch_name: string;
  movement_type: 'IN' | 'OUT';
  quantity: number;
  user_full_name: string;
  created_at: string;
  remarks?: string;
  reference?: string;
}

interface Category {
  id: number;
  name: string;
}

interface Supplier {
  id: number;
  name: string;
}

export default function ReportsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"inventory" | "movements">("inventory");
  
  // Data states
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [movements, setMovements] = useState<MovementItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSupplier, setSelectedSupplier] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const branchId = useMemo(() => {
    const candidate = user as unknown as { branch_id?: number; branchId?: number } | null;
    return candidate?.branch_id ?? candidate?.branchId;
  }, [user]);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const query = branchId ? `?branch_id=${branchId}` : "";
      
      const [invRes, moveRes, catRes, supRes] = await Promise.all([
        fetchApi<ApiEnvelope<InventoryItem[]>>(`/api/inventory${query}`),
        fetchApi<ApiEnvelope<MovementItem[]>>(`/api/stock/movements${query}`),
        fetchApi<ApiEnvelope<Category[]>>(`/api/categories`),
        fetchApi<ApiEnvelope<Supplier[]>>(`/api/suppliers`),
      ]);

      setInventory(unwrapData(invRes) ?? []);
      setMovements(unwrapData(moveRes) ?? []);
      setCategories(unwrapData(catRes) ?? []);
      setSuppliers(unwrapData(supRes) ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load report data.");
    } finally {
      setIsLoading(false);
    }
  }, [branchId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Inventory Memoized Data
  const uniqueBranches = useMemo(() => {
    const branches = inventory.map((item) => item.branch_name).filter(Boolean);
    return Array.from(new Set(branches));
  }, [inventory]);

  const filteredInventory = useMemo(() => {
    return inventory.filter((item) => {
      const matchesSearch = search === "" || 
        item.product_name.toLowerCase().includes(search.toLowerCase()) ||
        item.product_sku.toLowerCase().includes(search.toLowerCase());
      
      const matchesCategory = selectedCategory === "" || item.category_name === selectedCategory;
      const matchesSupplier = selectedSupplier === "" || item.supplier_name === selectedSupplier;
      const matchesBranch = selectedBranch === "" || item.branch_name === selectedBranch;
      
      let matchesStatus = true;
      if (selectedStatus === "Low") {
        matchesStatus = item.stock_status === "low_stock";
      } else if (selectedStatus === "Normal") {
        matchesStatus = item.stock_status === "healthy";
      } else if (selectedStatus === "Out-of-Stock") {
        matchesStatus = item.stock_status === "out_of_stock";
      }

      return matchesSearch && matchesCategory && matchesSupplier && matchesStatus && matchesBranch;
    });
  }, [inventory, search, selectedCategory, selectedSupplier, selectedStatus, selectedBranch]);

  // Movements Memoized Data
  const filteredMovements = useMemo(() => {
    return movements.filter((item) => {
      const matchesType = selectedType === "" || item.movement_type === selectedType;
      const matchesBranch = selectedBranch === "" || item.branch_name === selectedBranch;
      
      // Date filtering
      let matchesDate = true;
      const itemDate = new Date(item.created_at);
      
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        matchesDate = matchesDate && itemDate >= start;
      }
      
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        matchesDate = matchesDate && itemDate <= end;
      }

      return matchesType && matchesBranch && matchesDate;
    });
  }, [movements, selectedType, selectedBranch, startDate, endDate]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'out_of_stock':
        return <Badge variant="danger">Out of Stock</Badge>;
      case 'low_stock':
        return <Badge variant="warning">Low Stock</Badge>;
      case 'healthy':
        return <Badge variant="success">Normal</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const handleExportCSV = () => {
    if (activeTab === "inventory") {
      if (filteredInventory.length === 0) { alert("No data to export"); return; }
      const headers = ["Product", "SKU", "Branch", "Category", "Supplier", "Quantity", "Unit", "Reorder Level", "Expiration Date", "Status"];
      const rows = filteredInventory.map(item => [
        item.product_name, item.product_sku, item.branch_name || "-", item.category_name || "-", item.supplier_name || "-",
        item.quantity, item.unit || "-", item.reorder_level, item.expiration_date ? new Date(item.expiration_date).toLocaleDateString() : "N/A",
        item.stock_status
      ]);
      downloadCSV("inventory_report", headers, rows);
    } else {
      if (filteredMovements.length === 0) { alert("No data to export"); return; }
      const headers = ["Product", "SKU", "Type", "Quantity", "User", "Branch", "Date", "Remarks"];
      const rows = filteredMovements.map(item => [
        item.product_name, item.product_sku, item.movement_type, item.quantity, item.user_full_name,
        item.branch_name || "-", new Date(item.created_at).toLocaleString(), item.remarks || item.reference || "-"
      ]);
      downloadCSV("stock_movements_report", headers, rows);
    }
  };

  const downloadCSV = (filename: string, headers: string[], rows: any[][]) => {
    const csvContent = [
      headers.join(","),
      ...rows.map(r => r.map(cell => `"${cell}"`).join(","))
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <ProtectedRoute>
      <AppShell>
        <PageHeader 
          title="Reports" 
          description="View and export inventory and stock movement reports." 
          actions={
            <Button variant="secondary" onClick={handleExportCSV}>
              <FileDown className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          }
        />

        {/* Tabs */}
        <div className="flex border-b border-[var(--color-border-subtle)] mb-6">
          <button
            className={`py-2 px-4 font-medium text-sm ${activeTab === "inventory" ? "border-b-2 border-[var(--color-primary)] text-[var(--color-text-primary)]" : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"}`}
            onClick={() => setActiveTab("inventory")}
          >
            Inventory Report
          </button>
          <button
            className={`py-2 px-4 font-medium text-sm ${activeTab === "movements" ? "border-b-2 border-[var(--color-primary)] text-[var(--color-text-primary)]" : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"}`}
            onClick={() => setActiveTab("movements")}
          >
            Stock Movements
          </button>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            {activeTab === "inventory" ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-secondary)]" />
                  <Input
                    className="pl-9"
                    placeholder="Search product..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                {!branchId && (
                  <Select value={selectedBranch} onChange={(e) => setSelectedBranch(e.target.value)}>
                    <option value="">All Branches</option>
                    {uniqueBranches.map((branch) => (
                      <option key={branch} value={branch}>{branch}</option>
                    ))}
                  </Select>
                )}
                <Select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
                  <option value="">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                  ))}
                </Select>
                <Select value={selectedSupplier} onChange={(e) => setSelectedSupplier(e.target.value)}>
                  <option value="">All Suppliers</option>
                  {suppliers.map((sup) => (
                    <option key={sup.id} value={sup.name}>{sup.name}</option>
                  ))}
                </Select>
                <Select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
                  <option value="">All Statuses</option>
                  <option value="Normal">Normal</option>
                  <option value="Low">Low Stock</option>
                  <option value="Out-of-Stock">Out of Stock</option>
                </Select>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <div>
                  <label className="text-sm font-medium text-[var(--color-text-secondary)]">Type</label>
                  <Select value={selectedType} onChange={(e) => setSelectedType(e.target.value)}>
                    <option value="">All Types</option>
                    <option value="IN">Stock IN</option>
                    <option value="OUT">Stock OUT</option>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-[var(--color-text-secondary)]">Start Date</label>
                  <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </div>
                <div>
                  <label className="text-sm font-medium text-[var(--color-text-secondary)]">End Date</label>
                  <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </div>
                {!branchId && (
                  <div>
                    <label className="text-sm font-medium text-[var(--color-text-secondary)]">Branch</label>
                    <Select value={selectedBranch} onChange={(e) => setSelectedBranch(e.target.value)}>
                      <option value="">All Branches</option>
                      {uniqueBranches.map((branch) => (
                        <option key={branch} value={branch}>{branch}</option>
                      ))}
                    </Select>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {isLoading ? (
          <LoadingState message="Loading report data..." />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchData} />
        ) : activeTab === "inventory" ? (
          filteredInventory.length === 0 ? (
            <EmptyState title="No inventory items found" description="No items match your report filters." />
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-[var(--color-border-subtle)] text-[var(--color-text-secondary)]">
                        <th className="py-3 px-4 font-medium">Product</th>
                        <th className="py-3 px-4 font-medium">SKU</th>
                        <th className="py-3 px-4 font-medium">Branch</th>
                        <th className="py-3 px-4 font-medium">Quantity</th>
                        <th className="py-3 px-4 font-medium">Unit</th>
                        <th className="py-3 px-4 font-medium">Expiration Date</th>
                        <th className="py-3 px-4 font-medium">Reorder Level</th>
                        <th className="py-3 px-4 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredInventory.map((item) => (
                        <tr key={item.inventory_id} className="border-b border-[var(--color-border-subtle)] hover:bg-[var(--color-hover)]">
                          <td className="py-3 px-4 text-[var(--color-text-primary)] font-medium">{item.product_name}</td>
                          <td className="py-3 px-4">{item.product_sku}</td>
                          <td className="py-3 px-4">{item.branch_name}</td>
                          <td className="py-3 px-4 font-semibold">{item.quantity}</td>
                          <td className="py-3 px-4">{item.unit || "-"}</td>
                          <td className="py-3 px-4">
                            {item.expiration_date ? new Date(item.expiration_date).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="py-3 px-4">{item.reorder_level}</td>
                          <td className="py-3 px-4">{getStatusBadge(item.stock_status)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )
        ) : (
          filteredMovements.length === 0 ? (
            <EmptyState title="No movements found" description="No history matches your filters." />
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-[var(--color-border-subtle)] text-[var(--color-text-secondary)]">
                        <th className="py-3 px-4 font-medium">Product</th>
                        <th className="py-3 px-4 font-medium">SKU</th>
                        <th className="py-3 px-4 font-medium">Type</th>
                        <th className="py-3 px-4 font-medium">Quantity</th>
                        <th className="py-3 px-4 font-medium">User</th>
                        <th className="py-3 px-4 font-medium">Branch</th>
                        <th className="py-3 px-4 font-medium">Date</th>
                        <th className="py-3 px-4 font-medium">Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredMovements.map((item) => (
                        <tr key={item.movement_id} className="border-b border-[var(--color-border-subtle)] hover:bg-[var(--color-hover)]">
                          <td className="py-3 px-4 text-[var(--color-text-primary)] font-medium">{item.product_name}</td>
                          <td className="py-3 px-4">{item.product_sku}</td>
                          <td className="py-3 px-4">
                            <Badge variant={item.movement_type === 'OUT' ? 'warning' : 'success'}>
                              {item.movement_type}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 font-semibold">{item.quantity}</td>
                          <td className="py-3 px-4">{item.user_full_name}</td>
                          <td className="py-3 px-4">{item.branch_name}</td>
                          <td className="py-3 px-4">{new Date(item.created_at).toLocaleString()}</td>
                          <td className="py-3 px-4">{item.remarks || item.reference || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )
        )}
      </AppShell>
    </ProtectedRoute>
  );
}

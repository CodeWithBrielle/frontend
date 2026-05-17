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
  reorder_level: number;
  expiration_date?: string;
  stock_status: 'out_of_stock' | 'low_stock' | 'healthy';
}

interface Category {
  id: number;
  name: string;
}

interface Supplier {
  id: number;
  name: string;
}

export default function InventoryReportPage() {
  const { user } = useAuth();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
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

  const branchId = useMemo(() => {
    const candidate = user as unknown as { branch_id?: number; branchId?: number } | null;
    return candidate?.branch_id ?? candidate?.branchId;
  }, [user]);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // If user has a branch_id, force it. Otherwise fetch all and we can filter.
      const query = branchId ? `?branch_id=${branchId}` : "";
      
      const [invRes, catRes, supRes] = await Promise.all([
        fetchApi<ApiEnvelope<InventoryItem[]>>(`/api/inventory${query}`),
        fetchApi<ApiEnvelope<Category[]>>(`/api/categories`),
        fetchApi<ApiEnvelope<Supplier[]>>(`/api/suppliers`),
      ]);

      setInventory(unwrapData(invRes) ?? []);
      setCategories(unwrapData(catRes) ?? []);
      setSuppliers(unwrapData(supRes) ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load inventory data.");
    } finally {
      setIsLoading(false);
    }
  }, [branchId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
    if (filteredInventory.length === 0) {
      alert("No data to export");
      return;
    }
    
    const headers = ["Product", "SKU", "Branch", "Category", "Supplier", "Quantity", "Reorder Level", "Expiration Date", "Status"];
    const rows = filteredInventory.map(item => [
      item.product_name,
      item.product_sku,
      item.branch_name || "-",
      item.category_name || "-",
      item.supplier_name || "-",
      item.quantity,
      item.reorder_level,
      item.expiration_date ? new Date(item.expiration_date).toLocaleDateString() : "N/A",
      item.stock_status
    ]);
    
    const csvContent = [
      headers.join(","),
      ...rows.map(r => r.map(cell => `"${cell}"`).join(","))
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `inventory_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <ProtectedRoute>
      <AppShell>
        <PageHeader 
          title="Inventory Report" 
          description="Detailed view of current inventory with export capabilities." 
          actions={
            <Button variant="secondary" onClick={handleExportCSV}>
              <FileDown className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          }
        />

        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-secondary)]" />
                <Input
                  className="pl-9"
                  placeholder="Search product or SKU..."
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
          </CardContent>
        </Card>

        {isLoading ? (
          <LoadingState message="Loading report data..." />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchData} />
        ) : filteredInventory.length === 0 ? (
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
                        <td className="py-3 px-4">-</td> {/* Unit fallback as not in API currently */}
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
        )}
      </AppShell>
    </ProtectedRoute>
  );
}

"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Card, CardContent } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { fetchApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { FileDown } from "lucide-react";

type ApiEnvelope<T> = { success?: boolean; data?: T } | T;

function unwrapData<T>(payload: ApiEnvelope<T>): T {
  if (payload && typeof payload === "object" && "data" in payload) {
    return (payload as { data: T }).data;
  }
  return payload as T;
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

export default function MovementReportPage() {
  const { user } = useAuth();
  const [movements, setMovements] = useState<MovementItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedType, setSelectedType] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("");

  const branchId = useMemo(() => {
    const candidate = user as unknown as { branch_id?: number; branchId?: number } | null;
    return candidate?.branch_id ?? candidate?.branchId;
  }, [user]);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Pass branch_id to API if available to enforce branch-awareness at backend level
      const query = branchId ? `?branch_id=${branchId}` : "";
      const res = await fetchApi<ApiEnvelope<MovementItem[]>>(`/api/stock/movements${query}`);
      setMovements(unwrapData(res) ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load movements.");
    } finally {
      setIsLoading(false);
    }
  }, [branchId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Extract unique branches from movements for the filter dropdown
  const uniqueBranches = useMemo(() => {
    const branches = movements.map((m) => m.branch_name).filter(Boolean);
    return Array.from(new Set(branches));
  }, [movements]);

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

  const handleExportCSV = () => {
    if (filteredMovements.length === 0) {
      alert("No data to export");
      return;
    }
    
    const headers = ["Product", "SKU", "Type", "Quantity", "User", "Branch", "Date", "Remarks"];
    const rows = filteredMovements.map(item => [
      item.product_name,
      item.product_sku,
      item.movement_type,
      item.quantity,
      item.user_full_name,
      item.branch_name || "-",
      new Date(item.created_at).toLocaleString(),
      item.remarks || item.reference || "-"
    ]);
    
    const csvContent = [
      headers.join(","),
      ...rows.map(r => r.map(cell => `"${cell}"`).join(","))
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `stock_movements_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <ProtectedRoute>
      <AppShell>
        <PageHeader 
          title="Stock Movement Report" 
          description="Detailed tracking of all stock IN and OUT records with export capabilities." 
          actions={
            <Button variant="secondary" onClick={handleExportCSV}>
              <FileDown className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          }
        />

        <Card className="mb-6">
          <CardContent className="p-4">
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
          </CardContent>
        </Card>

        {isLoading ? (
          <LoadingState message="Loading movements report..." />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchData} />
        ) : filteredMovements.length === 0 ? (
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
        )}
      </AppShell>
    </ProtectedRoute>
  );
}

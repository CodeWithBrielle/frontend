"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { fetchApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

type ApiEnvelope<T> = { success?: boolean; data?: T } | T;

function unwrapData<T>(payload: ApiEnvelope<T>): T {
  if (payload && typeof payload === "object" && "data" in payload) {
    return (payload as { data: T }).data;
  }
  return payload as T;
}

interface ExpiringItem {
  inventory_id: number;
  product_name: string;
  product_sku: string;
  quantity: number;
  branch_id: number;
  branch_name: string;
  expiration_date: string;
}

export default function ExpirationPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<ExpiringItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const branchId = useMemo(() => {
    const candidate = user as unknown as { branch_id?: number; branchId?: number } | null;
    return candidate?.branch_id ?? candidate?.branchId;
  }, [user]);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetchApi<ApiEnvelope<ExpiringItem[]>>(`/api/inventory/expiring-soon`);
      setItems(unwrapData(res) ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load expiration data.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredItems = useMemo(() => {
    if (!branchId) return items;
    return items.filter((item) => item.branch_id === branchId);
  }, [items, branchId]);

  const getDaysRemaining = (dateString: string) => {
    const expDate = new Date(dateString);
    const today = new Date();
    const diffTime = expDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getBadge = (days: number) => {
    if (days < 0) {
      return <Badge variant="danger">Expired</Badge>;
    }
    if (days < 7) {
      return <Badge variant="danger">Expires in {days} days</Badge>;
    }
    if (days < 14) {
      return <Badge variant="warning">Expires in {days} days</Badge>;
    }
    return <Badge variant="success">{days} days left</Badge>;
  };

  return (
    <ProtectedRoute>
      <AppShell>
        <PageHeader 
          title="Expiration Tracking" 
          description="Monitor products close to expiration." 
        />

        {isLoading ? (
          <LoadingState message="Loading expiration data..." />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchData} />
        ) : filteredItems.length === 0 ? (
          <EmptyState title="No expiring items found" description="No items are expiring soon for your branch." />
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-[var(--color-border-subtle)] text-[var(--color-text-secondary)]">
                      <th className="py-3 px-4 font-medium">Product</th>
                      <th className="py-3 px-4 font-medium">SKU</th>
                      <th className="py-3 px-4 font-medium">Quantity</th>
                      <th className="py-3 px-4 font-medium">Branch</th>
                      <th className="py-3 px-4 font-medium">Expiration Date</th>
                      <th className="py-3 px-4 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems.map((item) => {
                      const days = getDaysRemaining(item.expiration_date);
                      return (
                        <tr key={item.inventory_id} className="border-b border-[var(--color-border-subtle)] hover:bg-[var(--color-hover)]">
                          <td className="py-3 px-4 text-[var(--color-text-primary)] font-medium">{item.product_name}</td>
                          <td className="py-3 px-4">{item.product_sku}</td>
                          <td className="py-3 px-4 font-semibold">{item.quantity}</td>
                          <td className="py-3 px-4">{item.branch_name}</td>
                          <td className="py-3 px-4">{new Date(item.expiration_date).toLocaleDateString()}</td>
                          <td className="py-3 px-4">{getBadge(days)}</td>
                        </tr>
                      );
                    })}
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

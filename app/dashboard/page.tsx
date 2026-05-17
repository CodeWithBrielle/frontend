"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { TableSkeleton } from "@/components/ui/TableSkeleton";
import { useAuth } from "@/context/AuthContext";
import { fetchApi } from "@/lib/api";
import {
  DashboardSummary,
  ExpiringSoonItem,
  LowStockItem,
  RecentMovementItem,
} from "@/types/dashboard";

type ApiEnvelope<T> = { success?: boolean; data?: T } | T;

const defaultSummary: DashboardSummary = {
  totalProducts: 0,
  lowStockCount: 0,
  expiringSoonCount: 0,
  supplierCount: 0,
  movementsToday: 0,
  outOfStockCount: 0,
};

function unwrapData<T>(payload: ApiEnvelope<T>): T {
  if (payload && typeof payload === "object" && "data" in payload) {
    return (payload as { data: T }).data;
  }
  return payload as T;
}

function toNumber(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value) || 0;
  return 0;
}

function normalizeSummary(raw: Record<string, unknown>): DashboardSummary {
  return {
    totalProducts: toNumber(raw.totalProducts ?? raw.total_products),
    lowStockCount: toNumber(raw.lowStockCount ?? raw.low_stock_count),
    expiringSoonCount: toNumber(raw.expiringSoonCount ?? raw.expiring_soon_count),
    supplierCount: toNumber(raw.supplierCount ?? raw.supplier_count),
    movementsToday: toNumber(raw.movementsToday ?? raw.movements_today),
    outOfStockCount: toNumber(raw.outOfStockCount ?? raw.out_of_stock_count),
  };
}

function normalizeMovements(raw: unknown[]): RecentMovementItem[] {
  return raw.map((item) => {
    const row = item as Record<string, unknown>;
    return {
      product: String(row.product ?? row.product_name ?? "-"),
      SKU: String(row.SKU ?? row.sku ?? row.product_sku ?? "-"),
      movementType: String(row.movementType ?? row.movement_type ?? "-"),
      quantity: toNumber(row.quantity),
      user: String(row.user ?? row.user_full_name ?? "-"),
      branch: String(row.branch ?? row.branch_name ?? "-"),
      date: String(row.date ?? row.created_at ?? "-"),
      remarks: String(row.remarks ?? "-"),
    };
  });
}

function normalizeLowStock(raw: unknown[]): LowStockItem[] {
  return raw.map((item) => {
    const row = item as Record<string, unknown>;
    return {
      product: String(row.product ?? row.product_name ?? "-"),
      SKU: String(row.SKU ?? row.sku ?? row.product_sku ?? "-"),
      quantity: toNumber(row.quantity),
      branch: String(row.branch ?? row.branch_name ?? "-"),
    };
  });
}

function normalizeExpiringSoon(raw: unknown[]): ExpiringSoonItem[] {
  return raw.map((item) => {
    const row = item as Record<string, unknown>;
    return {
      product: String(row.product ?? row.product_name ?? "-"),
      SKU: String(row.SKU ?? row.sku ?? row.product_sku ?? "-"),
      quantity: toNumber(row.quantity),
      branch: String(row.branch ?? row.branch_name ?? "-"),
      expirationDate: String(row.expirationDate ?? row.expiration_date ?? "-"),
    };
  });
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<DashboardSummary>(defaultSummary);
  const [recentMovements, setRecentMovements] = useState<RecentMovementItem[]>([]);
  const [lowStock, setLowStock] = useState<LowStockItem[]>([]);
  const [expiringSoon, setExpiringSoon] = useState<ExpiringSoonItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const branchId = useMemo(() => {
    const candidate = user as unknown as { branch_id?: number; branchId?: number } | null;
    return candidate?.branch_id ?? candidate?.branchId;
  }, [user]);

  const fetchDashboard = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const query = ""; // Temporarily omit branch_id

      const [summaryRes, movementsRes, lowStockRes, expiringSoonRes] = await Promise.all([
        fetchApi<ApiEnvelope<Record<string, unknown>>>(`/api/dashboard/summary${query}`),
        fetchApi<ApiEnvelope<unknown[]>>(`/api/dashboard/recent-movements${query}`),
        fetchApi<ApiEnvelope<unknown[]>>(`/api/dashboard/low-stock${query}`),
        fetchApi<ApiEnvelope<unknown[]>>(`/api/dashboard/expiring-soon${query}`),
      ]);

      setSummary(normalizeSummary(unwrapData(summaryRes) ?? {}));
      setRecentMovements(normalizeMovements(unwrapData(movementsRes) ?? []));
      setLowStock(normalizeLowStock(unwrapData(lowStockRes) ?? []));
      setExpiringSoon(normalizeExpiringSoon(unwrapData(expiringSoonRes) ?? []));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load dashboard data.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [branchId]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  return (
    <ProtectedRoute>
      <AppShell>
        <PageHeader title="Dashboard" description="Overview of your inventory system." />

        {isLoading ? (
          <div className="space-y-6">
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, idx) => (
                <Card key={idx}>
                  <CardHeader className="pb-3">
                    <Skeleton className="h-4 w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-8 w-1/4" />
                      <Skeleton className="h-5 w-16 rounded-full" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </section>

            <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
              <div className="xl:col-span-2">
                <TableSkeleton headers={["Product", "SKU", "Type", "Qty", "User", "Branch", "Date", "Remarks"]} />
              </div>

              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Low Stock</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Array.from({ length: 3 }).map((_, idx) => (
                        <div key={idx} className="flex items-center justify-between rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] p-3">
                          <div className="space-y-2 w-3/4">
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-3 w-1/2" />
                          </div>
                          <Skeleton className="h-5 w-10 rounded-full" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Expiring Soon</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Array.from({ length: 3 }).map((_, idx) => (
                        <div key={idx} className="flex items-center justify-between rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] p-3">
                          <div className="space-y-2 w-3/4">
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-3 w-1/2" />
                            <Skeleton className="h-3 w-2/3" />
                          </div>
                          <Skeleton className="h-5 w-10 rounded-full" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </section>
          </div>
        ) : error ? (
          <ErrorState message={error} onRetry={fetchDashboard} />
        ) : (
          <div className="space-y-6">
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {[
                { label: "Total Products", value: summary.totalProducts },
                { label: "Low Stock", value: summary.lowStockCount, tone: "danger" as const },
                { label: "Expiring Soon", value: summary.expiringSoonCount, tone: "warning" as const },
                { label: "Suppliers", value: summary.supplierCount },
                { label: "Movements Today", value: summary.movementsToday },
                { label: "Out of Stock", value: summary.outOfStockCount, tone: "danger" as const },
              ].map((metric) => (
                <Card key={metric.label}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-[var(--color-text-secondary)]">
                      {metric.label}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <p className="text-2xl font-semibold text-[var(--color-text-primary)]">{metric.value}</p>
                      {metric.tone ? (
                        <Badge variant={metric.tone === "danger" ? "danger" : "warning"}>
                          {metric.tone === "danger" ? "Alert" : "Watch"}
                        </Badge>
                      ) : null}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </section>

            <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
              <Card className="xl:col-span-2">
                <CardHeader>
                  <CardTitle>Recent Movements</CardTitle>
                </CardHeader>
                <CardContent>
                  {recentMovements.length === 0 ? (
                    <EmptyState title="No recent movements" description="Stock activity will appear here." />
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="border-b border-[var(--color-border-subtle)] text-[var(--color-text-secondary)]">
                            <th className="py-2 pr-3 font-medium">Product</th>
                            <th className="py-2 pr-3 font-medium">SKU</th>
                            <th className="py-2 pr-3 font-medium">Type</th>
                            <th className="py-2 pr-3 font-medium">Qty</th>
                            <th className="py-2 pr-3 font-medium">User</th>
                            <th className="py-2 pr-3 font-medium">Branch</th>
                            <th className="py-2 pr-3 font-medium">Date</th>
                            <th className="py-2 font-medium">Remarks</th>
                          </tr>
                        </thead>
                        <tbody>
                          {recentMovements.map((item, idx) => (
                            <tr key={`${item.product}-${item.SKU}-${idx}`} className="border-b border-[var(--color-border-subtle)]">
                              <td className="py-2 pr-3 text-[var(--color-text-primary)]">{item.product}</td>
                              <td className="py-2 pr-3">{item.SKU}</td>
                              <td className="py-2 pr-3">
                                <Badge variant={item.movementType.toLowerCase() === "out" ? "warning" : "success"}>
                                  {item.movementType}
                                </Badge>
                              </td>
                              <td className="py-2 pr-3">{item.quantity}</td>
                              <td className="py-2 pr-3">{item.user}</td>
                              <td className="py-2 pr-3">{item.branch}</td>
                              <td className="py-2 pr-3">{new Date(item.date).toLocaleDateString()}</td>
                              <td className="py-2">{item.remarks}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Low Stock</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {lowStock.length === 0 ? (
                      <EmptyState title="No low stock items" description="All branch inventory levels are healthy." />
                    ) : (
                      <div className="space-y-3">
                        {lowStock.map((item, idx) => (
                          <div
                            key={`${item.product}-${item.SKU}-${idx}`}
                            className="flex items-center justify-between rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] p-3"
                          >
                            <div>
                              <p className="text-sm font-medium text-[var(--color-text-primary)]">{item.product}</p>
                              <p className="text-xs text-[var(--color-text-secondary)]">
                                {item.SKU} • {item.branch}
                              </p>
                            </div>
                            <Badge variant="danger">{item.quantity}</Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Expiring Soon</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {expiringSoon.length === 0 ? (
                      <EmptyState title="No upcoming expirations" description="No items are close to expiration." />
                    ) : (
                      <div className="space-y-3">
                        {expiringSoon.map((item, idx) => (
                          <div
                            key={`${item.product}-${item.SKU}-${idx}`}
                            className="flex items-center justify-between rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] p-3"
                          >
                            <div>
                              <p className="text-sm font-medium text-[var(--color-text-primary)]">{item.product}</p>
                              <p className="text-xs text-[var(--color-text-secondary)]">
                                {item.SKU} • {item.branch}
                              </p>
                              <p className="text-xs text-[var(--color-text-secondary)]">
                                Expires: {new Date(item.expirationDate).toLocaleDateString()}
                              </p>
                            </div>
                            <Badge variant="warning">{item.quantity}</Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </section>
          </div>
        )}
      </AppShell>
    </ProtectedRoute>
  );
}

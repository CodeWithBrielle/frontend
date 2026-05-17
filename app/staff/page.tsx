"use client";

import React, { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { fetchApi } from "@/lib/api";

type ApiEnvelope<T> = { success?: boolean; data?: T } | T;

function unwrapData<T>(payload: ApiEnvelope<T>): T {
  if (payload && typeof payload === "object" && "data" in payload) {
    return (payload as { data: T }).data;
  }
  return payload as T;
}

interface User {
  id: number;
  full_name: string;
  email: string;
  role: string;
  branch_name?: string;
}

export default function StaffPage() {
  const [staff, setStaff] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStaff = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetchApi<ApiEnvelope<User[]>>(`/api/users`);
      const data = unwrapData(res);
      
      if (Array.isArray(data)) {
        setStaff(data);
      } else {
        throw new Error("Invalid data format received from server");
      }
    } catch (err) {
      console.error("Failed to fetch staff:", err);
      setError(err instanceof Error ? err.message : "Failed to load staff data");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  const getRoleBadge = (role: string) => {
    switch (role?.toLowerCase()) {
      case 'admin':
        return <Badge variant="danger">Admin</Badge>;
      case 'manager':
        return <Badge variant="warning">Manager</Badge>;
      case 'staff':
        return <Badge variant="success">Staff</Badge>;
      default:
        return <Badge>{role}</Badge>;
    }
  };

  return (
    <ProtectedRoute>
      <AppShell>
        <PageHeader 
          title="Staff Management" 
          description="View list of users and staff members." 
        />

        {isLoading ? (
          <LoadingState message="Loading staff..." />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchStaff} />
        ) : staff.length === 0 ? (
          <EmptyState title="No staff found" description="No users are registered in the system." />
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-[var(--color-border-subtle)] text-[var(--color-text-secondary)]">
                      <th className="py-3 px-4 font-medium">Name</th>
                      <th className="py-3 px-4 font-medium">Email</th>
                      <th className="py-3 px-4 font-medium">Role</th>
                      <th className="py-3 px-4 font-medium">Branch</th>
                    </tr>
                  </thead>
                  <tbody>
                    {staff.map((user) => (
                      <tr key={user.id} className="border-b border-[var(--color-border-subtle)] hover:bg-[var(--color-hover)]">
                        <td className="py-3 px-4 text-[var(--color-text-primary)] font-medium">{user.full_name}</td>
                        <td className="py-3 px-4">{user.email}</td>
                        <td className="py-3 px-4">{getRoleBadge(user.role)}</td>
                        <td className="py-3 px-4">{user.branch_name || "-"}</td>
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

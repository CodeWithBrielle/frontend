"use client";

import React, { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { LoadingState } from "@/components/ui/LoadingState";
import { TableSkeleton } from "@/components/ui/TableSkeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { fetchApi } from "@/lib/api";
import { Supplier } from "@/types/supplier";
import { Plus, Edit } from "lucide-react";

type ApiEnvelope<T> = { success?: boolean; data?: T } | T;

function unwrapData<T>(payload: ApiEnvelope<T>): T {
  if (payload && typeof payload === "object" && "data" in payload) {
    return (payload as { data: T }).data;
  }
  return payload as T;
}

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentSupplier, setCurrentSupplier] = useState<Supplier | null>(null);
  
  // Form states
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });
  const [formError, setFormError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetchApi<ApiEnvelope<Supplier[]>>(`/api/suppliers`);
      setSuppliers(unwrapData(res) ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load suppliers.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenModal = (supplier: Supplier | null = null) => {
    setCurrentSupplier(supplier);
    if (supplier) {
      setFormData({
        name: supplier.name,
        email: supplier.email ?? "",
        phone: supplier.phone ?? "",
        address: supplier.address ?? "",
      });
    } else {
      setFormData({
        name: "",
        email: "",
        phone: "",
        address: "",
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentSupplier(null);
    setFormError(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.name.trim()) {
      setFormError("Supplier Name is required.");
      return;
    }

    try {
      if (currentSupplier) {
        await fetchApi(`/api/suppliers/${currentSupplier.id}`, {
          method: "PUT",
          body: JSON.stringify(formData),
        });
      } else {
        await fetchApi(`/api/suppliers`, {
          method: "POST",
          body: JSON.stringify(formData),
        });
      }
      
      handleCloseModal();
      fetchData(); // Re-fetch
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to save supplier.");
    }
  };

  return (
    <ProtectedRoute>
      <AppShell>
        <PageHeader
          title="Suppliers"
          description="Manage your suppliers."
          actions={
            <Button onClick={() => handleOpenModal()}>
              <Plus className="mr-2 h-4 w-4" />
              Add Supplier
            </Button>
          }
        />

        {isLoading ? (
          <TableSkeleton headers={["Name", "Email", "Phone", "Address", "Actions"]} />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchData} />
        ) : suppliers.length === 0 ? (
          <EmptyState title="No suppliers found" description="Add a supplier to get started." />
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-[var(--color-border-subtle)] text-[var(--color-text-secondary)]">
                      <th className="py-3 px-4 font-medium">Name</th>
                      <th className="py-3 px-4 font-medium">Email</th>
                      <th className="py-3 px-4 font-medium">Phone</th>
                      <th className="py-3 px-4 font-medium">Address</th>
                      <th className="py-3 px-4 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {suppliers.map((supplier) => (
                      <tr key={supplier.id} className="border-b border-[var(--color-border-subtle)] hover:bg-[var(--color-hover)]">
                        <td className="py-3 px-4 text-[var(--color-text-primary)] font-medium">{supplier.name}</td>
                        <td className="py-3 px-4">{supplier.email ?? "-"}</td>
                        <td className="py-3 px-4">{supplier.phone ?? "-"}</td>
                        <td className="py-3 px-4">{supplier.address ?? "-"}</td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm" onClick={() => handleOpenModal(supplier)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        <Modal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          title={currentSupplier ? "Edit Supplier" : "Add Supplier"}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-[var(--color-text-primary)]">Name</label>
              <Input name="name" value={formData.name} onChange={handleInputChange} required />
            </div>
            <div>
              <label className="text-sm font-medium text-[var(--color-text-primary)]">Email</label>
              <Input type="email" name="email" value={formData.email} onChange={handleInputChange} />
            </div>
            <div>
              <label className="text-sm font-medium text-[var(--color-text-primary)]">Phone</label>
              <Input name="phone" value={formData.phone} onChange={handleInputChange} />
            </div>
            <div>
              <label className="text-sm font-medium text-[var(--color-text-primary)]">Address</label>
              <Input name="address" value={formData.address} onChange={handleInputChange} />
            </div>
            {formError && (
              <div className="p-3 bg-red-50 text-red-700 text-sm rounded-md border border-red-200">
                {formError}
              </div>
            )}
            <div className="flex justify-end gap-3 mt-6">
              <Button type="button" variant="secondary" onClick={handleCloseModal}>Cancel</Button>
              <Button type="submit">Save</Button>
            </div>
          </form>
        </Modal>
      </AppShell>
    </ProtectedRoute>
  );
}

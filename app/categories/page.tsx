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
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { fetchApi } from "@/lib/api";
import { Category } from "@/types/category";
import { Plus, Edit } from "lucide-react";

type ApiEnvelope<T> = { success?: boolean; data?: T } | T;

function unwrapData<T>(payload: ApiEnvelope<T>): T {
  if (payload && typeof payload === "object" && "data" in payload) {
    return (payload as { data: T }).data;
  }
  return payload as T;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<Category | null>(null);
  
  // Form states
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });
  const [formError, setFormError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetchApi<ApiEnvelope<Category[]>>(`/api/categories`);
      setCategories(unwrapData(res) ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load categories.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenModal = (category: Category | null = null) => {
    setCurrentCategory(category);
    if (category) {
      setFormData({
        name: category.name,
        description: category.description ?? "",
      });
    } else {
      setFormData({
        name: "",
        description: "",
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentCategory(null);
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
      setFormError("Category Name is required.");
      return;
    }

    try {
      if (currentCategory) {
        await fetchApi(`/api/categories/${currentCategory.id}`, {
          method: "PUT",
          body: JSON.stringify(formData),
        });
      } else {
        await fetchApi(`/api/categories`, {
          method: "POST",
          body: JSON.stringify(formData),
        });
      }
      
      handleCloseModal();
      fetchData(); // Re-fetch
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to save category.");
    }
  };

  return (
    <ProtectedRoute>
      <AppShell>
        <PageHeader
          title="Categories"
          description="Manage product categories."
          actions={
            <Button onClick={() => handleOpenModal()}>
              <Plus className="mr-2 h-4 w-4" />
              Add Category
            </Button>
          }
        />

        {isLoading ? (
          <LoadingState message="Loading categories..." />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchData} />
        ) : categories.length === 0 ? (
          <EmptyState title="No categories found" description="Add a category to get started." />
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-[var(--color-border-subtle)] text-[var(--color-text-secondary)]">
                      <th className="py-3 px-4 font-medium">Name</th>
                      <th className="py-3 px-4 font-medium">Number of Products</th>
                      <th className="py-3 px-4 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map((category) => (
                      <tr key={category.id} className="border-b border-[var(--color-border-subtle)] hover:bg-[var(--color-hover)]">
                        <td className="py-3 px-4 text-[var(--color-text-primary)] font-medium">{category.name}</td>
                        <td className="py-3 px-4">{category.product_count ?? 0}</td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm" onClick={() => handleOpenModal(category)}>
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
          title={currentCategory ? "Edit Category" : "Add Category"}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-[var(--color-text-primary)]">Name</label>
              <Input name="name" value={formData.name} onChange={handleInputChange} required />
            </div>
            <div>
              <label className="text-sm font-medium text-[var(--color-text-primary)]">Description</label>
              <Input name="description" value={formData.description} onChange={handleInputChange} />
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

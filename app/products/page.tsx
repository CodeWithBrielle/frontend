"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { LoadingState } from "@/components/ui/LoadingState";
import { TableSkeleton } from "@/components/ui/TableSkeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { useAuth } from "@/context/AuthContext";
import { fetchApi } from "@/lib/api";
import { Product } from "@/types/product";
import { Category } from "@/types/category";
import { Supplier } from "@/types/supplier";
import { Plus, Edit, Trash2 } from "lucide-react";

type ApiEnvelope<T> = { success?: boolean; data?: T } | T;

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

function generateSKU(): string {
  const randomNum = Math.floor(10000 + Math.random() * 90000); // 10000 to 99999
  return `PRD-${randomNum}`;
}

function generateUniqueSKU(existingProducts: { sku: string }[]): string {
  let sku = "";
  let isUnique = false;
  let attempts = 0;
  while (!isUnique && attempts < 100) {
    sku = generateSKU();
    isUnique = !existingProducts.some((p) => p.sku === sku);
    attempts++;
  }
  return sku;
}

export default function ProductsPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  
  // Form states
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    category_id: "",
    supplier_id: "",
    price: "",
    unit: "",
    min_stock_level: "0",
  });
  const [formError, setFormError] = useState<string | null>(null);

  const branchId = useMemo(() => {
    const candidate = user as unknown as { branch_id?: number; branchId?: number } | null;
    return candidate?.branch_id ?? candidate?.branchId;
  }, [user]);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const query = ""; // Temporarily omit branch_id
      
      const [productsRes, categoriesRes, suppliersRes] = await Promise.all([
        fetchApi<ApiEnvelope<Product[]>>(`/api/products${query}`),
        fetchApi<ApiEnvelope<Category[]>>(`/api/categories`),
        fetchApi<ApiEnvelope<Supplier[]>>(`/api/suppliers`),
      ]);

      setProducts(unwrapData(productsRes) ?? []);
      setCategories(unwrapData(categoriesRes) ?? []);
      setSuppliers(unwrapData(suppliersRes) ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data.");
    } finally {
      setIsLoading(false);
    }
  }, [branchId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenModal = (product: Product | null = null) => {
    setCurrentProduct(product);
    if (product) {
      setFormData({
        name: product.name,
        sku: product.sku,
        category_id: product.category_id?.toString() ?? "",
        supplier_id: product.supplier_id?.toString() ?? "",
        price: product.price != null ? product.price.toString() : "",
        unit: product.unit ?? "",
        min_stock_level: product.min_stock_level != null ? product.min_stock_level.toString() : "0",
      });
    } else {
      setFormData({
        name: "",
        sku: generateUniqueSKU(products),
        category_id: "",
        supplier_id: "",
        price: "",
        unit: "pcs",
        min_stock_level: "0",
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentProduct(null);
    setFormError(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.name.trim()) {
      setFormError("Product Name is required.");
      return;
    }
    if (!formData.category_id) {
      setFormError("Category is required.");
      return;
    }
    if (!formData.price || isNaN(parseFloat(formData.price)) || parseFloat(formData.price) < 0) {
      setFormError("Price must be a valid number >= 0.");
      return;
    }
    if (!formData.min_stock_level || isNaN(parseInt(formData.min_stock_level)) || parseInt(formData.min_stock_level) < 0) {
      setFormError("Minimum stock level must be a valid number >= 0.");
      return;
    }

    try {
      const payload = {
        ...formData,
        category_id: formData.category_id ? parseInt(formData.category_id) : null,
        supplier_id: formData.supplier_id ? parseInt(formData.supplier_id) : null,
        price: parseFloat(formData.price),
        min_stock_level: parseInt(formData.min_stock_level),
      };

      if (currentProduct) {
        await fetchApi(`/api/products/${currentProduct.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        await fetchApi(`/api/products`, {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }
      
      handleCloseModal();
      fetchData(); // Re-fetch
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to save product.");
    }
  };

  const handleArchive = async (id: number) => {
    if (confirm("Are you sure you want to archive this product?")) {
      try {
        await fetchApi(`/api/products/${id}`, {
          method: "DELETE",
        });
        fetchData(); // Re-fetch
      } catch (err) {
        alert(err instanceof Error ? err.message : "Failed to archive product.");
      }
    }
  };

  return (
    <ProtectedRoute>
      <AppShell>
        <PageHeader
          title="Products"
          description="Manage your product catalog."
          actions={
            <Button onClick={() => handleOpenModal()}>
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Button>
          }
        />

        {isLoading ? (
          <TableSkeleton headers={["Name", "SKU", "Category", "Supplier", "Price", "Unit", "Status", "Actions"]} />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchData} />
        ) : products.length === 0 ? (
          <EmptyState title="No products found" description="Add a product to get started." />
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-[var(--color-border-subtle)] text-[var(--color-text-secondary)]">
                      <th className="py-3 px-4 font-medium">Name</th>
                      <th className="py-3 px-4 font-medium">SKU</th>
                      <th className="py-3 px-4 font-medium">Category</th>
                      <th className="py-3 px-4 font-medium">Supplier</th>
                      <th className="py-3 px-4 font-medium">Price</th>
                      <th className="py-3 px-4 font-medium">Unit</th>
                      <th className="py-3 px-4 font-medium">Status</th>
                      <th className="py-3 px-4 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => (
                      <tr key={product.id} className="border-b border-[var(--color-border-subtle)] hover:bg-[var(--color-hover)]">
                        <td className="py-3 px-4 text-[var(--color-text-primary)] font-medium">{product.name}</td>
                        <td className="py-3 px-4">{product.sku}</td>
                        <td className="py-3 px-4">{product.category_name ?? "-"}</td>
                        <td className="py-3 px-4">{product.supplier_name ?? "-"}</td>
                        <td className="py-3 px-4">${toNumber(product.price).toFixed(2)}</td>
                        <td className="py-3 px-4">{product.unit}</td>
                        <td className="py-3 px-4">
                          <Badge variant={product.is_active ? "success" : "secondary"}>
                            {product.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm" onClick={() => handleOpenModal(product)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleArchive(product.id)}>
                              <Trash2 className="h-4 w-4 text-[var(--color-red-default)]" />
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
          title={currentProduct ? "Edit Product" : "Add Product"}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-[var(--color-text-primary)]">Name</label>
              <Input name="name" value={formData.name} onChange={handleInputChange} required />
            </div>
            <div>
              <label className="text-sm font-medium text-[var(--color-text-primary)]">SKU</label>
              <Input name="sku" value={formData.sku} onChange={handleInputChange} required readOnly />
            </div>
            <div>
              <label className="text-sm font-medium text-[var(--color-text-primary)]">Category</label>
              <Select name="category_id" value={formData.category_id} onChange={handleInputChange}>
                <option value="">Select Category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-[var(--color-text-primary)]">Supplier</label>
              <Select name="supplier_id" value={formData.supplier_id} onChange={handleInputChange}>
                <option value="">Select Supplier</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-[var(--color-text-primary)]">Price</label>
                <Input type="number" step="0.01" name="price" value={formData.price} onChange={handleInputChange} required />
              </div>
              <div>
                <label className="text-sm font-medium text-[var(--color-text-primary)]">Unit</label>
                <Select name="unit" value={formData.unit} onChange={handleInputChange} required>
                  <option value="pcs">pcs</option>
                  <option value="kg">kg</option>
                  <option value="g">g</option>
                  <option value="liters">liters</option>
                  <option value="ml">ml</option>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-[var(--color-text-primary)]">Min Stock Level</label>
              <Input type="number" name="min_stock_level" value={formData.min_stock_level} onChange={handleInputChange} required />
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

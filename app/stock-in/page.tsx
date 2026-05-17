"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { fetchApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

type ApiEnvelope<T> = { success?: boolean; data?: T } | T;

function unwrapData<T>(payload: ApiEnvelope<T>): T {
  if (payload && typeof payload === "object" && "data" in payload) {
    return (payload as { data: T }).data;
  }
  return payload as T;
}

interface Product {
  id: number;
  name: string;
  sku: string;
}

export default function StockInPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    product_id: "",
    quantity: "",
    reference: "",
    remarks: "",
    expiration_date: "",
  });

  const branchId = useMemo(() => {
    const candidate = user as unknown as { branch_id?: number; branchId?: number } | null;
    return candidate?.branch_id ?? candidate?.branchId;
  }, [user]);

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetchApi<ApiEnvelope<Product[]>>(`/api/products`);
      setProducts(unwrapData(res) ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load products.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    // Validation
    if (!formData.product_id) {
      setError("Please select a product.");
      return;
    }
    const qty = Number(formData.quantity);
    if (isNaN(qty) || qty <= 0) {
      setError("Quantity must be greater than 0.");
      return;
    }
    // Temporarily bypass branch check

    setIsSubmitting(true);
    try {
      await fetchApi(`/api/stock/in`, {
        method: "POST",
        body: JSON.stringify({
          product_id: Number(formData.product_id),
          ...(branchId ? { branch_id: branchId } : {}),
          quantity: qty,
          reference: formData.reference || undefined,
          remarks: formData.remarks || undefined,
          expiration_date: formData.expiration_date || undefined,
        }),
      });

      setSuccessMessage("Stock checked in successfully!");
      setFormData({
        product_id: "",
        quantity: "",
        reference: "",
        remarks: "",
        expiration_date: "",
      });
      
      // Optional: Redirect to inventory after a delay
      // setTimeout(() => router.push("/inventory"), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit stock in.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ProtectedRoute>
      <AppShell>
        <PageHeader 
          title="Stock In" 
          description="Receive new stock into inventory." 
        />

        {isLoading ? (
          <LoadingState message="Loading products..." />
        ) : error && products.length === 0 ? (
          <ErrorState message={error} onRetry={fetchProducts} />
        ) : (
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardContent className="p-6">
                {successMessage && (
                  <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-[var(--radius-md)] border border-green-200">
                    {successMessage}
                  </div>
                )}
                
                {error && (
                  <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-[var(--radius-md)] border border-red-200">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-[var(--color-text-primary)]">Product *</label>
                    <Select 
                      name="product_id" 
                      value={formData.product_id} 
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select a product</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                      ))}
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-[var(--color-text-primary)]">Quantity *</label>
                    <Input 
                      type="number" 
                      name="quantity" 
                      value={formData.quantity} 
                      onChange={handleInputChange}
                      placeholder="Enter quantity"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-[var(--color-text-primary)]">Supplier / Reference (Optional)</label>
                    <Input 
                      name="reference" 
                      value={formData.reference} 
                      onChange={handleInputChange}
                      placeholder="Enter supplier or reference"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-[var(--color-text-primary)]">Expiration Date (Optional)</label>
                    <Input 
                      type="date" 
                      name="expiration_date" 
                      value={formData.expiration_date} 
                      onChange={handleInputChange}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-[var(--color-text-primary)]">Remarks (Optional)</label>
                    <Textarea 
                      name="remarks" 
                      value={formData.remarks} 
                      onChange={handleInputChange}
                      placeholder="Enter remarks"
                    />
                  </div>

                  <div className="flex justify-end gap-3 mt-6">
                    <Button type="button" variant="secondary" onClick={() => router.push("/inventory")}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? "Submitting..." : "Submit Stock In"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </AppShell>
    </ProtectedRoute>
  );
}

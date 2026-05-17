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

interface InventoryItem {
  inventory_id: number;
  product_id: number;
  product_name: string;
  product_sku: string;
  quantity: number;
}

interface Branch {
  id: number;
  name: string;
}

export default function StockOutPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    product_id: "",
    quantity: "",
    remarks: "",
  });

  const [selectedBranchId, setSelectedBranchId] = useState<string>("");

  const userBranchId = useMemo(() => {
    const candidate = user as unknown as { branch_id?: number; branchId?: number } | null;
    return candidate?.branch_id ?? candidate?.branchId;
  }, [user]);

  // Set initial branch ID
  useEffect(() => {
    if (userBranchId) {
      setSelectedBranchId(userBranchId.toString());
    }
  }, [userBranchId]);

  // Fetch branches if user has no branch
  useEffect(() => {
    if (!userBranchId) {
      const fetchBranches = async () => {
        try {
          const res = await fetchApi<ApiEnvelope<Branch[]>>(`/api/branches`);
          setBranches(unwrapData(res) ?? []);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Failed to load branches.");
        }
      };
      fetchBranches();
    }
  }, [userBranchId]);

  const fetchInventory = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const query = selectedBranchId ? `?branch_id=${selectedBranchId}` : "";
      const res = await fetchApi<ApiEnvelope<InventoryItem[]>>(`/api/inventory${query}`);
      setInventory(unwrapData(res) ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load inventory.");
    } finally {
      setIsLoading(false);
    }
  }, [selectedBranchId]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleBranchChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedBranchId(e.target.value);
    // Reset product selection when branch changes
    setFormData((prev) => ({ ...prev, product_id: "", quantity: "" }));
  };

  const selectedItem = useMemo(() => {
    return inventory.find((item) => item.product_id === Number(formData.product_id));
  }, [inventory, formData.product_id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    // Validation
    // Temporarily bypass branch check
    if (!formData.product_id) {
      setError("Please select a product.");
      return;
    }
    const qty = Number(formData.quantity);
    if (isNaN(qty) || qty <= 0) {
      setError("Quantity must be greater than 0.");
      return;
    }
    
    if (!selectedItem) {
      setError("Selected product not found in inventory.");
      return;
    }

    if (qty > selectedItem.quantity) {
      setError(`Insufficient stock. Available: ${selectedItem.quantity}`);
      return;
    }

    setIsSubmitting(true);
    try {
      await fetchApi(`/api/stock/out`, {
        method: "POST",
        body: JSON.stringify({
          product_id: Number(formData.product_id),
          ...(selectedBranchId ? { branch_id: Number(selectedBranchId) } : {}),
          quantity: qty,
          remarks: formData.remarks || undefined,
        }),
      });

      setSuccessMessage("Stock checked out successfully!");
      setFormData({
        product_id: "",
        quantity: "",
        remarks: "",
      });
      
      // Refresh inventory to get updated quantities
      fetchInventory();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit stock out.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ProtectedRoute>
      <AppShell>
        <PageHeader 
          title="Stock Out" 
          description="Deduct stock from inventory." 
        />

        {/* Branch Selection (Only for users without branch) */}
        {!userBranchId && !selectedBranchId && (
          <div className="max-w-2xl mx-auto mb-4">
            <Card>
              <CardContent className="p-6">
                <div>
                  <label className="text-sm font-medium text-[var(--color-text-primary)]">Select Branch *</label>
                  <Select 
                    name="branch_id" 
                    value={selectedBranchId} 
                    onChange={handleBranchChange}
                    required
                  >
                    <option value="">Select a branch</option>
                    {branches.map((branch) => (
                      <option key={branch.id} value={branch.id}>
                        {branch.name}
                      </option>
                    ))}
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {isLoading ? (
          <LoadingState message="Loading inventory..." />
        ) : error && inventory.length === 0 ? (
          <div className="max-w-2xl mx-auto">
            <ErrorState message={error} onRetry={fetchInventory} />
            {!userBranchId && (
              <div className="mt-4 text-center">
                <Button onClick={() => setSelectedBranchId("")}>Change Branch</Button>
              </div>
            )}
          </div>
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
                  {/* Show selected branch if it was selected via dropdown */}
                  {!userBranchId && selectedBranchId && (
                    <div className="mb-4 flex items-center justify-between p-3 bg-gray-50 rounded-md">
                      <div>
                        <label className="text-xs font-medium text-[var(--color-text-secondary)]">Active Branch</label>
                        <p className="text-sm font-medium text-[var(--color-text-primary)]">
                          {branches.find(b => b.id.toString() === selectedBranchId)?.name || "Unknown Branch"}
                        </p>
                      </div>
                      <Button type="button" variant="secondary" onClick={() => setSelectedBranchId("")}>
                        Change
                      </Button>
                    </div>
                  )}

                  <div>
                    <label className="text-sm font-medium text-[var(--color-text-primary)]">Product *</label>
                    <Select 
                      name="product_id" 
                      value={formData.product_id} 
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select a product</option>
                      {inventory.map((item) => (
                        <option key={item.inventory_id} value={item.product_id}>
                          {item.product_name} ({item.product_sku}) - Available: {item.quantity}
                        </option>
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
                    {selectedItem && (
                      <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
                        Max available: {selectedItem.quantity}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium text-[var(--color-text-primary)]">Reason / Remarks (Optional)</label>
                    <Textarea 
                      name="remarks" 
                      value={formData.remarks} 
                      onChange={handleInputChange}
                      placeholder="Enter reason or remarks"
                    />
                  </div>

                  <div className="flex justify-end gap-3 mt-6">
                    <Button type="button" variant="secondary" onClick={() => router.push("/inventory")}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting || !selectedItem || selectedItem.quantity === 0}>
                      {isSubmitting ? "Submitting..." : "Submit Stock Out"}
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

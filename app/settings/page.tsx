"use client";

import React, { useEffect, useState, useMemo } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { LoadingState } from "@/components/ui/LoadingState";
import { useAuth } from "@/context/AuthContext";
import { fetchApi } from "@/lib/api";
import { Save, Settings as SettingsIcon } from "lucide-react";

// Define the shape of the settings data
interface Settings {
  currency: string;
  notificationsEnabled: boolean;
}


type ApiEnvelope<T> = { success?: boolean; data?: T } | T;

function unwrapData<T>(payload: ApiEnvelope<T>): T {
  if (payload && typeof payload === "object" && "data" in payload) {
    return (payload as { data: T }).data;
  }
  return payload as T;
}

export default function SettingsPage() {
  const { user } = useAuth();
  
  const [settings, setSettings] = useState<Settings>({
    currency: "PHP",
    notificationsEnabled: true,
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Partial<Record<keyof Settings, string>>>({});

  const userBranchId = useMemo(() => {
    const candidate = user as unknown as { branch_id?: number; branchId?: number } | null;
    return candidate?.branch_id ?? candidate?.branchId;
  }, [user]);

  useEffect(() => {
    let ignore = false;

    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetching branches removed

        // 2. Fetch Settings
        try {
          const settingsRes = await fetchApi<ApiEnvelope<Settings>>(`/api/settings`);
          const settingsData = unwrapData(settingsRes);
          
          if (!ignore && settingsData) {
            setSettings(settingsData);
          }
        } catch (settingsErr) {
          // Fallback if the endpoint doesn't exist yet (404) or fails
          console.warn("Could not fetch settings, using defaults.", settingsErr);
          
          if (!ignore) {
            // Branch fallback removed
          }
        }
      } catch (err) {
        if (!ignore) {
          setError(err instanceof Error ? err.message : "Failed to load page data.");
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    };

    loadData();

    return () => {
      ignore = true;
    };
  }, [userBranchId]);

  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof Settings, string>> = {};
    
    // Validation for default branch removed
    
    if (!settings.currency) {
      errors.currency = "Please select a currency.";
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const val = type === "checkbox" ? (e.target as HTMLInputElement).checked : value;
    
    setSettings((prev) => ({ ...prev, [name]: val }));
    
    // Clear validation error for this field
    if (validationErrors[name as keyof Settings]) {
      setValidationErrors(prev => ({ ...prev, [name]: undefined }));
    }
    
    // Clear status messages on input change
    setSuccessMessage(null);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSaving(true);
    setSuccessMessage(null);
    setError(null);

    try {
      await fetchApi(`/api/settings`, {
        method: "PUT",
        body: JSON.stringify(settings),
      });
      setSuccessMessage("Settings updated successfully!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save settings.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ProtectedRoute>
      <AppShell>
        <PageHeader
          title="System Settings"
          description="Manage your system preferences and defaults."
        />

        {isLoading ? (
          <LoadingState message="Loading settings..." />
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl mx-auto">
            <Card>
              <CardContent className="p-6 space-y-6">
                {error && (
                  <div className="p-3 bg-red-50 text-red-700 text-sm rounded-md border border-red-200">
                    {error}
                  </div>
                )}
                
                {successMessage && (
                  <div className="p-3 bg-green-50 text-green-700 text-sm rounded-md border border-green-200">
                    {successMessage}
                  </div>
                )}

                {/* Branch Selection Removed */}

                {/* Currency Selection */}
                <div className="space-y-2">
                  <label htmlFor="currency" className="text-sm font-medium text-[var(--color-text-primary)]">
                    Currency Symbol *
                  </label>
                  <Select
                    id="currency"
                    name="currency"
                    value={settings.currency}
                    onChange={handleInputChange}
                    className={validationErrors.currency ? "border-red-500" : ""}
                  >
                    <option value="">Select a currency</option>
                    <option value="PHP">Philippine Peso (PHP)</option>
                    <option value="USD">US Dollar (USD)</option>
                    <option value="EUR">Euro (EUR)</option>
                    <option value="JPY">Japanese Yen (JPY)</option>
                  </Select>
                  {validationErrors.currency && (
                    <p className="text-xs text-red-500">{validationErrors.currency}</p>
                  )}
                </div>

                {/* Notifications Toggle */}
                <div className="flex items-center gap-3 pt-2">
                  <input
                    type="checkbox"
                    id="notificationsEnabled"
                    name="notificationsEnabled"
                    checked={settings.notificationsEnabled}
                    onChange={handleInputChange}
                    className="h-4 w-4 rounded border-[var(--color-border-default)] text-[var(--color-accent)] focus:ring-[var(--color-accent)] cursor-pointer"
                  />
                  <div>
                    <label htmlFor="notificationsEnabled" className="text-sm font-medium text-[var(--color-text-primary)] cursor-pointer">
                      Enable Low Stock Notifications
                    </label>
                    <p className="text-xs text-[var(--color-text-secondary)]">
                      Receive alerts when items fall below their minimum stock level.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button type="submit" disabled={isSaving}>
                <Save className="mr-2 h-4 w-4" />
                {isSaving ? "Saving..." : "Save Settings"}
              </Button>
            </div>
          </form>
        )}
      </AppShell>
    </ProtectedRoute>
  );
}

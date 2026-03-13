"use client";

import { useState } from "react";
import useSWR from "swr";
import { Header } from "@/components/header";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import {
  Settings,
  Server,
  Shield,
  Bell,
  Database,
  Save,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const { user } = useAuth();
  const { data, isLoading, mutate } = useSWR("settings", () => api.getSettings());
  const [saving, setSaving] = useState<string | null>(null);

  const settings = data?.settings || [];

  const handleSaveSetting = async (key: string, value: string) => {
    setSaving(key);
    try {
      await api.updateSetting(key, value);
      mutate();
    } catch (error) {
      console.error("Failed to save setting:", error);
    } finally {
      setSaving(null);
    }
  };

  return (
    <>
      <Header
        title="Settings"
        description="Configure system preferences"
      />

      <div className="p-6 space-y-6">
        {/* Profile Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-primary/10">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">Admin Profile</CardTitle>
                <CardDescription>Your account information</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                <span className="text-xl font-semibold">
                  {user?.full_name
                    ?.split(" ")
                    .map((n) => n[0])
                    .join("")}
                </span>
              </div>
              <div>
                <p className="text-lg font-medium">{user?.full_name}</p>
                <p className="text-sm text-muted-foreground">@{user?.username}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-primary/10">
                <Server className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">System Settings</CardTitle>
                <CardDescription>Configure application behavior</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : settings.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No system settings configured
              </p>
            ) : (
              <div className="space-y-4">
                {settings.map((setting) => (
                  <SettingRow
                    key={setting.id}
                    settingKey={setting.key}
                    value={setting.value}
                    onSave={handleSaveSetting}
                    isSaving={saving === setting.key}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* API Configuration */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-primary/10">
                <Database className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">API Configuration</CardTitle>
                <CardDescription>Backend connection settings</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted">
                <div>
                  <p className="text-sm font-medium">API Endpoint</p>
                  <p className="text-xs text-muted-foreground font-mono">
                    {process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                  <span className="text-xs text-success">Connected</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-primary/10">
                <Bell className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">Notifications</CardTitle>
                <CardDescription>Alert preferences</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <NotificationToggle
                label="Low Balance Alerts"
                description="Notify when student balance is below threshold"
                defaultChecked={true}
              />
              <NotificationToggle
                label="New User Registration"
                description="Notify when new students are registered"
                defaultChecked={true}
              />
              <NotificationToggle
                label="System Errors"
                description="Notify on critical system errors"
                defaultChecked={true}
              />
            </div>
          </CardContent>
        </Card>

        {/* About */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-primary/10">
                <Settings className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">About</CardTitle>
                <CardDescription>Application information</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-muted">
                <p className="text-xs text-muted-foreground">Version</p>
                <p className="text-sm font-medium">1.0.0</p>
              </div>
              <div className="p-4 rounded-lg bg-muted">
                <p className="text-xs text-muted-foreground">Environment</p>
                <p className="text-sm font-medium">Production</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

// Setting Row Component
function SettingRow({
  settingKey,
  value,
  onSave,
  isSaving,
}: {
  settingKey: string;
  value: string;
  onSave: (key: string, value: string) => void;
  isSaving: boolean;
}) {
  const [localValue, setLocalValue] = useState(value);
  const hasChanged = localValue !== value;

  return (
    <div className="flex items-center gap-4">
      <div className="flex-1">
        <Input
          label={settingKey.replace(/_/g, " ").toUpperCase()}
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
        />
      </div>
      <Button
        size="sm"
        onClick={() => onSave(settingKey, localValue)}
        disabled={!hasChanged || isSaving}
        isLoading={isSaving}
        className="mt-6"
      >
        <Save className="w-4 h-4" />
        Save
      </Button>
    </div>
  );
}

// Notification Toggle Component
function NotificationToggle({
  label,
  description,
  defaultChecked,
}: {
  label: string;
  description: string;
  defaultChecked?: boolean;
}) {
  const [checked, setChecked] = useState(defaultChecked);

  return (
    <div className="flex items-center justify-between p-4 rounded-lg bg-muted">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <button
        onClick={() => setChecked(!checked)}
        className={cn(
          "relative w-11 h-6 rounded-full transition-colors duration-200",
          checked ? "bg-primary" : "bg-border"
        )}
      >
        <span
          className={cn(
            "absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform duration-200",
            checked && "translate-x-5"
          )}
        />
      </button>
    </div>
  );
}

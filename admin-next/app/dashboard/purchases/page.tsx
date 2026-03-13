"use client";

import { useState } from "react";
import useSWR from "swr";
import { Header } from "@/components/header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { api } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Purchase } from "@/lib/types";
import { Search, Filter, ShoppingCart, CheckCircle, XCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

const statusConfig = {
  completed: { label: "Completed", variant: "success" as const, icon: CheckCircle },
  pending: { label: "Pending", variant: "warning" as const, icon: Clock },
  failed: { label: "Failed", variant: "destructive" as const, icon: XCircle },
  canceled: { label: "Canceled", variant: "secondary" as const, icon: XCircle },
};

export default function PurchasesPage() {
  const { data, isLoading } = useSWR("purchases", () => api.getPurchases());
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const purchases = data?.purchases || [];

  // Filter purchases
  const filteredPurchases = purchases.filter((purchase) => {
    const matchesSearch =
      purchase.student_id.toString().includes(searchQuery) ||
      purchase.shelf_id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || purchase.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Stats
  const totalRevenue = purchases
    .filter((p) => p.status === "completed")
    .reduce((sum, p) => sum + p.price, 0);
  const todayPurchases = purchases.filter(
    (p) => new Date(p.created_at).toDateString() === new Date().toDateString()
  ).length;

  const columns = [
    {
      key: "id",
      header: "ID",
      render: (purchase: Purchase) => (
        <span className="font-mono text-xs text-muted-foreground">
          {purchase.id.slice(0, 8)}...
        </span>
      ),
    },
    {
      key: "student_id",
      header: "Student ID",
      render: (purchase: Purchase) => (
        <span className="font-mono">{purchase.student_id}</span>
      ),
    },
    {
      key: "shelf_id",
      header: "Shelf",
      render: (purchase: Purchase) => (
        <Badge variant="outline">{purchase.shelf_id}</Badge>
      ),
    },
    {
      key: "price",
      header: "Amount",
      render: (purchase: Purchase) => (
        <span className="font-medium">{formatCurrency(purchase.price)}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (purchase: Purchase) => {
        const config = statusConfig[purchase.status];
        return (
          <Badge variant={config.variant}>
            <config.icon className="w-3 h-3 mr-1" />
            {config.label}
          </Badge>
        );
      },
    },
    {
      key: "created_at",
      header: "Date",
      render: (purchase: Purchase) => (
        <span className="text-muted-foreground text-sm">
          {formatDate(purchase.created_at)}
        </span>
      ),
    },
  ];

  return (
    <>
      <Header
        title="Purchases"
        description="View all purchase transactions"
      />

      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total Purchases</p>
              <p className="text-2xl font-semibold">{purchases.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Today</p>
              <p className="text-2xl font-semibold text-primary">{todayPurchases}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total Revenue</p>
              <p className="text-2xl font-semibold text-success">
                {formatCurrency(totalRevenue)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Completed</p>
              <p className="text-2xl font-semibold">
                {purchases.filter((p) => p.status === "completed").length}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by student ID or shelf..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={cn(
                "w-full h-10 pl-9 pr-4 rounded-lg",
                "bg-input border border-border",
                "text-foreground placeholder:text-muted-foreground",
                "focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent",
                "transition-all duration-200"
              )}
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            {["all", "completed", "pending", "failed", "canceled"].map((status) => (
              <Button
                key={status}
                variant={statusFilter === status ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter(status)}
              >
                {status === "all" ? (
                  <Filter className="w-4 h-4" />
                ) : (
                  <ShoppingCart className="w-4 h-4" />
                )}
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        {/* Purchases Table */}
        <Card>
          <CardContent className="p-0">
            <DataTable
              columns={columns}
              data={filteredPurchases}
              keyExtractor={(purchase) => purchase.id}
              isLoading={isLoading}
              emptyMessage="No purchases found"
            />
          </CardContent>
        </Card>
      </div>
    </>
  );
}

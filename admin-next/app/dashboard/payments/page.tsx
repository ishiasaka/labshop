"use client";

import { useState } from "react";
import useSWR from "swr";
import { Header } from "@/components/header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Payment } from "@/lib/types";
import { Search, Plus, CreditCard, CheckCircle, Clock, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const statusConfig = {
  completed: { label: "Completed", variant: "success" as const, icon: CheckCircle },
  pending: { label: "Pending", variant: "warning" as const, icon: Clock },
  failed: { label: "Failed", variant: "destructive" as const, icon: XCircle },
};

export default function PaymentsPage() {
  const { data, isLoading, mutate } = useSWR("payments", () => api.getPayments());
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const payments = data?.payments || [];

  // Filter payments
  const filteredPayments = payments.filter((payment) => {
    const matchesSearch =
      payment.student_id.toString().includes(searchQuery) ||
      payment.external_transaction_id?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || payment.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Stats
  const totalReceived = payments
    .filter((p) => p.status === "completed")
    .reduce((sum, p) => sum + p.amount_paid, 0);
  const todayPayments = payments.filter(
    (p) => new Date(p.created_at).toDateString() === new Date().toDateString()
  ).length;

  const columns = [
    {
      key: "id",
      header: "ID",
      render: (payment: Payment) => (
        <span className="font-mono text-xs text-muted-foreground">
          {payment.id.slice(0, 8)}...
        </span>
      ),
    },
    {
      key: "student_id",
      header: "Student ID",
      render: (payment: Payment) => (
        <span className="font-mono">{payment.student_id}</span>
      ),
    },
    {
      key: "amount_paid",
      header: "Amount",
      render: (payment: Payment) => (
        <span className="font-medium text-success">
          +{formatCurrency(payment.amount_paid)}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (payment: Payment) => {
        const config = statusConfig[payment.status];
        return (
          <Badge variant={config.variant}>
            <config.icon className="w-3 h-3 mr-1" />
            {config.label}
          </Badge>
        );
      },
    },
    {
      key: "external_transaction_id",
      header: "Transaction ID",
      render: (payment: Payment) => (
        <span className="font-mono text-xs text-muted-foreground">
          {payment.external_transaction_id || "-"}
        </span>
      ),
    },
    {
      key: "created_at",
      header: "Date",
      render: (payment: Payment) => (
        <span className="text-muted-foreground text-sm">
          {formatDate(payment.created_at)}
        </span>
      ),
    },
  ];

  return (
    <>
      <Header
        title="Payments"
        description="View and manage payment transactions"
        actions={
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="w-4 h-4" />
            Record Payment
          </Button>
        }
      />

      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total Payments</p>
              <p className="text-2xl font-semibold">{payments.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Today</p>
              <p className="text-2xl font-semibold text-primary">{todayPayments}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total Received</p>
              <p className="text-2xl font-semibold text-success">
                {formatCurrency(totalReceived)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Completed</p>
              <p className="text-2xl font-semibold">
                {payments.filter((p) => p.status === "completed").length}
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
              placeholder="Search by student ID or transaction..."
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

          <div className="flex gap-2">
            {["all", "completed", "pending", "failed"].map((status) => (
              <Button
                key={status}
                variant={statusFilter === status ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter(status)}
              >
                <CreditCard className="w-4 h-4" />
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        {/* Payments Table */}
        <Card>
          <CardContent className="p-0">
            <DataTable
              columns={columns}
              data={filteredPayments}
              keyExtractor={(payment) => payment.id}
              isLoading={isLoading}
              emptyMessage="No payments found"
            />
          </CardContent>
        </Card>
      </div>

      {/* Create Payment Modal */}
      <CreatePaymentModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          setIsCreateModalOpen(false);
          mutate();
        }}
      />
    </>
  );
}

// Create Payment Modal Component
function CreatePaymentModal({
  isOpen,
  onClose,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    student_id: "",
    amount_paid: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await api.createPayment({
        student_id: parseInt(formData.student_id),
        amount_paid: parseInt(formData.amount_paid),
      });
      setFormData({ student_id: "", amount_paid: "" });
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to record payment");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Payment"
      description="Add a new payment for a student"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
            {error}
          </div>
        )}

        <Input
          label="Student ID"
          id="student_id"
          type="number"
          placeholder="Enter student ID"
          value={formData.student_id}
          onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
          required
        />

        <Input
          label="Amount (THB)"
          id="amount_paid"
          type="number"
          placeholder="Enter payment amount"
          value={formData.amount_paid}
          onChange={(e) => setFormData({ ...formData, amount_paid: e.target.value })}
          required
        />

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" isLoading={isLoading} className="flex-1">
            Record Payment
          </Button>
        </div>
      </form>
    </Modal>
  );
}

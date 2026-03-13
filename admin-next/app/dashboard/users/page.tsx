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
import type { User } from "@/lib/types";
import { Plus, Search, UserCheck, UserX, Filter } from "lucide-react";
import { cn } from "@/lib/utils";

export default function UsersPage() {
  const { data, isLoading, mutate } = useSWR("users", () => api.getUsers());
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const users = data?.users || [];

  // Filter users
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.student_id.toString().includes(searchQuery);

    const matchesStatus =
      statusFilter === "all" || user.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const columns = [
    {
      key: "student_id",
      header: "Student ID",
      render: (user: User) => (
        <span className="font-mono text-sm">{user.student_id}</span>
      ),
    },
    {
      key: "name",
      header: "Name",
      render: (user: User) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
            <span className="text-xs font-medium">
              {user.first_name[0]}{user.last_name[0]}
            </span>
          </div>
          <span className="font-medium">
            {user.first_name} {user.last_name}
          </span>
        </div>
      ),
    },
    {
      key: "account_balance",
      header: "Balance",
      render: (user: User) => (
        <span
          className={cn(
            "font-medium",
            user.account_balance < 0 ? "text-destructive" : "text-success"
          )}
        >
          {formatCurrency(user.account_balance)}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (user: User) => (
        <Badge variant={user.status === "active" ? "success" : "secondary"}>
          {user.status}
        </Badge>
      ),
    },
    {
      key: "created_at",
      header: "Created",
      render: (user: User) => (
        <span className="text-muted-foreground text-sm">
          {formatDate(user.created_at)}
        </span>
      ),
    },
  ];

  return (
    <>
      <Header
        title="Users"
        description="Manage student accounts and balances"
        actions={
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="w-4 h-4" />
            Add User
          </Button>
        }
      />

      <div className="p-6 space-y-6">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by name or ID..."
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
            <Button
              variant={statusFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("all")}
            >
              <Filter className="w-4 h-4" />
              All
            </Button>
            <Button
              variant={statusFilter === "active" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("active")}
            >
              <UserCheck className="w-4 h-4" />
              Active
            </Button>
            <Button
              variant={statusFilter === "inactive" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("inactive")}
            >
              <UserX className="w-4 h-4" />
              Inactive
            </Button>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total Users</p>
              <p className="text-2xl font-semibold">{users.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Active Users</p>
              <p className="text-2xl font-semibold text-success">
                {users.filter((u) => u.status === "active").length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total Debt</p>
              <p className="text-2xl font-semibold text-destructive">
                {formatCurrency(
                  users.reduce((sum, u) => sum + Math.abs(Math.min(0, u.account_balance)), 0)
                )}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Users Table */}
        <Card>
          <CardContent className="p-0">
            <DataTable
              columns={columns}
              data={filteredUsers}
              keyExtractor={(user) => user.student_id.toString()}
              onRowClick={(user) => setSelectedUser(user)}
              isLoading={isLoading}
              emptyMessage="No users found"
            />
          </CardContent>
        </Card>
      </div>

      {/* Create User Modal */}
      <CreateUserModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          setIsCreateModalOpen(false);
          mutate();
        }}
      />

      {/* User Details Modal */}
      <UserDetailsModal
        user={selectedUser}
        onClose={() => setSelectedUser(null)}
        onUpdate={() => mutate()}
      />
    </>
  );
}

// Create User Modal Component
function CreateUserModal({
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
    first_name: "",
    last_name: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await api.createUser({
        student_id: parseInt(formData.student_id),
        first_name: formData.first_name,
        last_name: formData.last_name,
      });
      setFormData({ student_id: "", first_name: "", last_name: "" });
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create user");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add New User"
      description="Create a new student account"
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
          label="First Name"
          id="first_name"
          placeholder="Enter first name"
          value={formData.first_name}
          onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
          required
        />

        <Input
          label="Last Name"
          id="last_name"
          placeholder="Enter last name"
          value={formData.last_name}
          onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
          required
        />

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" isLoading={isLoading} className="flex-1">
            Create User
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// User Details Modal Component
function UserDetailsModal({
  user,
  onClose,
  onUpdate,
}: {
  user: User | null;
  onClose: () => void;
  onUpdate: () => void;
}) {
  const [isUpdating, setIsUpdating] = useState(false);

  if (!user) return null;

  const handleStatusChange = async () => {
    setIsUpdating(true);
    try {
      const newStatus = user.status === "active" ? "inactive" : "active";
      await api.setUserStatus(user.student_id, newStatus);
      onUpdate();
      onClose();
    } catch (err) {
      console.error("Failed to update status:", err);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Modal
      isOpen={!!user}
      onClose={onClose}
      title="User Details"
      description={`Student ID: ${user.student_id}`}
    >
      <div className="space-y-6">
        {/* User Info */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            <span className="text-xl font-semibold">
              {user.first_name[0]}{user.last_name[0]}
            </span>
          </div>
          <div>
            <h3 className="text-lg font-semibold">
              {user.first_name} {user.last_name}
            </h3>
            <Badge variant={user.status === "active" ? "success" : "secondary"}>
              {user.status}
            </Badge>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-muted">
            <p className="text-sm text-muted-foreground">Balance</p>
            <p
              className={cn(
                "text-xl font-semibold",
                user.account_balance < 0 ? "text-destructive" : "text-success"
              )}
            >
              {formatCurrency(user.account_balance)}
            </p>
          </div>
          <div className="p-4 rounded-lg bg-muted">
            <p className="text-sm text-muted-foreground">Created</p>
            <p className="text-sm font-medium">{formatDate(user.created_at)}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Close
          </Button>
          <Button
            variant={user.status === "active" ? "destructive" : "default"}
            onClick={handleStatusChange}
            isLoading={isUpdating}
            disabled={user.account_balance !== 0 && user.status === "active"}
            className="flex-1"
          >
            {user.status === "active" ? "Deactivate" : "Activate"}
          </Button>
        </div>

        {user.account_balance !== 0 && user.status === "active" && (
          <p className="text-xs text-muted-foreground text-center">
            Cannot deactivate user with non-zero balance
          </p>
        )}
      </div>
    </Modal>
  );
}

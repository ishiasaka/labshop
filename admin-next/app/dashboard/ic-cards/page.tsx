"use client";

import { useState } from "react";
import useSWR from "swr";
import { Header } from "@/components/header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import type { ICCard } from "@/lib/types";
import { Search, CreditCard, Filter, CheckCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const statusConfig = {
  active: { label: "Active", variant: "success" as const, icon: CheckCircle },
  deactivated: { label: "Deactivated", variant: "secondary" as const, icon: XCircle },
};

export default function ICCardsPage() {
  const { data, isLoading } = useSWR("ic-cards", () => api.getICCards());
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const cards = data?.iccards || [];

  // Filter cards
  const filteredCards = cards.filter((card) => {
    const matchesSearch =
      card.uid.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.student_id?.toString().includes(searchQuery);

    const matchesStatus =
      statusFilter === "all" || card.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const columns = [
    {
      key: "uid",
      header: "Card UID",
      render: (card: ICCard) => (
        <span className="font-mono text-sm">{card.uid}</span>
      ),
    },
    {
      key: "student_id",
      header: "Linked Student",
      render: (card: ICCard) => (
        card.student_id ? (
          <Badge variant="default">{card.student_id}</Badge>
        ) : (
          <span className="text-muted-foreground text-sm">Not linked</span>
        )
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (card: ICCard) => {
        const config = statusConfig[card.status];
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
      header: "Registered",
      render: (card: ICCard) => (
        <span className="text-muted-foreground text-sm">
          {formatDate(card.created_at)}
        </span>
      ),
    },
    {
      key: "updated_at",
      header: "Last Updated",
      render: (card: ICCard) => (
        <span className="text-muted-foreground text-sm">
          {formatDate(card.updated_at)}
        </span>
      ),
    },
  ];

  return (
    <>
      <Header
        title="IC Cards"
        description="Manage registered IC cards"
      />

      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total Cards</p>
              <p className="text-2xl font-semibold">{cards.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Active</p>
              <p className="text-2xl font-semibold text-success">
                {cards.filter((c) => c.status === "active").length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Linked</p>
              <p className="text-2xl font-semibold text-primary">
                {cards.filter((c) => c.student_id).length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Unlinked</p>
              <p className="text-2xl font-semibold text-warning">
                {cards.filter((c) => !c.student_id).length}
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
              placeholder="Search by UID or student ID..."
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
              <CreditCard className="w-4 h-4" />
              Active
            </Button>
            <Button
              variant={statusFilter === "deactivated" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("deactivated")}
            >
              <CreditCard className="w-4 h-4" />
              Deactivated
            </Button>
          </div>
        </div>

        {/* IC Cards Table */}
        <Card>
          <CardContent className="p-0">
            <DataTable
              columns={columns}
              data={filteredCards}
              keyExtractor={(card) => card.id}
              isLoading={isLoading}
              emptyMessage="No IC cards found"
            />
          </CardContent>
        </Card>
      </div>
    </>
  );
}

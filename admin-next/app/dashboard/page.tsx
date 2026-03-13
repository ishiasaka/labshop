"use client";

import useSWR from "swr";
import { Header } from "@/components/header";
import { StatsCard } from "@/components/dashboard/stats-card";
import { ActivityItem } from "@/components/dashboard/activity-item";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { formatCurrency, formatRelativeTime } from "@/lib/utils";
import {
  Users,
  ShoppingCart,
  CreditCard,
  TrendingUp,
  HardDrive,
  UserCheck,
  AlertCircle,
  ArrowUpRight,
} from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const { data: usersData } = useSWR("users", () => api.getUsers());
  const { data: purchasesData } = useSWR("purchases", () => api.getPurchases());
  const { data: paymentsData } = useSWR("payments", () => api.getPayments());
  const { data: shelvesData } = useSWR("shelves", () => api.getShelves());

  const users = usersData?.users || [];
  const purchases = purchasesData?.purchases || [];
  const payments = paymentsData?.payments || [];
  const shelves = shelvesData?.shelves || [];

  // Calculate stats
  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.status === "active").length;
  const totalDebt = users.reduce((sum, u) => sum + Math.abs(Math.min(0, u.account_balance)), 0);
  const totalBalance = users.reduce((sum, u) => sum + u.account_balance, 0);

  const today = new Date().toDateString();
  const todayPurchases = purchases.filter(
    (p) => new Date(p.created_at).toDateString() === today
  ).length;
  const todayPayments = payments.filter(
    (p) => new Date(p.created_at).toDateString() === today
  ).length;

  // Recent activity (combine purchases and payments, sort by date)
  const recentActivity = [
    ...purchases.map((p) => ({
      type: "purchase" as const,
      id: p.id,
      studentId: p.student_id,
      amount: p.price,
      status: p.status,
      timestamp: p.created_at,
    })),
    ...payments.map((p) => ({
      type: "payment" as const,
      id: p.id,
      studentId: p.student_id,
      amount: p.amount_paid,
      status: p.status,
      timestamp: p.created_at,
    })),
  ]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 5);

  // Users with highest debt
  const usersWithDebt = users
    .filter((u) => u.account_balance < 0)
    .sort((a, b) => a.account_balance - b.account_balance)
    .slice(0, 5);

  return (
    <>
      <Header
        title="Dashboard"
        description="Overview of your lab shop performance"
      />

      <div className="p-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Total Users"
            value={totalUsers}
            description={`${activeUsers} active`}
            icon={Users}
          />
          <StatsCard
            title="Total Balance"
            value={formatCurrency(totalBalance)}
            description={totalBalance >= 0 ? "Positive balance" : "Negative balance"}
            icon={TrendingUp}
          />
          <StatsCard
            title="Today's Purchases"
            value={todayPurchases}
            description="Transactions today"
            icon={ShoppingCart}
          />
          <StatsCard
            title="Today's Payments"
            value={todayPayments}
            description="Payments received"
            icon={CreditCard}
          />
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatsCard
            title="Total Debt"
            value={formatCurrency(totalDebt)}
            description="Outstanding balances"
            icon={AlertCircle}
          />
          <StatsCard
            title="Active Shelves"
            value={shelves.length}
            description="Product locations"
            icon={HardDrive}
          />
          <StatsCard
            title="Active Users"
            value={activeUsers}
            description={`${((activeUsers / totalUsers) * 100 || 0).toFixed(0)}% of total`}
            icon={UserCheck}
          />
        </div>

        {/* Activity and Debt Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activity */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-medium">Recent Activity</CardTitle>
              <Link
                href="/dashboard/purchases"
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                View all
                <ArrowUpRight className="w-3 h-3" />
              </Link>
            </CardHeader>
            <CardContent>
              {recentActivity.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">
                  No recent activity
                </p>
              ) : (
                <div className="divide-y divide-border">
                  {recentActivity.map((activity) => (
                    <ActivityItem
                      key={`${activity.type}-${activity.id}`}
                      icon={activity.type === "purchase" ? ShoppingCart : CreditCard}
                      iconColor={
                        activity.type === "purchase"
                          ? "text-warning"
                          : "text-success"
                      }
                      title={
                        activity.type === "purchase"
                          ? `Purchase by ID ${activity.studentId}`
                          : `Payment from ID ${activity.studentId}`
                      }
                      description={`${formatCurrency(activity.amount)} - ${activity.status}`}
                      timestamp={activity.timestamp}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Users with Debt */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-medium">Outstanding Balances</CardTitle>
              <Link
                href="/dashboard/users"
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                View all
                <ArrowUpRight className="w-3 h-3" />
              </Link>
            </CardHeader>
            <CardContent>
              {usersWithDebt.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">
                  No outstanding balances
                </p>
              ) : (
                <div className="space-y-3">
                  {usersWithDebt.map((user) => (
                    <div
                      key={user.student_id}
                      className="flex items-center justify-between py-2"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                          <span className="text-xs font-medium text-foreground">
                            {user.first_name[0]}{user.last_name[0]}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {user.first_name} {user.last_name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            ID: {user.student_id}
                          </p>
                        </div>
                      </div>
                      <Badge variant="destructive">
                        {formatCurrency(Math.abs(user.account_balance))}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

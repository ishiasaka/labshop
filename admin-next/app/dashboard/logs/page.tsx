"use client";

import { useState } from "react";
import useSWR from "swr";
import { Header } from "@/components/header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { api } from "@/lib/api";
import { formatDate, formatRelativeTime } from "@/lib/utils";
import type { AdminLog } from "@/lib/types";
import { Search, ScrollText, User, Target } from "lucide-react";
import { cn } from "@/lib/utils";

export default function LogsPage() {
  const { data, isLoading } = useSWR("admin-logs", () => api.getAdminLogs());
  const [searchQuery, setSearchQuery] = useState("");

  const logs = data?.logs || [];

  // Filter logs
  const filteredLogs = logs.filter((log) => {
    return (
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.admin_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.target?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.targeted_student_id?.toString().includes(searchQuery)
    );
  });

  // Sort by date (newest first)
  const sortedLogs = [...filteredLogs].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const columns = [
    {
      key: "created_at",
      header: "Time",
      render: (log: AdminLog) => (
        <div className="flex flex-col">
          <span className="text-sm">{formatRelativeTime(log.created_at)}</span>
          <span className="text-xs text-muted-foreground">
            {formatDate(log.created_at)}
          </span>
        </div>
      ),
    },
    {
      key: "admin_name",
      header: "Admin",
      render: (log: AdminLog) => (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="w-3.5 h-3.5 text-primary" />
          </div>
          <span className="font-medium">{log.admin_name}</span>
        </div>
      ),
    },
    {
      key: "action",
      header: "Action",
      render: (log: AdminLog) => (
        <span className="text-sm">{log.action}</span>
      ),
    },
    {
      key: "target",
      header: "Target",
      render: (log: AdminLog) => (
        log.target ? (
          <Badge variant="outline">
            <Target className="w-3 h-3 mr-1" />
            {log.target}
          </Badge>
        ) : (
          <span className="text-muted-foreground text-sm">-</span>
        )
      ),
    },
    {
      key: "targeted_student_id",
      header: "Student ID",
      render: (log: AdminLog) => (
        log.targeted_student_id ? (
          <span className="font-mono text-sm">{log.targeted_student_id}</span>
        ) : (
          <span className="text-muted-foreground text-sm">-</span>
        )
      ),
    },
  ];

  return (
    <>
      <Header
        title="Activity Logs"
        description="View admin activity history"
      />

      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total Logs</p>
              <p className="text-2xl font-semibold">{logs.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Today</p>
              <p className="text-2xl font-semibold text-primary">
                {logs.filter(
                  (l) => new Date(l.created_at).toDateString() === new Date().toDateString()
                ).length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Unique Admins</p>
              <p className="text-2xl font-semibold">
                {new Set(logs.map((l) => l.admin_id)).size}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search logs..."
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

        {/* Logs Table */}
        <Card>
          <CardContent className="p-0">
            <DataTable
              columns={columns}
              data={sortedLogs}
              keyExtractor={(log) => log.id}
              isLoading={isLoading}
              emptyMessage="No activity logs found"
            />
          </CardContent>
        </Card>

        {/* Empty State with Icon */}
        {!isLoading && logs.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <ScrollText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No activity logs recorded yet</p>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}

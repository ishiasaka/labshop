"use client";

import { Bell, Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface HeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export function Header({ title, description, actions }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-sm border-b border-border">
      <div className="flex items-center justify-between h-16 px-6">
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-semibold text-foreground truncate">
            {title}
          </h1>
          {description && (
            <p className="text-sm text-muted-foreground truncate mt-0.5">
              {description}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3 ml-4">
          {/* Search */}
          <div className="hidden md:flex items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search..."
                className={cn(
                  "h-9 w-64 pl-9 pr-4 rounded-lg",
                  "bg-muted border border-transparent",
                  "text-sm text-foreground placeholder:text-muted-foreground",
                  "focus:outline-none focus:border-border focus:bg-input",
                  "transition-all duration-200"
                )}
              />
            </div>
          </div>

          {/* Notifications */}
          <button
            className={cn(
              "relative p-2 rounded-lg",
              "text-muted-foreground hover:text-foreground",
              "hover:bg-muted transition-colors duration-200"
            )}
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full" />
          </button>

          {/* Custom Actions */}
          {actions}
        </div>
      </div>
    </header>
  );
}

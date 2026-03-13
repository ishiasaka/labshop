import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface ActivityItemProps {
  icon: LucideIcon;
  iconColor?: string;
  title: string;
  description: string;
  timestamp: string;
}

export function ActivityItem({
  icon: Icon,
  iconColor = "text-primary",
  title,
  description,
  timestamp,
}: ActivityItemProps) {
  return (
    <div className="flex items-start gap-4 py-3">
      <div
        className={cn(
          "p-2 rounded-lg bg-muted flex-shrink-0",
          iconColor
        )}
      >
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5 truncate">
          {description}
        </p>
      </div>
      <span className="text-xs text-muted-foreground flex-shrink-0">
        {formatRelativeTime(timestamp)}
      </span>
    </div>
  );
}

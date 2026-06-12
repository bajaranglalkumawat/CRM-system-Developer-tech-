import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean;
  className?: string;
}

export function StatsCard({
  title,
  value,
  icon: Icon,
  trend,
  trendUp,
  className,
}: StatsCardProps) {
  return (
    <div
      className={cn(
        "rounded-[1.5rem] border border-border bg-card/95 p-6 shadow-xl shadow-slate-900/10",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="mt-2 text-2xl font-bold text-card-foreground">{value}</p>
          {trend && (
            <p
              className={cn(
                "mt-1 text-xs",
                trendUp ? "text-emerald-500" : "text-destructive"
              )}
            >
              {trend}
            </p>
          )}
        </div>
        <div className="rounded-lg bg-primary/10 p-2.5">
          <Icon className="h-5 w-5 text-primary" />
        </div>
      </div>
    </div>
  );
}

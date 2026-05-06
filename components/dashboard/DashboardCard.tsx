import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type DashboardCardTone = "neutral" | "success" | "warning" | "destructive" | "primary";

interface DashboardCardProps {
  label: string;
  value: string;
  caption?: React.ReactNode;
  icon?: React.ReactNode;
  tone?: DashboardCardTone;
  className?: string;
}

export function DashboardCard({
  label,
  value,
  caption,
  icon,
  tone = "neutral",
  className,
}: DashboardCardProps) {
  const valueClass = toneToValueClass(tone);
  const iconBgClass = toneToIconBgClass(tone);

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="flex flex-col gap-3 p-5 pt-5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">
            {label}
          </span>
          {icon && (
            <div
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-md",
                iconBgClass,
              )}
            >
              {icon}
            </div>
          )}
        </div>
        <div className={cn("num text-2xl font-semibold tabular-nums", valueClass)}>
          {value}
        </div>
        {caption && (
          <div className="text-xs text-muted-foreground">{caption}</div>
        )}
      </CardContent>
    </Card>
  );
}

function toneToValueClass(tone: DashboardCardTone): string {
  switch (tone) {
    case "success":
      return "text-success";
    case "destructive":
      return "text-destructive";
    case "warning":
      return "text-foreground";
    case "primary":
      return "text-primary";
    default:
      return "text-foreground";
  }
}

function toneToIconBgClass(tone: DashboardCardTone): string {
  switch (tone) {
    case "success":
      return "bg-success/15 text-success";
    case "destructive":
      return "bg-destructive/10 text-destructive";
    case "warning":
      return "bg-accent/30 text-foreground";
    case "primary":
      return "bg-primary/10 text-primary";
    default:
      return "bg-secondary text-muted-foreground";
  }
}

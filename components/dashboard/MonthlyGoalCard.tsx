"use client";

import { useState } from "react";
import { Target, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { setMonthlyNetGoal } from "@/lib/db/settings";
import { formatILS, formatPercent } from "@/lib/utils";
import { he } from "@/lib/i18n/he";

interface MonthlyGoalCardProps {
  goal: number;       // 0 = not set
  achieved: number;   // current month-to-date net profit
}

export function MonthlyGoalCard({ goal, achieved }: MonthlyGoalCardProps) {
  const [open, setOpen] = useState(false);

  // Empty state — no goal configured
  if (!goal || goal <= 0) {
    return (
      <>
        <Card>
          <CardContent className="flex flex-col gap-4 p-5 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
                <Target className="h-5 w-5" />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium">
                  {he.dashboard.goal.titleEmpty}
                </span>
                <span className="text-sm text-muted-foreground">
                  {he.dashboard.goal.emptyHelp}
                </span>
              </div>
            </div>
            <Button onClick={() => setOpen(true)}>
              <Target className="h-4 w-4" />
              {he.dashboard.goal.setButton}
            </Button>
          </CardContent>
        </Card>

        <GoalEditorSheet
          open={open}
          onOpenChange={setOpen}
          initialAmount={0}
        />
      </>
    );
  }

  // Active state — render the progress bar
  const pct = goal > 0 ? Math.max(0, achieved / goal) : 0;
  const cappedPct = Math.min(1, Math.max(0, pct));
  const remaining = Math.max(0, goal - achieved);
  const overflow = Math.max(0, achieved - goal);
  const reached = achieved >= goal;
  const negative = achieved < 0;

  const subtitle = reached
    ? overflow > 0
      ? he.dashboard.goal.overflowLabel(formatILS(overflow))
      : he.dashboard.goal.reachedLabel
    : he.dashboard.goal.remainingLabel(formatILS(remaining));

  return (
    <>
      <Card>
        <CardContent className="flex flex-col gap-4 p-5 pt-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                  reached
                    ? "bg-success/15 text-success"
                    : "bg-primary/10 text-primary"
                }`}
              >
                <Target className="h-5 w-5" />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {he.dashboard.goal.titleSet}
                </span>
                <span className="num text-xl font-semibold tabular-nums">
                  {formatILS(Math.max(0, achieved))}
                  <span className="mx-1 text-muted-foreground">/</span>
                  {formatILS(goal)}
                </span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setOpen(true)}
              aria-label={he.dashboard.goal.editButton}
            >
              <Pencil className="h-4 w-4" />
            </Button>
          </div>

          {/* Progress bar */}
          <div className="flex flex-col gap-2">
            <div
              className="relative h-2.5 w-full overflow-hidden rounded-full bg-muted"
              style={{ direction: "ltr" }}
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(cappedPct * 100)}
            >
              <div
                className={`h-full rounded-full transition-[width] duration-500 ${
                  reached
                    ? "bg-success"
                    : negative
                      ? "bg-destructive/60"
                      : "bg-primary"
                }`}
                style={{ width: `${cappedPct * 100}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="num font-medium tabular-nums text-foreground">
                {he.dashboard.goal.progressLabel(formatPercent(cappedPct, 0))}
              </span>
              <span
                className={
                  reached
                    ? "font-medium text-success"
                    : "text-muted-foreground"
                }
              >
                {subtitle}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <GoalEditorSheet
        open={open}
        onOpenChange={setOpen}
        initialAmount={goal}
      />
    </>
  );
}

// ─── Editor sheet (bottom sheet — works correctly with mobile keyboard) ─────

interface GoalEditorSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialAmount: number;
}

function GoalEditorSheet({
  open,
  onOpenChange,
  initialAmount,
}: GoalEditorSheetProps) {
  const [value, setValue] = useState<string>(
    initialAmount > 0 ? String(initialAmount) : "",
  );
  const [saving, setSaving] = useState(false);

  // Re-sync the input whenever the sheet opens
  const handleOpenChange = (next: boolean) => {
    if (next) setValue(initialAmount > 0 ? String(initialAmount) : "");
    onOpenChange(next);
  };

  const handleSave = async () => {
    const num = Number(value);
    if (!Number.isFinite(num) || num < 0) {
      toast.error(he.errors.generic);
      return;
    }
    setSaving(true);
    try {
      await setMonthlyNetGoal(num);
      toast.success(
        num > 0 ? he.dashboard.goal.saveSuccess : he.dashboard.goal.removed,
      );
      onOpenChange(false);
    } catch {
      toast.error(he.errors.generic);
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async () => {
    setSaving(true);
    try {
      await setMonthlyNetGoal(0);
      toast.success(he.dashboard.goal.removed);
      onOpenChange(false);
    } catch {
      toast.error(he.errors.generic);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl pb-safe">
        <SheetHeader className="pb-4 text-start">
          <SheetTitle>{he.dashboard.goal.dialogTitle}</SheetTitle>
          <SheetDescription>{he.dashboard.goal.dialogBody}</SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-2 pb-6">
          <Label htmlFor="monthly_goal_amount">
            {he.dashboard.goal.amountLabel}
          </Label>
          <Input
            id="monthly_goal_amount"
            type="number"
            inputMode="decimal"
            min={0}
            step={100}
            placeholder={he.dashboard.goal.amountPlaceholder}
            suffix="₪"
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSave();
              }
            }}
          />
        </div>

        <SheetFooter className="flex-row gap-2 sm:justify-between">
          {initialAmount > 0 && (
            <Button
              type="button"
              variant="outline"
              onClick={handleRemove}
              disabled={saving}
              className="me-auto"
            >
              <Trash2 className="h-4 w-4" />
              {he.dashboard.goal.removeButton}
            </Button>
          )}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              {he.common.cancel}
            </Button>
            <Button type="button" onClick={handleSave} disabled={saving}>
              {saving ? he.common.saving : he.common.save}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

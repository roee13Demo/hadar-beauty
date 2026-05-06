"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { RefreshCcw, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  listPendingRecurringExpenses,
  postAllPendingRecurringExpenses,
} from "@/lib/db/recurring";
import { formatILS } from "@/lib/utils";
import { he } from "@/lib/i18n/he";

/**
 * Renders nothing if no pending recurring expenses for this calendar month.
 * Otherwise shows a one-click banner to post them all as real transactions.
 */
export function PendingRecurringBanner() {
  const pending = useLiveQuery(() => listPendingRecurringExpenses(), [], []);
  const [isPending, startTransition] = useTransition();
  const [hidden, setHidden] = useState(false);

  if (hidden) return null;
  if (!pending || pending.length === 0) return null;

  const total = pending.reduce((s, r) => s + r.amount_ils, 0);
  const title =
    pending.length === 1
      ? he.recurring.banner.titleSingle
      : he.recurring.banner.titleMany(pending.length);

  const handlePostAll = () => {
    startTransition(async () => {
      try {
        const n = await postAllPendingRecurringExpenses();
        toast.success(
          n === 1
            ? he.recurring.banner.successSingle
            : he.recurring.banner.successMany(n),
        );
        setHidden(true);
      } catch {
        toast.error(he.errors.generic);
      }
    });
  };

  return (
    <div className="rounded-2xl border border-accent/40 bg-gradient-to-bl from-accent/15 via-card to-primary/10 p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/30 text-foreground">
            <RefreshCcw className="h-5 w-5" />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-sm font-semibold">{title}</span>
            <span className="text-xs text-muted-foreground">
              {he.recurring.banner.subtitle}
            </span>
            <ul className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
              {pending.slice(0, 4).map((p) => (
                <li key={p.id} className="flex items-center gap-1.5">
                  <span className="h-1 w-1 rounded-full bg-foreground/40" />
                  <span>{p.name_he}</span>
                  <span className="num tabular-nums">
                    {formatILS(p.amount_ils)}
                  </span>
                </li>
              ))}
              {pending.length > 4 && (
                <li className="text-muted-foreground">
                  ועוד {pending.length - 4}…
                </li>
              )}
            </ul>
            <span className="num text-xs font-medium tabular-nums text-foreground">
              סה״כ: {formatILS(total)}
            </span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 self-stretch sm:self-auto">
          <Button asChild variant="ghost" size="sm">
            <Link href="/recurring">
              {he.recurring.banner.manageButton}
              <ArrowLeft className="h-3 w-3 rtl:rotate-180" />
            </Link>
          </Button>
          <Button onClick={handlePostAll} disabled={isPending}>
            {isPending ? he.common.saving : he.recurring.banner.postAllButton}
          </Button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useRef, useState } from "react";
import { Download, FileSpreadsheet, Save, Upload } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { buildTransactionsCsv, downloadCsv } from "@/lib/export/csv";
import {
  downloadBackup,
  readBackupFile,
  restoreFromBackup,
  type BackupFile,
} from "@/lib/export/backup";
import { he } from "@/lib/i18n/he";
import type { Service, ServiceCategory, Transaction } from "@/lib/db/schema";

interface ExportToolsProps {
  /** Transactions in the currently selected period (used for the CSV). */
  periodTransactions: Transaction[];
  servicesById: Map<string, Service>;
  periodLabel: string;
}

export function ExportTools({
  periodTransactions,
  servicesById,
  periodLabel,
}: ExportToolsProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [pendingRestore, setPendingRestore] = useState<BackupFile | null>(
    null,
  );

  const handleCsv = () => {
    try {
      const csv = buildTransactionsCsv(periodTransactions, {
        servicesById,
        categoryLabel: (c: ServiceCategory) => he.categories[c],
      });
      const filename = `hadar-beauty-${periodLabel}-${todayStamp()}.csv`;
      downloadCsv(filename, csv);
      toast.success(he.analytics.export.csvSuccess);
    } catch {
      toast.error(he.errors.generic);
    }
  };

  const handleBackup = async () => {
    try {
      await downloadBackup();
      toast.success(he.analytics.export.backupSuccess);
    } catch {
      toast.error(he.errors.generic);
    }
  };

  const handleRestoreFile = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file later
    if (!file) return;
    try {
      const backup = await readBackupFile(file);
      setPendingRestore(backup);
    } catch {
      toast.error(he.analytics.export.restoreInvalidFile);
    }
  };

  const handleConfirmRestore = async () => {
    if (!pendingRestore) return;
    try {
      await restoreFromBackup(pendingRestore);
      toast.success(he.analytics.export.restoreSuccess);
      setPendingRestore(null);
    } catch {
      toast.error(he.errors.generic);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          {he.analytics.export.sectionTitle}
        </CardTitle>
        <CardDescription>{he.analytics.export.sectionHelp}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <ExportButton
            icon={FileSpreadsheet}
            title={he.analytics.export.csvButton}
            hint={he.analytics.export.csvHint}
            onClick={handleCsv}
          />
          <ExportButton
            icon={Save}
            title={he.analytics.export.backupButton}
            hint={he.analytics.export.backupHint}
            onClick={handleBackup}
          />
          <ExportButton
            icon={Upload}
            title={he.analytics.export.restoreButton}
            hint={he.analytics.export.restoreHint}
            onClick={() => fileInputRef.current?.click()}
            tone="muted"
          />
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          className="sr-only"
          onChange={handleRestoreFile}
        />
      </CardContent>

      <Dialog
        open={Boolean(pendingRestore)}
        onOpenChange={(o) => !o && setPendingRestore(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {he.analytics.export.restoreConfirmTitle}
            </DialogTitle>
            <DialogDescription>
              {he.analytics.export.restoreConfirmBody}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPendingRestore(null)}
            >
              {he.common.cancel}
            </Button>
            <Button variant="destructive" onClick={handleConfirmRestore}>
              {he.analytics.export.restoreConfirmAction}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

interface ExportButtonProps {
  icon: typeof Download;
  title: string;
  hint: string;
  onClick: () => void;
  tone?: "default" | "muted";
}

function ExportButton({
  icon: Icon,
  title,
  hint,
  onClick,
  tone = "default",
}: ExportButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-start gap-2 rounded-lg border border-border/70 bg-card p-4 text-start transition-colors hover:border-primary/40 hover:bg-secondary/30"
    >
      <div
        className={`flex h-9 w-9 items-center justify-center rounded-md ${
          tone === "muted"
            ? "bg-secondary text-muted-foreground"
            : "bg-primary/10 text-primary"
        }`}
      >
        <Icon className="h-4 w-4" />
      </div>
      <span className="text-sm font-medium">{title}</span>
      <span className="text-xs text-muted-foreground">{hint}</span>
    </button>
  );
}

function todayStamp(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
    2,
    "0",
  )}-${String(d.getDate()).padStart(2, "0")}`;
}

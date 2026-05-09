"use client";

import { useState, useTransition } from "react";
import { Plus, X } from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createTransaction } from "@/lib/db/transactions";
import { listServices } from "@/lib/db/services";
import { readExpenseCategories } from "@/lib/db/settings";
import { todayIso } from "@/lib/db/transactions";
import type { PaymentMethod } from "@/lib/db/schema";
import { cn } from "@/lib/utils";
import { he } from "@/lib/i18n/he";

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: "cash", label: "מזומן" },
  { value: "bit", label: "ביט" },
  { value: "credit", label: "אשראי" },
  { value: "paybox", label: "פייבוקס" },
  { value: "transfer", label: "העברה" },
];

export function QuickAddFAB() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Floating button — sits above the mobile nav, hidden on desktop */}
      <button
        onClick={() => setOpen(true)}
        aria-label={he.quickAdd.title}
        className={cn(
          "fixed bottom-[calc(6rem+env(safe-area-inset-bottom))] end-4 z-50 flex h-14 w-14 items-center justify-center",
          "rounded-full bg-primary text-primary-foreground shadow-lg",
          "transition-transform active:scale-95 md:hidden",
        )}
      >
        <Plus className="h-6 w-6" />
      </button>

      <QuickAddSheet open={open} onOpenChange={setOpen} />
    </>
  );
}

// ─── Sheet with the minimal form ─────────────────────────────────────────────

function QuickAddSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const services = useLiveQuery(() => listServices(), [], []);
  const categories = useLiveQuery(() => readExpenseCategories(), [], []);

  const [type, setType] = useState<"income" | "expense">("income");
  const [amount, setAmount] = useState("");
  const [payment, setPayment] = useState<PaymentMethod>("bit");
  const [serviceId, setServiceId] = useState<string>("");
  const [category, setCategory] = useState<string>("");
  const [isPending, startTransition] = useTransition();

  const reset = () => {
    setType("income");
    setAmount("");
    setPayment("bit");
    setServiceId("");
    setCategory("");
  };

  const handleClose = () => {
    onOpenChange(false);
    reset();
  };

  const handleSave = () => {
    const num = parseFloat(amount.replace(",", "."));
    if (!num || num <= 0) {
      toast.error("יש להזין סכום תקין");
      return;
    }
    startTransition(async () => {
      try {
        await createTransaction({
          date: todayIso(),
          type,
          amount_gross: num,
          payment_method: payment,
          service_id: type === "income" && serviceId ? serviceId : null,
          expense_category:
            type === "expense" && category ? category : null,
          notes_he: null,
        });
        toast.success(
          type === "income"
            ? he.quickAdd.savedIncome
            : he.quickAdd.savedExpense,
        );
        handleClose();
      } catch {
        toast.error(he.errors.generic);
      }
    });
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && handleClose()}>
      <SheetContent side="bottom" className="rounded-t-2xl pb-safe">
        <SheetHeader className="pb-4 text-start">
          <div className="flex items-center justify-between">
            <SheetTitle>{he.quickAdd.title}</SheetTitle>
            <button onClick={handleClose} className="text-muted-foreground">
              <X className="h-5 w-5" />
            </button>
          </div>
        </SheetHeader>

        <div className="flex flex-col gap-5 pb-6">
          {/* Income / Expense toggle */}
          <div className="grid grid-cols-2 gap-2 rounded-xl bg-muted p-1">
            {(["income", "expense"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={cn(
                  "rounded-lg py-2.5 text-sm font-semibold transition-all",
                  type === t
                    ? "bg-card shadow-sm text-foreground"
                    : "text-muted-foreground",
                )}
              >
                {t === "income" ? he.quickAdd.income : he.quickAdd.expense}
              </button>
            ))}
          </div>

          {/* Amount */}
          <Input
            type="number"
            inputMode="decimal"
            placeholder={he.quickAdd.amountPlaceholder}
            suffix="₪"
            autoFocus
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
            className="h-14 text-xl font-semibold"
          />

          {/* Payment method */}
          <div className="grid grid-cols-5 gap-1.5">
            {PAYMENT_METHODS.map((m) => (
              <button
                key={m.value}
                onClick={() => setPayment(m.value)}
                className={cn(
                  "rounded-lg border py-2.5 text-xs font-medium transition-all",
                  payment === m.value
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground",
                )}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* Optional: service or category */}
          {type === "income" && (services ?? []).length > 0 && (
            <Select
              dir="rtl"
              value={serviceId || "__none__"}
              onValueChange={(v) => setServiceId(v === "__none__" ? "" : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder={he.quickAdd.servicePlaceholder} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">
                  {he.quickAdd.servicePlaceholder}
                </SelectItem>
                {(services ?? [])
                  .filter((s) => s.is_active)
                  .map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name_he}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          )}

          {type === "expense" && (categories ?? []).length > 0 && (
            <Select
              dir="rtl"
              value={category || "__none__"}
              onValueChange={(v) => setCategory(v === "__none__" ? "" : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder={he.quickAdd.categoryPlaceholder} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">
                  {he.quickAdd.categoryPlaceholder}
                </SelectItem>
                {(categories ?? []).map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <Button
          className="w-full"
          size="lg"
          onClick={handleSave}
          disabled={isPending || !amount}
        >
          {isPending ? he.common.saving : he.quickAdd.saveButton}
        </Button>
      </SheetContent>
    </Sheet>
  );
}

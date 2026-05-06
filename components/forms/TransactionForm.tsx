"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLiveQuery } from "dexie-react-hooks";
import { toast } from "sonner";
import { TrendingUp, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TransactionPreview } from "@/components/transactions/TransactionPreview";
import { ExpenseCategorySelect } from "@/components/transactions/ExpenseCategorySelect";
import {
  transactionFormSchema,
  type TransactionFormValues,
  PAYMENT_METHOD_OPTIONS,
  todayIso,
} from "@/lib/schemas/transaction-form";
import {
  createTransaction,
  updateTransaction,
} from "@/lib/db/transactions";
import { listServices, findColorAddon } from "@/lib/db/services";
import type {
  Service,
  Transaction,
  PaymentMethod,
} from "@/lib/db/schema";
import { he } from "@/lib/i18n/he";
import { cn } from "@/lib/utils";

interface TransactionFormProps {
  initial?: Transaction;
  onSaved: () => void;
  onCancel: () => void;
}

function buildDefaults(initial?: Transaction): TransactionFormValues {
  if (!initial) {
    return {
      type: "income",
      date: todayIso(),
      service_id: "",
      with_color: false,
      amount_gross: 0,
      payment_method: "cash",
      notes_he: null,
    };
  }
  if (initial.type === "income") {
    return {
      type: "income",
      date: initial.date,
      service_id: initial.service_id ?? "",
      // The original with_color flag is not stored separately - we infer it
      // by comparing amount_gross to (service.price + addon). The form lets
      // her edit the flag and amount manually if needed.
      with_color: false,
      amount_gross: initial.amount_gross,
      payment_method: initial.payment_method,
      notes_he: initial.notes_he,
    };
  }
  return {
    type: "expense",
    date: initial.date,
    expense_category: initial.expense_category ?? "",
    amount_gross: initial.amount_gross,
    payment_method: initial.payment_method,
    notes_he: initial.notes_he,
  };
}

export function TransactionForm({
  initial,
  onSaved,
  onCancel,
}: TransactionFormProps) {
  const [isPending, startTransition] = useTransition();
  const isEditing = Boolean(initial);

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: buildDefaults(initial),
    mode: "onBlur",
  });

  const {
    register,
    handleSubmit,
    setValue,
    control,
    watch,
    reset,
    formState: { errors },
  } = form;

  const services = useLiveQuery(() => listServices(), [], []);
  const activeServices = useMemo(
    () => (services ?? []).filter((s) => s.is_active),
    [services],
  );

  const watchedType = watch("type");
  const watchedDate = watch("date");
  const watchedAmount = watch("amount_gross");
  const watchedNotes = watch("notes_he");
  const watchedPayment = watch("payment_method");

  // Income-only watchers
  const watchedServiceId =
    watchedType === "income"
      ? (watch("service_id" as const) as string)
      : "";
  const watchedWithColor =
    watchedType === "income"
      ? (watch("with_color" as const) as boolean)
      : false;

  // Expense-only watcher
  const watchedExpenseCategory =
    watchedType === "expense"
      ? (watch("expense_category" as const) as string)
      : "";

  const selectedService: Service | null = useMemo(() => {
    if (watchedType !== "income" || !watchedServiceId) return null;
    return activeServices.find((s) => s.id === watchedServiceId) ?? null;
  }, [activeServices, watchedServiceId, watchedType]);

  const colorAddon = selectedService
    ? findColorAddon(selectedService)
    : undefined;

  // Track whether the user has manually edited the amount so we don't
  // clobber their override when the price would normally auto-sync.
  const [amountTouched, setAmountTouched] = useState(false);

  // Auto-populate amount when service changes (and user hasn't typed manually)
  useEffect(() => {
    if (watchedType !== "income") return;
    if (amountTouched) return;
    if (!selectedService) {
      setValue("amount_gross", 0, { shouldValidate: false });
      return;
    }
    const base = selectedService.price_ils;
    const withColor =
      watchedWithColor && colorAddon
        ? colorAddon.price_delta_ils
        : 0;
    setValue("amount_gross", base + withColor, { shouldValidate: false });
  }, [
    selectedService,
    watchedWithColor,
    colorAddon,
    setValue,
    watchedType,
    amountTouched,
  ]);

  // When the service is changed away from a brows service, reset with_color
  useEffect(() => {
    if (watchedType !== "income") return;
    if (!colorAddon && watchedWithColor) {
      setValue("with_color", false, { shouldValidate: false });
    }
  }, [colorAddon, watchedWithColor, watchedType, setValue]);

  // Reset the form when switching variants
  const handleSwitchType = (next: "income" | "expense") => {
    if (next === watchedType) return;
    if (next === "income") {
      reset({
        type: "income",
        date: watchedDate || todayIso(),
        service_id: "",
        with_color: false,
        amount_gross: 0,
        payment_method: watchedPayment || "cash",
        notes_he: watchedNotes ?? null,
      });
    } else {
      reset({
        type: "expense",
        date: watchedDate || todayIso(),
        expense_category: "",
        amount_gross: 0,
        payment_method: watchedPayment || "cash",
        notes_he: watchedNotes ?? null,
      });
    }
    setAmountTouched(false);
  };

  const onSubmit = handleSubmit((values) => {
    startTransition(async () => {
      const payload =
        values.type === "income"
          ? {
              type: "income" as const,
              date: values.date,
              service_id: values.service_id,
              amount_gross: values.amount_gross,
              payment_method: values.payment_method,
              expense_category: null,
              notes_he: values.notes_he,
            }
          : {
              type: "expense" as const,
              date: values.date,
              service_id: null,
              amount_gross: values.amount_gross,
              payment_method: values.payment_method,
              expense_category: values.expense_category,
              notes_he: values.notes_he,
            };
      try {
        if (initial) {
          await updateTransaction(initial.id, payload);
        } else {
          await createTransaction(payload);
        }
        toast.success(he.transactions.saveSuccess);
        onSaved();
      } catch {
        toast.error(he.errors.generic);
      }
    });
  });

  const noActiveServices = activeServices.length === 0;

  return (
    <form onSubmit={onSubmit} className="flex flex-1 flex-col gap-6">
      <div className="grid flex-1 grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-5">
          {/* Type toggle */}
          <div className="flex items-center gap-1 rounded-lg border border-border/70 bg-secondary/30 p-1">
            <TypeButton
              active={watchedType === "income"}
              icon={TrendingUp}
              label={he.transactions.typeIncome}
              tone="success"
              onClick={() => handleSwitchType("income")}
            />
            <TypeButton
              active={watchedType === "expense"}
              icon={TrendingDown}
              label={he.transactions.typeExpense}
              tone="destructive"
              onClick={() => handleSwitchType("expense")}
            />
          </div>

          <FormField
            label={he.transactions.fields.date}
            error={errors.date?.message}
            htmlFor="date"
          >
            <Input id="date" type="date" {...register("date")} />
          </FormField>

          {watchedType === "income" ? (
            <>
              <FormField
                label={he.transactions.fields.service}
                error={
                  (errors as Record<string, { message?: string } | undefined>)
                    .service_id?.message
                }
                htmlFor="service_id"
              >
                {noActiveServices ? (
                  <p className="rounded-lg border border-dashed border-border/70 bg-card/50 p-3 text-sm text-muted-foreground">
                    {he.transactions.validation.noActiveServices}
                  </p>
                ) : (
                  <Controller
                    control={control}
                    name="service_id"
                    render={({ field }) => (
                      <Select
                        dir="rtl"
                        value={field.value || undefined}
                        onValueChange={(v) => {
                          field.onChange(v);
                          setAmountTouched(false);
                        }}
                      >
                        <SelectTrigger id="service_id">
                          <SelectValue
                            placeholder={
                              he.transactions.fields.servicePlaceholder
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {activeServices.map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              {he.categories[s.category]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                )}
              </FormField>

              {colorAddon && (
                <div className="flex items-center justify-between rounded-lg border border-border/70 bg-secondary/30 p-4">
                  <Label
                    htmlFor="with_color"
                    className="cursor-pointer text-sm"
                  >
                    {he.transactions.fields.withColor.replace(
                      "%price",
                      String(colorAddon.price_delta_ils),
                    )}
                  </Label>
                  <Switch
                    id="with_color"
                    checked={watchedWithColor}
                    onCheckedChange={(checked) => {
                      setValue("with_color", checked, {
                        shouldValidate: false,
                      });
                      setAmountTouched(false);
                    }}
                  />
                </div>
              )}
            </>
          ) : (
            <FormField
              label={he.transactions.fields.expenseCategory}
              error={
                (errors as Record<string, { message?: string } | undefined>)
                  .expense_category?.message
              }
              htmlFor="expense_category"
            >
              <Controller
                control={control}
                name="expense_category"
                render={({ field }) => (
                  <ExpenseCategorySelect
                    value={field.value ?? ""}
                    onChange={field.onChange}
                  />
                )}
              />
            </FormField>
          )}

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <FormField
              label={he.transactions.fields.amount}
              error={errors.amount_gross?.message}
              htmlFor="amount_gross"
            >
              <Input
                id="amount_gross"
                type="number"
                inputMode="decimal"
                step="0.5"
                min={0}
                placeholder="0"
                suffix="₪"
                {...register("amount_gross", {
                  valueAsNumber: true,
                  onChange: () => setAmountTouched(true),
                })}
              />
            </FormField>

            <FormField
              label={he.transactions.fields.paymentMethod}
              error={errors.payment_method?.message}
              htmlFor="payment_method"
            >
              <Controller
                control={control}
                name="payment_method"
                render={({ field }) => (
                  <Select
                    dir="rtl"
                    value={field.value}
                    onValueChange={(v) =>
                      field.onChange(v as PaymentMethod)
                    }
                  >
                    <SelectTrigger id="payment_method">
                      <SelectValue
                        placeholder={
                          he.transactions.fields.paymentMethodPlaceholder
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {PAYMENT_METHOD_OPTIONS.map((m) => (
                        <SelectItem key={m} value={m}>
                          {he.paymentMethods[m]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </FormField>
          </div>

          <FormField
            label={he.transactions.fields.notes}
            error={errors.notes_he?.message}
            htmlFor="notes_he"
          >
            <Textarea
              id="notes_he"
              placeholder={he.transactions.fields.notesPlaceholder}
              {...register("notes_he")}
            />
          </FormField>
        </div>

        <div className="lg:sticky lg:top-0 lg:self-start">
          {watchedType === "income" ? (
            <TransactionPreview
              variant="income"
              service={selectedService}
              amountGross={watchedAmount}
            />
          ) : (
            <TransactionPreview
              variant="expense"
              amountGross={watchedAmount}
              expenseCategory={watchedExpenseCategory || null}
            />
          )}
        </div>
      </div>

      <div className="flex flex-row-reverse items-center gap-2 border-t border-border/60 pt-4">
        <Button type="submit" disabled={isPending || noActiveServices && watchedType === "income"}>
          {isPending
            ? he.common.saving
            : isEditing
              ? he.common.save
              : "שמירת עסקה"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          {he.common.cancel}
        </Button>
      </div>
    </form>
  );
}

interface TypeButtonProps {
  active: boolean;
  icon: typeof TrendingUp;
  label: string;
  tone: "success" | "destructive";
  onClick: () => void;
}

function TypeButton({ active, icon: Icon, label, tone, onClick }: TypeButtonProps) {
  const activeBg =
    tone === "success" ? "bg-success/15 text-success" : "bg-destructive/10 text-destructive";
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        active
          ? activeBg
          : "text-muted-foreground hover:bg-card",
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

interface FormFieldProps {
  label: string;
  htmlFor: string;
  error?: string;
  children: React.ReactNode;
}

function FormField({ label, htmlFor, error, children }: FormFieldProps) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error && (
        <span
          className={cn("text-xs text-destructive", "animate-fade-in")}
          role="alert"
        >
          {error}
        </span>
      )}
    </div>
  );
}

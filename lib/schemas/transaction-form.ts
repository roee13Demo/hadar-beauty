import { z } from "zod";
import { he } from "@/lib/i18n/he";
import type { PaymentMethod } from "@/lib/db/schema";

const PAYMENT_METHODS: PaymentMethod[] = [
  "cash",
  "credit",
  "bit",
  "paybox",
  "transfer",
];

/**
 * The form is a discriminated union on `type`. Income requires service_id,
 * expense requires expense_category. Both share date, amount, payment, notes.
 */
const baseFields = {
  date: z
    .string({ required_error: he.transactions.validation.dateRequired })
    .min(1, he.transactions.validation.dateRequired),
  amount_gross: z
    .number({
      required_error: he.transactions.validation.amountRequired,
      invalid_type_error: he.transactions.validation.amountRequired,
    })
    .positive(he.transactions.validation.amountPositive)
    .max(999999, he.transactions.validation.amountMax),
  payment_method: z.enum(
    PAYMENT_METHODS as [PaymentMethod, ...PaymentMethod[]],
    {
      required_error: he.transactions.validation.paymentMethodRequired,
      invalid_type_error: he.transactions.validation.paymentMethodRequired,
    },
  ),
  notes_he: z
    .string()
    .max(500, he.transactions.validation.notesMax)
    .nullable()
    .transform((v) => (v && v.trim().length > 0 ? v : null)),
};

export const incomeFormSchema = z.object({
  ...baseFields,
  type: z.literal("income"),
  service_id: z
    .string({ required_error: he.transactions.validation.serviceRequired })
    .min(1, he.transactions.validation.serviceRequired),
  with_color: z.boolean(),
});

export const expenseFormSchema = z.object({
  ...baseFields,
  type: z.literal("expense"),
  expense_category: z
    .string({
      required_error: he.transactions.validation.expenseCategoryRequired,
    })
    .min(1, he.transactions.validation.expenseCategoryRequired),
});

export const transactionFormSchema = z.discriminatedUnion("type", [
  incomeFormSchema,
  expenseFormSchema,
]);

export type IncomeFormValues = z.infer<typeof incomeFormSchema>;
export type ExpenseFormValues = z.infer<typeof expenseFormSchema>;
export type TransactionFormValues = z.infer<typeof transactionFormSchema>;

export const PAYMENT_METHOD_OPTIONS = PAYMENT_METHODS;

export function todayIso(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

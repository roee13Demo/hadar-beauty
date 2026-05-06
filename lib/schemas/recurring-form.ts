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

export const recurringExpenseFormSchema = z.object({
  name_he: z
    .string({
      required_error: he.recurring.validation.nameRequired,
      invalid_type_error: he.recurring.validation.nameRequired,
    })
    .min(2, he.recurring.validation.nameMin)
    .max(60),
  amount_ils: z
    .number({
      required_error: he.recurring.validation.amountRequired,
      invalid_type_error: he.recurring.validation.amountRequired,
    })
    .positive(he.recurring.validation.amountPositive)
    .max(99999),
  expense_category: z
    .string({ required_error: he.recurring.validation.categoryRequired })
    .min(1, he.recurring.validation.categoryRequired),
  payment_method: z.enum(
    PAYMENT_METHODS as [PaymentMethod, ...PaymentMethod[]],
    {
      required_error: he.recurring.validation.paymentMethodRequired,
      invalid_type_error: he.recurring.validation.paymentMethodRequired,
    },
  ),
  day_of_month: z
    .number({ invalid_type_error: he.recurring.validation.dayRange })
    .int(he.recurring.validation.dayRange)
    .min(1, he.recurring.validation.dayRange)
    .max(28, he.recurring.validation.dayRange),
  is_active: z.boolean(),
  notes_he: z.string().max(200).nullable(),
});

export type RecurringExpenseFormValues = z.infer<
  typeof recurringExpenseFormSchema
>;

export const RECURRING_FORM_DEFAULTS: RecurringExpenseFormValues = {
  name_he: "",
  amount_ils: 0,
  expense_category: "",
  payment_method: "transfer",
  day_of_month: 1,
  is_active: true,
  notes_he: null,
};

export { PAYMENT_METHODS };

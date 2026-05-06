import { z } from "zod";
import { he } from "@/lib/i18n/he";
import {
  COLOR_ADDON_DEFAULT_PRICE,
  type ServiceCategory,
} from "@/lib/db/schema";

const SERVICE_CATEGORIES: ServiceCategory[] = ["brows", "lash_lift", "facial"];

/**
 * Each service has a free-text Hebrew name (e.g. "עיצוב גבות + צבע") so that
 * multiple services can share the same category. Uniqueness is enforced at the
 * name level (case-insensitive). The colour add-on panel appears only when the
 * category is `brows`.
 */
export const serviceFormSchema = z
  .object({
    name_he: z
      .string({
        required_error: he.services.validation.nameRequired,
        invalid_type_error: he.services.validation.nameRequired,
      })
      .min(2, he.services.validation.nameMin)
      .max(60, he.services.validation.nameMax),
    category: z.enum(
      SERVICE_CATEGORIES as [ServiceCategory, ...ServiceCategory[]],
      {
        required_error: he.services.validation.categoryRequired,
        invalid_type_error: he.services.validation.categoryRequired,
      },
    ),
    price_ils: z
      .number({
        required_error: he.services.validation.priceRequired,
        invalid_type_error: he.services.validation.priceRequired,
      })
      .positive(he.services.validation.pricePositive)
      .max(99999, he.services.validation.priceMax),
    estimated_material_cost: z
      .number({
        invalid_type_error: he.services.validation.materialNonNegative,
      })
      .min(0, he.services.validation.materialNonNegative)
      .max(99999),
    duration_minutes: z
      .number({
        invalid_type_error: he.services.validation.durationRange,
      })
      .int(he.services.validation.durationRange)
      .min(5, he.services.validation.durationRange)
      .max(480, he.services.validation.durationRange),
    is_active: z.boolean(),
    has_color_addon: z.boolean(),
    color_addon_price: z
      .number({
        invalid_type_error: he.services.validation.addOnPricePositive,
      })
      .min(0)
      .max(9999),
  })
  .superRefine((data, ctx) => {
    if (data.estimated_material_cost >= data.price_ils) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["estimated_material_cost"],
        message: he.services.validation.materialBelowPrice,
      });
    }
    if (data.has_color_addon && data.color_addon_price <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["color_addon_price"],
        message: he.services.validation.addOnPricePositive,
      });
    }
  });

export type ServiceFormValues = z.infer<typeof serviceFormSchema>;

export const SERVICE_FORM_DEFAULTS: ServiceFormValues = {
  name_he: "",
  category: "brows",
  price_ils: 0,
  estimated_material_cost: 0,
  duration_minutes: 60,
  is_active: true,
  has_color_addon: false,
  color_addon_price: COLOR_ADDON_DEFAULT_PRICE,
};

export { SERVICE_CATEGORIES };

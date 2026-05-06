import Dexie, { type Table } from "dexie";

export type ServiceCategory = "brows" | "lash_lift" | "facial";

export interface ServiceAddOn {
  name_he: string;
  price_delta_ils: number;
}

export interface Service {
  id: string;
  name_he: string;
  category: ServiceCategory;
  price_ils: number;
  estimated_material_cost: number;
  duration_minutes: number;
  is_active: boolean;
  add_ons: ServiceAddOn[];
  created_at: number;
  updated_at: number;
}

export const COLOR_ADDON_NAME = "כולל צבע";
export const COLOR_ADDON_DEFAULT_PRICE = 10;

export type InventoryCategory =
  | "brows"
  | "lashes"
  | "facial"
  | "tools";

export type InventoryUnit = "ml" | "gram" | "piece" | "application";

export interface InventoryItem {
  id: string;
  name_he: string;
  category: InventoryCategory;
  bulk_cost_ils: number;
  bulk_quantity: number;
  unit_type: InventoryUnit;
  cost_per_unit: number;
  current_stock_units: number;
  low_stock_threshold: number;
  expiry_date: string | null;
  notes_he: string | null;
  created_at: number;
  updated_at: number;
}

export interface ServiceMaterial {
  id: string;
  service_id: string;
  inventory_item_id: string;
  units_consumed_per_service: number;
}

export type PaymentMethod =
  | "cash"
  | "credit"
  | "bit"
  | "paybox"
  | "transfer";

export interface RecurringExpense {
  id: string;
  name_he: string;              // e.g. "שכירות"
  amount_ils: number;
  expense_category: string;     // matches Settings.expense_categories
  payment_method: PaymentMethod;
  /** Day of month to post on (1-28 to be safe across months). */
  day_of_month: number;
  is_active: boolean;
  /** "YYYY-MM" of the most recent month this was already posted as a real
   *  Transaction. Used to prevent duplicate auto-posts. */
  last_posted_month: string | null;
  notes_he: string | null;
  created_at: number;
  updated_at: number;
}

export type TransactionType = "income" | "expense";

export interface Transaction {
  id: string;
  date: string;
  type: TransactionType;
  service_id: string | null;
  amount_gross: number;
  tax_rate: number;
  cogs_at_transaction: number;
  net_profit: number;
  payment_method: PaymentMethod;
  expense_category: string | null;
  notes_he: string | null;
  created_at: number;
}

export interface Settings {
  id: "singleton";
  default_tax_rate: number;
  business_name_he: string;
  currency_symbol: string;
  low_stock_warning_enabled: boolean;
  /** Editable list of expense categories - users can add new ones from the form. */
  expense_categories: string[];
  /** Monthly net-profit goal in ILS. 0 = not set / hidden from the dashboard. */
  monthly_net_goal_ils: number;
}

export const DEFAULT_EXPENSE_CATEGORIES: string[] = [
  "קניות מלאי",
  "שיווק",
  "קורסים והשתלמויות",
  "חד פעמי לעסק",
];

class HadarBeautyDB extends Dexie {
  services!: Table<Service, string>;
  inventory_items!: Table<InventoryItem, string>;
  service_materials!: Table<ServiceMaterial, string>;
  transactions!: Table<Transaction, string>;
  settings!: Table<Settings, string>;
  recurring_expenses!: Table<RecurringExpense, string>;

  constructor() {
    super("hadar_beauty");

    this.version(1).stores({
      services: "id, name_he, category, is_active, created_at",
      inventory_items: "id, name_he, category, expiry_date, created_at",
      service_materials: "id, service_id, inventory_item_id, [service_id+inventory_item_id]",
      transactions: "id, date, type, service_id, payment_method, created_at",
      settings: "id",
    });

    // v2: backfill `add_ons: []` for existing services and tighten category enum
    this.version(2)
      .stores({
        services: "id, name_he, category, is_active, created_at",
      })
      .upgrade(async (tx) => {
        await tx
          .table("services")
          .toCollection()
          .modify((service: Service) => {
            if (!Array.isArray(service.add_ons)) {
              service.add_ons = [];
            }
          });
      });

    // v3: ensure Settings has the expense_categories array seeded with defaults
    this.version(3).upgrade(async (tx) => {
      await tx
        .table("settings")
        .toCollection()
        .modify((settings: Settings) => {
          if (!Array.isArray(settings.expense_categories)) {
            settings.expense_categories = [...DEFAULT_EXPENSE_CATEGORIES];
          }
        });
    });

    // v4: backfill `monthly_net_goal_ils` (default 0 = "not set")
    this.version(4).upgrade(async (tx) => {
      await tx
        .table("settings")
        .toCollection()
        .modify((settings: Settings) => {
          if (typeof settings.monthly_net_goal_ils !== "number") {
            settings.monthly_net_goal_ils = 0;
          }
        });
    });

    // v5: introduce the recurring_expenses table
    this.version(5).stores({
      recurring_expenses:
        "id, name_he, expense_category, day_of_month, is_active, created_at",
    });
  }
}

let dbInstance: HadarBeautyDB | null = null;

export function getDB(): HadarBeautyDB {
  if (typeof window === "undefined") {
    throw new Error("getDB() must be called from the client only");
  }
  if (!dbInstance) {
    dbInstance = new HadarBeautyDB();
  }
  return dbInstance;
}

export const DEFAULT_SETTINGS: Settings = {
  id: "singleton",
  default_tax_rate: 0.18,
  business_name_he: "הדר ביוטי",
  currency_symbol: "₪",
  low_stock_warning_enabled: true,
  expense_categories: [...DEFAULT_EXPENSE_CATEGORIES],
  monthly_net_goal_ils: 0,
};

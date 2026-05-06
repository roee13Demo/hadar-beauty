"use client";

import { useState } from "react";
import { Plus, Check, X } from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { addExpenseCategory, readExpenseCategories } from "@/lib/db/settings";
import { he } from "@/lib/i18n/he";
import { cn } from "@/lib/utils";

interface ExpenseCategorySelectProps {
  value: string;
  onChange: (value: string) => void;
  ariaInvalid?: boolean;
}

export function ExpenseCategorySelect({
  value,
  onChange,
  ariaInvalid,
}: ExpenseCategorySelectProps) {
  const categories = useLiveQuery(() => readExpenseCategories(), [], []);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");

  const handleSelectChange = (next: string) => {
    if (next === "__add_new__") {
      setAdding(true);
      return;
    }
    onChange(next);
  };

  const handleSaveNew = async () => {
    const name = draft.trim();
    if (name.length === 0) {
      toast.error(he.transactions.addCategory.empty);
      return;
    }
    try {
      const updated = await addExpenseCategory(name);
      const wasAdded = updated.includes(name);
      if (!wasAdded) {
        toast.error(he.transactions.addCategory.duplicate);
        return;
      }
      toast.success(he.transactions.addCategory.success);
      onChange(name);
      setDraft("");
      setAdding(false);
    } catch {
      toast.error(he.errors.generic);
    }
  };

  const handleCancelAdd = () => {
    setDraft("");
    setAdding(false);
  };

  return (
    <div className="flex flex-col gap-2">
      <Select
        dir="rtl"
        value={value || undefined}
        onValueChange={handleSelectChange}
      >
        <SelectTrigger
          className={cn(ariaInvalid && "border-destructive")}
          aria-invalid={ariaInvalid}
        >
          <SelectValue
            placeholder={he.transactions.fields.expenseCategoryPlaceholder}
          />
        </SelectTrigger>
        <SelectContent>
          {(categories ?? []).map((c) => (
            <SelectItem key={c} value={c}>
              {c}
            </SelectItem>
          ))}
          <SelectItem
            value="__add_new__"
            className="text-primary focus:text-primary"
          >
            <span className="inline-flex items-center gap-1">
              <Plus className="h-3.5 w-3.5" />
              {he.transactions.addCategory.trigger}
            </span>
          </SelectItem>
        </SelectContent>
      </Select>

      {adding && (
        <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 p-2">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={he.transactions.addCategory.placeholder}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSaveNew();
              } else if (e.key === "Escape") {
                handleCancelAdd();
              }
            }}
          />
          <Button
            type="button"
            size="icon"
            onClick={handleSaveNew}
            aria-label={he.transactions.addCategory.save}
          >
            <Check className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={handleCancelAdd}
            aria-label={he.transactions.addCategory.cancel}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

"use client";

import { Moon, Sun, MonitorSmartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme, type ThemePreference } from "@/components/providers/ThemeProvider";

interface ThemeToggleProps {
  variant?: "icon" | "ghost";
  className?: string;
}

const LABEL: Record<ThemePreference, string> = {
  light: "מצב בהיר",
  dark: "מצב כהה",
  system: "מצב לפי המערכת",
};

const NEXT_PREF: Record<ThemePreference, ThemePreference> = {
  light: "dark",
  dark: "system",
  system: "light",
};

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { preference, setPreference } = useTheme();

  const handleClick = () => setPreference(NEXT_PREF[preference]);

  const Icon =
    preference === "light"
      ? Sun
      : preference === "dark"
        ? Moon
        : MonitorSmartphone;

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleClick}
      aria-label={LABEL[preference]}
      title={LABEL[preference]}
      className={className}
    >
      <Icon className="h-4 w-4" />
    </Button>
  );
}

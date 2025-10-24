import type { AppMode } from "@/tui/AppContent";
import { COMMON_HELP_PATTERNS, formatHelpText, HELP_TEXT } from "@/tui/constants/keyboard";

export function getInstanceBgColor(instance: string | null): string {
  if (!instance) return "gray";
  // Use a simple hash to pick colors consistently
  const colors = ["magenta", "green", "blue", "yellow", "cyan", "red"];
  const hash = instance
    .split("")
    .reduce((a, b) => ((a << 5) - a + b.charCodeAt(0)) & 0xffffffff, 0);
  return colors[Math.abs(hash) % colors.length] ?? "gray";
}

export function getFooterHelpText(
  currentMode: AppMode,
  contextHelpText: string | null
): string {
  // Use help text from context if a child component set it
  if (contextHelpText) return contextHelpText;

  // Otherwise use default help text based on mode
  switch (currentMode) {
    case "command":
      return "Type /command or → for quick menu • Ctrl+C to exit";
    case "pages":
      return COMMON_HELP_PATTERNS.LIST;
    case "deletepages":
      return formatHelpText(
        HELP_TEXT.NAVIGATE,
        HELP_TEXT.TOGGLE,
        "Enter=delete",
        HELP_TEXT.BACK
      );
    case "copypages":
      return formatHelpText(
        HELP_TEXT.NAVIGATE,
        HELP_TEXT.TOGGLE,
        "Enter=copy",
        HELP_TEXT.BACK
      );
    case "navigation":
      return COMMON_HELP_PATTERNS.LIST;
    case "users":
      return COMMON_HELP_PATTERNS.LIST;
    case "groups":
      return COMMON_HELP_PATTERNS.LIST;
    case "help":
      return COMMON_HELP_PATTERNS.VIEW_ONLY;
    case "theme":
      return COMMON_HELP_PATTERNS.MENU;
    default:
      return COMMON_HELP_PATTERNS.VIEW_ONLY;
  }
}

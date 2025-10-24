import React, { useState } from "react";
import { Box, Text, useInput } from "ink";
import type { NavigationConfig } from "@/types";
import { NAVIGATION_MODES } from "@/types";
import { setNavigationMode } from "@/commands/navigation";
import { ConfirmationDialog } from "@comps/modals/ConfirmationDialog";
import { useTheme } from "@/tui/contexts/ThemeContext";
import { useFooterHelp } from "@/tui/contexts/FooterContext";

interface NavModeSelectorProps {
  instance: string;
  currentMode: NavigationConfig["mode"];
  onModeChange: () => void;
  onCancel: () => void;
}

export function NavModeSelector({
  instance,
  currentMode,
  onModeChange,
  onCancel,
}: NavModeSelectorProps) {
  const [selectedIndex, setSelectedIndex] = useState(
    NAVIGATION_MODES.findIndex((m) => m.mode === currentMode)
  );
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { theme } = useTheme();

  useFooterHelp("↑↓ navigate • Enter confirm • Esc cancel");

  useInput((input, key) => {
    if (isSubmitting) return;

    if (key.escape) {
      onCancel();
      return;
    }

    if (key.upArrow) {
      setSelectedIndex((prev) =>
        prev === 0 ? NAVIGATION_MODES.length - 1 : prev - 1
      );
    } else if (key.downArrow) {
      setSelectedIndex((prev) =>
        prev === NAVIGATION_MODES.length - 1 ? 0 : prev + 1
      );
    } else if (key.return) {
      setShowConfirm(true);
    }
  });

  const handleSubmit = async () => {
    const selectedMode = NAVIGATION_MODES[selectedIndex];
    if (!selectedMode) return;

    setIsSubmitting(true);
    setError(null);
    setShowConfirm(false);

    try {
      await setNavigationMode(selectedMode.mode, { instance });
      onModeChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setIsSubmitting(false);
    }
  };

  if (showConfirm) {
    const selectedMode = NAVIGATION_MODES[selectedIndex];
    return (
      <ConfirmationDialog
        title="Change Navigation Mode"
        message={`Change navigation mode to ${selectedMode?.mode}? This will be visible on the wiki immediately.`}
        confirmText="Confirm"
        cancelText="Cancel"
        onConfirm={() => void handleSubmit()}
        onCancel={() => setShowConfirm(false)}
        destructive={false}
      />
    );
  }

  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text color={theme.colors.secondary}>Current mode: {currentMode}</Text>
      </Box>

      {NAVIGATION_MODES.map((modeInfo, index) => {
        const isSelected = index === selectedIndex;
        const isCurrent = modeInfo.mode === currentMode;

        return (
          <Box
            key={modeInfo.mode}
            backgroundColor={isSelected ? theme.colors.primary : undefined}
            paddingX={1}
            marginBottom={1}
          >
            <Box width={8}>
              <Text
                color={
                  isSelected
                    ? theme.colors.background
                    : isCurrent
                    ? theme.colors.success
                    : theme.colors.text
                }
                bold={isSelected || isCurrent}
              >
                {isSelected ? "► " : "  "}
                {modeInfo.mode}
              </Text>
            </Box>
            <Text
              color={isSelected ? theme.colors.background : theme.colors.muted}
            >
              {modeInfo.description}
              {isCurrent && " (current)"}
            </Text>
          </Box>
        );
      })}

      {error && (
        <Box marginTop={1}>
          <Text color={theme.colors.error}>[ERROR] {error}</Text>
        </Box>
      )}

      {isSubmitting && (
        <Box marginTop={1}>
          <Text color={theme.colors.warning}>Updating navigation mode...</Text>
        </Box>
      )}
    </Box>
  );
}

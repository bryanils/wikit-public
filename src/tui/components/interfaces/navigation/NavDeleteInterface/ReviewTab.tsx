import React from "react";
import { Box, Text } from "ink";
import type { NavigationItem } from "@/types";
import { VirtualizedList } from "@comps/ui/VirtualizedList";
import { useTheme } from "@/tui/contexts/ThemeContext";
import { useIcon } from "@/tui/contexts/IconContext";

interface ReviewTabProps {
  markedItems: NavigationItem[];
  reviewSelectedIndex: number;
  selectedButton: "cancel" | "confirm";
  inReviewMode: boolean;
}

export function ReviewTab({
  markedItems,
  reviewSelectedIndex,
  selectedButton,
  inReviewMode,
}: ReviewTabProps) {
  const { theme } = useTheme();
  const { formatIcon } = useIcon();

  return (
    <Box flexDirection="column" paddingX={1} flexGrow={1}>
      <Box
        flexGrow={1}
        borderStyle="round"
        borderColor={inReviewMode ? theme.colors.danger : theme.colors.muted}
        paddingX={1}
        flexDirection="column"
      >
        {markedItems.length === 0 ? (
          <Box justifyContent="center" alignItems="center" flexGrow={1}>
            <Text color={theme.colors.muted}>
              No items marked for deletion. Switch to Select tab to mark items.
            </Text>
          </Box>
        ) : (
          <VirtualizedList
            items={markedItems}
            selectedIndex={inReviewMode ? reviewSelectedIndex : -1}
            getItemKey={(item) => item.id}
            itemHeight={1}
            renderItem={(item, index, isHighlighted) => {
              const icon = formatIcon(item.icon);
              const label = item.label ?? item.id;
              const target = item.target ? ` → ${item.target}` : "";
              const visibility =
                item.visibilityMode && item.visibilityMode !== "all"
                  ? ` [${item.visibilityMode}]`
                  : "";
              const kindLabel = item.kind ? ` (${item.kind})` : "";

              return (
                <Box
                  backgroundColor={isHighlighted && inReviewMode ? theme.colors.primary : undefined}
                  height={1}
                  flexShrink={0}
                >
                  <Text
                    color={
                      isHighlighted && inReviewMode
                        ? theme.colors.background
                        : theme.colors.error
                    }
                    bold={isHighlighted && inReviewMode}
                    dimColor={!inReviewMode}
                    wrap="truncate"
                  >
                    {icon}
                    {label}
                    {target}
                    {visibility}
                    {kindLabel}
                  </Text>
                </Box>
              );
            }}
          />
        )}
      </Box>

      <Box marginTop={1} flexDirection="column" flexShrink={0}>
        <Box marginBottom={1}>
          <Text color={theme.colors.warning} bold dimColor={!inReviewMode}>
            Review {markedItems.length} item(s) before confirming deletion
          </Text>
        </Box>

        <Box>
          <Box
            marginRight={2}
            paddingX={2}
            paddingY={0}
            borderStyle="round"
            borderColor={
              selectedButton === "cancel" && inReviewMode
                ? theme.colors.muted
                : theme.colors.muted
            }
            backgroundColor={
              selectedButton === "cancel" && inReviewMode
                ? theme.colors.muted
                : undefined
            }
          >
            <Text
              color={
                selectedButton === "cancel" && inReviewMode
                  ? theme.colors.background
                  : theme.colors.muted
              }
              bold={selectedButton === "cancel" && inReviewMode}
              dimColor={!inReviewMode}
            >
              Cancel
            </Text>
          </Box>

          <Box
            paddingX={2}
            paddingY={0}
            borderStyle="round"
            borderColor={
              selectedButton === "confirm" && inReviewMode
                ? theme.colors.error
                : theme.colors.muted
            }
            backgroundColor={
              selectedButton === "confirm" && inReviewMode
                ? theme.colors.error
                : undefined
            }
          >
            <Text
              color={
                selectedButton === "confirm" && inReviewMode
                  ? theme.colors.background
                  : theme.colors.error
              }
              bold={selectedButton === "confirm" && inReviewMode}
              dimColor={!inReviewMode}
            >
              Confirm Delete
            </Text>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

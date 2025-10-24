import React from "react";
import { Box, Text } from "ink";
import { useTheme } from "@/tui/contexts/ThemeContext";
import { FileBrowserModal } from "@comps/modals/FileBrowserModal/FileBrowserModal";
import type { Page } from "@/types";

type FocusArea = "fields" | "buttons";
type ActionButton = "export" | "browse" | "cancel";

const FORM_FIELDS = [
  { key: "directory", label: "Directory" },
  { key: "filename", label: "Filename" },
] as const;

interface ExportTabProps {
  instance: string;
  directory: string;
  filename: string;
  currentField: number;
  isEditing: boolean;
  inputValue: string;
  focusArea: FocusArea;
  selectedButton: ActionButton;
  isExporting: boolean;
  error: string | null;
  pages: Page[];
  showFileBrowser: boolean;
  inExportContent: boolean;
  onDirectorySelected: (path: string) => void;
  onCloseFileBrowser: () => void;
}

export function ExportTab({
  directory,
  filename,
  currentField,
  isEditing,
  inputValue,
  focusArea,
  selectedButton,
  isExporting,
  error,
  pages,
  showFileBrowser,
  inExportContent,
  onDirectorySelected,
  onCloseFileBrowser,
}: ExportTabProps) {
  const { theme } = useTheme();

  const fullPath = `${directory}/${filename}`;
  const publishedCount = pages.filter((p) => p.isPublished).length;
  const unpublishedCount = pages.length - publishedCount;

  if (showFileBrowser) {
    return (
      <FileBrowserModal
        title="Select Export Directory"
        initialPath={directory}
        mode="directory"
        onSelect={onDirectorySelected}
        onCancel={onCloseFileBrowser}
      />
    );
  }

  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text color={theme.colors.primary} bold>
          Export Pages
        </Text>
      </Box>

      {FORM_FIELDS.map((field, index) => (
        <Box key={field.key} marginBottom={1}>
          <Box width={20} flexShrink={0}>
            <Text
              color={
                !inExportContent
                  ? theme.colors.muted
                  : index === currentField && focusArea === "fields"
                  ? theme.colors.accent
                  : theme.colors.text
              }
              bold={index === currentField && focusArea === "fields" && inExportContent}
            >
              {index === currentField && focusArea === "fields" && inExportContent ? "▶ " : "  "}
              {field.label}:
            </Text>
          </Box>
          <Box marginLeft={2} flexGrow={1}>
            <Text
              color={
                !inExportContent
                  ? theme.colors.muted
                  : isEditing && index === currentField
                  ? theme.colors.success
                  : index === currentField && focusArea === "fields"
                  ? theme.colors.accent
                  : theme.colors.text
              }
              bold={index === currentField && focusArea === "fields" && inExportContent}
            >
              {isEditing && index === currentField
                ? `${inputValue}|`
                : field.key === "directory"
                ? directory
                : filename}
            </Text>
          </Box>
        </Box>
      ))}

      <Box marginBottom={1}>
        <Box width={20} flexShrink={0}>
          <Text color={theme.colors.muted}>Full Path:</Text>
        </Box>
        <Box marginLeft={2} flexGrow={1}>
          <Text color={theme.colors.muted}>{fullPath}</Text>
        </Box>
      </Box>

      {pages.length > 0 && (
        <Box flexDirection="column" marginBottom={1}>
          <Box marginBottom={1}>
            <Text color={inExportContent ? theme.colors.accent : theme.colors.muted} bold={inExportContent}>Preview:</Text>
          </Box>
          <Box marginLeft={2} marginBottom={1}>
            <Text color={theme.colors.muted}>
              Total: {pages.length} pages • Published: {publishedCount} • Unpublished: {unpublishedCount}
            </Text>
          </Box>
        </Box>
      )}

      {error && (
        <Box marginBottom={1}>
          <Text color={theme.colors.error}>[ERROR] {error}</Text>
        </Box>
      )}

      {isExporting && (
        <Box marginBottom={1}>
          <Text color={theme.colors.warning}>Exporting pages...</Text>
        </Box>
      )}

      <Box marginTop={2} flexDirection="column">
        <Box marginBottom={1}>
          <Box
            marginRight={2}
            paddingX={2}
            paddingY={0}
            borderStyle="round"
            borderColor={
              focusArea === "buttons" && selectedButton === "export" && inExportContent
                ? theme.colors.success
                : theme.colors.muted
            }
            backgroundColor={
              focusArea === "buttons" && selectedButton === "export" && inExportContent
                ? theme.colors.success
                : undefined
            }
          >
            <Text
              color={
                !inExportContent
                  ? theme.colors.muted
                  : focusArea === "buttons" && selectedButton === "export"
                  ? "black"
                  : theme.colors.success
              }
              bold={focusArea === "buttons" && selectedButton === "export" && inExportContent}
            >
              Export
            </Text>
          </Box>

          <Box
            marginRight={2}
            paddingX={2}
            paddingY={0}
            borderStyle="round"
            borderColor={
              focusArea === "buttons" && selectedButton === "browse" && inExportContent
                ? theme.colors.primary
                : theme.colors.muted
            }
            backgroundColor={
              focusArea === "buttons" && selectedButton === "browse" && inExportContent
                ? theme.colors.primary
                : undefined
            }
          >
            <Text
              color={
                !inExportContent
                  ? theme.colors.muted
                  : focusArea === "buttons" && selectedButton === "browse"
                  ? "black"
                  : theme.colors.primary
              }
              bold={focusArea === "buttons" && selectedButton === "browse" && inExportContent}
            >
              Browse
            </Text>
          </Box>

          <Box
            paddingX={2}
            paddingY={0}
            borderStyle="round"
            borderColor={theme.colors.muted}
            backgroundColor={
              focusArea === "buttons" && selectedButton === "cancel" && inExportContent
                ? theme.colors.muted
                : undefined
            }
          >
            <Text
              color={
                focusArea === "buttons" && selectedButton === "cancel" && inExportContent
                  ? "black"
                  : theme.colors.muted
              }
              bold={focusArea === "buttons" && selectedButton === "cancel" && inExportContent}
            >
              Cancel
            </Text>
          </Box>
        </Box>

        <Text color={theme.colors.muted}>
          {isEditing
            ? "Type to edit • Enter confirm • Esc cancel"
            : focusArea === "fields"
            ? "↑↓ navigate • Enter edit • ↓ to buttons"
            : "←→ navigate buttons • Enter select • ↑ to fields"}
        </Text>
      </Box>
    </Box>
  );
}

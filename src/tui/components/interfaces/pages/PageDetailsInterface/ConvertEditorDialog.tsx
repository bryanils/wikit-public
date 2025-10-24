import { Box, Text, useInput } from "ink";
import { useTheme } from "@/tui/contexts/ThemeContext";
import { useState } from "react";
import { ConfirmationDialog } from "@comps/modals/ConfirmationDialog";

interface ConvertEditorDialogProps {
  currentEditor: string;
  onConvert: (editor: string) => void;
  onCancel: () => void;
}

const AVAILABLE_EDITORS = ['markdown', 'wysiwyg', 'code', 'asciidoc', 'ckeditor'];

export function ConvertEditorDialog({
  currentEditor,
  onConvert,
  onCancel,
}: ConvertEditorDialogProps) {
  const { theme } = useTheme();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [selectedEditor, setSelectedEditor] = useState<string>("");

  useInput((input, key) => {
    if (showConfirmation) return;

    if (key.escape) {
      onCancel();
      return;
    }

    if (key.upArrow) {
      setSelectedIndex((prev) => Math.max(0, prev - 1));
      return;
    }

    if (key.downArrow) {
      setSelectedIndex((prev) => Math.min(AVAILABLE_EDITORS.length - 1, prev + 1));
      return;
    }

    if (key.return) {
      const selected = AVAILABLE_EDITORS[selectedIndex];
      if (selected) {
        setSelectedEditor(selected);
        setShowConfirmation(true);
      }
      return;
    }
  });

  if (showConfirmation) {
    return (
      <Box
        position="absolute"
        width={60}
        flexDirection="column"
        borderStyle="double"
        borderColor={theme.colors.secondary}
        backgroundColor="black"
        paddingX={2}
        paddingY={1}
      >
        <ConfirmationDialog
          title="Confirm Editor Conversion"
          message={`Convert from "${currentEditor}" to "${selectedEditor}"?`}
          confirmText="Convert"
          cancelText="Cancel"
          onConfirm={() => onConvert(selectedEditor)}
          onCancel={() => setShowConfirmation(false)}
        />
      </Box>
    );
  }

  return (
    <Box
      position="absolute"
      width={60}
      flexDirection="column"
      borderStyle="double"
      borderColor={theme.colors.secondary}
      backgroundColor="black"
      paddingX={2}
      paddingY={1}
    >
      <Text color={theme.colors.secondary} bold>
        Convert Editor
      </Text>
      <Text color={theme.colors.muted}>
        Current: {currentEditor}
      </Text>

      <Box marginTop={1} flexDirection="column">
        <Text color={theme.colors.text}>Select new editor:</Text>
        {AVAILABLE_EDITORS.map((editor, index) => {
          const isSelected = index === selectedIndex;
          const isCurrent = editor === currentEditor;

          return (
            <Box key={editor}>
              <Text
                color={
                  isSelected
                    ? theme.colors.background
                    : isCurrent
                    ? theme.colors.muted
                    : theme.colors.text
                }
                backgroundColor={isSelected ? theme.colors.secondary : undefined}
                bold={isSelected}
              >
                {isSelected ? "► " : "  "}
                {editor}
                {isCurrent ? " (current)" : ""}
              </Text>
            </Box>
          );
        })}
      </Box>

      <Box marginTop={1}>
        <Text color={theme.colors.muted}>
          ↑↓=navigate • Enter=convert • Esc=cancel
        </Text>
      </Box>
    </Box>
  );
}

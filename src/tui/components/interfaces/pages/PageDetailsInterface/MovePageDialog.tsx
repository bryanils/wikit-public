import { Box, Text, useInput } from "ink";
import { useTheme } from "@/tui/contexts/ThemeContext";
import { useState } from "react";
import { ConfirmationDialog } from "@comps/modals/ConfirmationDialog";
import { formatHelpText, HELP_TEXT } from "@/tui/constants/keyboard";

interface MovePageDialogProps {
  currentPath: string;
  currentLocale: string;
  onMove: (destinationPath: string, locale: string) => void;
  onCancel: () => void;
}

type Field = "destination" | "locale" | "move";

export function MovePageDialog({
  currentPath,
  currentLocale,
  onMove,
  onCancel,
}: MovePageDialogProps) {
  const { theme } = useTheme();
  const [destination, setDestination] = useState("");
  const [locale, setLocale] = useState(currentLocale);
  const [currentField, setCurrentField] = useState<Field>("destination");
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);

  useInput((input, key) => {
    if (showConfirmation) return;

    if (key.escape) {
      if (isEditing) {
        setIsEditing(false);
      } else {
        onCancel();
      }
      return;
    }

    if (isEditing) {
      if (key.return) {
        if (currentField === "destination") {
          setDestination(inputValue);
        } else if (currentField === "locale") {
          setLocale(inputValue);
        }
        setIsEditing(false);
        return;
      }

      if (key.backspace || key.delete) {
        setInputValue(inputValue.slice(0, -1));
        return;
      }

      if (input) {
        setInputValue(inputValue + input);
      }
    } else {
      if (key.upArrow) {
        if (currentField === "locale") {
          setCurrentField("destination");
        } else if (currentField === "move") {
          setCurrentField("locale");
        }
        return;
      }

      if (key.downArrow) {
        if (currentField === "destination") {
          setCurrentField("locale");
        } else if (currentField === "locale") {
          setCurrentField("move");
        }
        return;
      }

      if (key.return) {
        if (currentField === "move") {
          if (destination) {
            setShowConfirmation(true);
          }
        } else {
          const value = currentField === "destination" ? destination : locale;
          setInputValue(value);
          setIsEditing(true);
        }
      }
    }
  });

  if (showConfirmation) {
    return (
      <Box
        position="absolute"
        width={70}
        flexDirection="column"
        borderStyle="double"
        borderColor={theme.colors.warning}
        backgroundColor="black"
        paddingX={2}
        paddingY={1}
      >
        <ConfirmationDialog
          title="Confirm Move"
          message={`Move "${currentPath}" to "${destination}"?`}
          confirmText="Move"
          cancelText="Cancel"
          onConfirm={() => onMove(destination, locale)}
          onCancel={() => setShowConfirmation(false)}
        />
      </Box>
    );
  }

  const isFieldSelected = (field: Field) => currentField === field && !isEditing;
  const isFieldEditing = (field: Field) => currentField === field && isEditing;

  return (
    <Box
      position="absolute"
      width={70}
      flexDirection="column"
      borderStyle="double"
      borderColor={theme.colors.warning}
      backgroundColor="black"
      paddingX={2}
      paddingY={1}
    >
      <Text color={theme.colors.warning} bold>
        Move Page
      </Text>
      <Text color={theme.colors.muted}>
        Current: {currentPath} ({currentLocale})
      </Text>

      <Box marginTop={1} flexDirection="column">
        <Box>
          <Text
            color={
              isFieldSelected("destination") || isFieldEditing("destination")
                ? theme.colors.primary
                : theme.colors.text
            }
            bold={isFieldSelected("destination")}
          >
            {isFieldSelected("destination") ? "► " : "  "}
            Destination:{" "}
          </Text>
          <Text
            color={
              isFieldSelected("destination") || isFieldEditing("destination")
                ? theme.colors.primary
                : theme.colors.text
            }
          >
            {isFieldEditing("destination")
              ? inputValue
              : destination || "(empty)"}
            {isFieldEditing("destination") ? "|" : ""}
          </Text>
        </Box>

        <Box marginTop={1}>
          <Text
            color={
              isFieldSelected("locale") || isFieldEditing("locale")
                ? theme.colors.primary
                : theme.colors.text
            }
            bold={isFieldSelected("locale")}
          >
            {isFieldSelected("locale") ? "► " : "  "}
            Locale:{" "}
          </Text>
          <Text
            color={
              isFieldSelected("locale") || isFieldEditing("locale")
                ? theme.colors.primary
                : theme.colors.text
            }
          >
            {isFieldEditing("locale") ? inputValue : locale}
            {isFieldEditing("locale") ? "|" : ""}
          </Text>
        </Box>

        <Box marginTop={1}>
          <Text
            color={isFieldSelected("move") ? theme.colors.success : theme.colors.text}
            bold={isFieldSelected("move")}
          >
            {isFieldSelected("move") ? "► " : "  "}
            [Move Page]
          </Text>
        </Box>
      </Box>

      <Box marginTop={1}>
        <Text color={theme.colors.muted}>
          {isEditing
            ? formatHelpText("Enter=save", HELP_TEXT.CANCEL)
            : formatHelpText(HELP_TEXT.NAVIGATE, "Enter=edit/select", HELP_TEXT.CANCEL)}
        </Text>
      </Box>
    </Box>
  );
}

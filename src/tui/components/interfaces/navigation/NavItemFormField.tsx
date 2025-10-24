import React from "react";
import { Box, Text } from "ink";
import type { FormFieldConfig } from "./navFormTypes";
import { useTheme } from "@/tui/contexts/ThemeContext";

interface NavItemFormFieldProps {
  field: FormFieldConfig;
  index: number;
  currentField: number;
  focusArea: "fields" | "buttons";
  isEditing: boolean;
  displayValue: string;
  placeholder: string;
}

export function NavItemFormField({
  field,
  index,
  currentField,
  focusArea,
  isEditing,
  displayValue,
  placeholder,
}: NavItemFormFieldProps) {
  const { theme } = useTheme();
  const isFocused = index === currentField && focusArea === "fields";
  const isEditingThis = isEditing && index === currentField;

  return (
    <Box marginBottom={1}>
      <Box width={20} flexShrink={0}>
        <Text
          color={isFocused ? theme.colors.accent : theme.colors.text}
          bold={isFocused}
        >
          {isFocused ? "▶ " : "  "}
          {field.label}:
        </Text>
      </Box>
      <Box marginLeft={2} flexGrow={1}>
        <Text
          color={
            isEditingThis
              ? theme.colors.success
              : isFocused
              ? theme.colors.accent
              : theme.colors.text
          }
          bold={isFocused}
        >
          {displayValue || (
            <Text color={theme.colors.muted} italic>
              {placeholder}
            </Text>
          )}
          {isEditingThis && (
            <Text color={theme.colors.success}>|</Text>
          )}
        </Text>
      </Box>
    </Box>
  );
}

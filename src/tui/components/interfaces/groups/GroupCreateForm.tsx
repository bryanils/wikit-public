import React, { useState } from "react";
import { Box, Text, useInput } from "ink";
import { useTheme } from "@/tui/contexts/ThemeContext";
import { useFooterHelp } from "@/tui/contexts/FooterContext";
import { createGroup } from "@/api/groups";

interface GroupCreateFormProps {
  instance: string;
  onSuccess: () => void;
  onStatusChange: (message: string) => void;
}

export function GroupCreateForm({
  instance,
  onSuccess,
  onStatusChange,
}: GroupCreateFormProps) {
  const { theme } = useTheme();
  const [groupName, setGroupName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  useFooterHelp("Type group name • Enter=create • Esc=cancel");

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      onStatusChange("Group name is required");
      return;
    }

    setIsCreating(true);
    onStatusChange(`Creating group "${groupName}"...`);

    try {
      const result = await createGroup(groupName, instance);

      if (result.responseResult.succeeded) {
        onStatusChange(`Group "${groupName}" created successfully!`);
        onSuccess();
      } else {
        onStatusChange(
          `Failed to create group: ${result.responseResult.message}`
        );
        setIsCreating(false);
      }
    } catch (error) {
      onStatusChange(
        `Error creating group: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      setIsCreating(false);
    }
  };

  useInput((input, key) => {
    if (isCreating) return;

    if (key.return) {
      void handleCreateGroup();
    } else if (key.backspace || key.delete) {
      setGroupName((prev) => prev.slice(0, -1));
    } else if (input && !key.ctrl && !key.meta && input.length === 1) {
      setGroupName((prev) => prev + input);
    }
  });

  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text color={theme.colors.primary} bold>
          Create New Group
        </Text>
      </Box>

      <Box marginBottom={1}>
        <Text color={theme.colors.secondary}>Group Name: </Text>
        <Text color={theme.colors.accent} bold>
          {groupName || "_"}
        </Text>
      </Box>

      <Box marginBottom={1}>
        <Text color={theme.colors.muted}>
          Type the group name and press Enter to create
        </Text>
      </Box>

      {isCreating && (
        <Box>
          <Text color={theme.colors.warning}>Creating group...</Text>
        </Box>
      )}
    </Box>
  );
}

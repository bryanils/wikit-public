import React, { useState } from "react";
import { Box, Text, useInput } from "ink";
import { useEscape } from "@/tui/contexts/EscapeContext";
import { useTheme } from "@/tui/contexts/ThemeContext";
import { useHeaderData } from "@/tui/contexts/HeaderContext";
import { useFooterHelp } from "@/tui/contexts/FooterContext";
import { VirtualizedList } from "@comps/ui/VirtualizedList";
import { COMMANDS as BASE_COMMANDS } from "@/tui/commands";

interface HelpScreenProps {
  onClose: () => void;
}

interface CommandInfo {
  command: string;
  description: string;
  details: string;
  examples: string[];
  category: string;
}

const COMMAND_DETAILS: Record<string, { details: string; examples: string[] }> =
  {
    pages: {
      details:
        "Opens an interactive browser to view all pages in your Wiki.js instance. Includes built-in search - just start typing to filter pages by title or path. Navigate with arrow keys and press Enter to view page details.",
      examples: ["/pages"],
    },
    deletepages: {
      details:
        "Enter delete mode to remove pages from your Wiki.js instance. Supports both single page deletion and bulk deletion by prefix. All deletions require confirmation to prevent accidents.",
      examples: ["/deletepages"],
    },
    copypages: {
      details:
        "Copy pages from one Wiki.js instance to another. Useful for migrating content or duplicating pages across environments.",
      examples: ["/copypages"],
    },
    analyze: {
      details:
        "Three-tab analysis interface: (1) Analyze Wiki.js export files for unlisted pages, broken nav links, and title inconsistencies. (2) Compare two export snapshots to see changes. (3) Find truly orphaned pages with no incoming links from anywhere on the site (live API check).",
      examples: ["/analyze"],
    },
    users: {
      details:
        "View, create, edit, and manage users in your Wiki.js instance. Includes user permissions, roles, and authentication settings.",
      examples: ["/users"],
    },
    groups: {
      details:
        "View and manage user groups in your Wiki.js instance. Groups control permissions and page access rules for users. Use CLI commands for full group management features.",
      examples: ["/groups"],
    },
    navigation: {
      details:
        "Configure the navigation menu structure for your Wiki.js instance. Add, remove, and reorder navigation items. You can also view and modify navigation settings.",
      examples: ["/navigation", "/nav"],
    },
    compare: {
      details:
        "Compare settings, navigation, and other configurations between two Wiki.js instances. Helps identify differences when managing multiple environments.",
      examples: ["/compare"],
    },
    status: {
      details:
        "Display current status information for your Wiki.js instances, including page counts, user counts, and configuration summaries. Shows differences between instances if multiple are configured.",
      examples: ["/status"],
    },
    sync: {
      details:
        "Sync navigation, settings, and other configurations from one Wiki.js instance to another. Useful for keeping multiple environments in sync.",
      examples: ["/sync"],
    },
    instance: {
      details:
        "Switch between configured Wiki.js instances. The current instance is shown in the header badge. All subsequent commands will use the selected instance.",
      examples: ["/instance", "/i"],
    },
    config: {
      details:
        "Manage your Wiki.js instance configurations. Add new instances, edit existing ones, or remove instances you no longer need.",
      examples: ["/config"],
    },
    theme: {
      details:
        "Open the theme selector to choose from available color themes. Customize the appearance of the TUI to your preference.",
      examples: ["/theme", "/t"],
    },
    help: {
      details:
        "Display help information about all available commands, navigation shortcuts, and usage examples. Use arrow keys to navigate through commands and read detailed descriptions.",
      examples: ["/help"],
    },
    exit: {
      details:
        "Close the Wiki.js TUI application and return to your terminal. You can also use Ctrl+C from anywhere.",
      examples: ["/exit", "/quit"],
    },
  };

const CATEGORY_NAMES: Record<string, string> = {
  pages: "Pages",
  configuration: "Configuration",
  "multi-instance": "Multi-Instance",
  general: "General",
};

const COMMANDS: CommandInfo[] = BASE_COMMANDS.map((cmd) => {
  const detail = COMMAND_DETAILS[cmd.name] ?? {
    details: cmd.description,
    examples: [`/${cmd.name}`],
  };
  const commandDisplay = cmd.aliases
    ? `/${cmd.name} or /${cmd.aliases.join(", /")}`
    : `/${cmd.name}`;

  return {
    command: commandDisplay,
    description: cmd.description,
    details: detail.details,
    examples: detail.examples,
    category: CATEGORY_NAMES[cmd.category ?? "general"] ?? "General",
  };
});

const KEYBOARD_SHORTCUTS = [
  { key: "↑ / ↓", description: "Navigate up/down through items" },
  { key: "Enter", description: "Select item (in lists)" },
  { key: "Esc", description: "Return to previous screen/command prompt" },
  { key: "Ctrl+C", description: "Exit TUI from anywhere" },
];

const UI_COMPONENTS = [
  {
    name: "Header",
    description:
      "Top bar showing current screen title, context info, and instance badge on the right. Changes based on what you're doing.",
  },
  {
    name: "Footer",
    description:
      "Bottom bar showing available keyboard shortcuts on the left and status messages on the right. Updates based on current context.",
  },
  {
    name: "Instance Badge",
    description:
      "Colored badge in the header (e.g., [rmWiki]) showing which Wiki.js instance you're connected to. Use /i to switch instances.",
  },
];

export function HelpScreen({ onClose }: HelpScreenProps) {
  const { theme } = useTheme();
  const [selectedIndex, setSelectedIndex] = useState(0);

  useHeaderData({
    title: "Help Menu",
    metadata: "Wikit TUI and CLI: Manage Wiki.js wikis (Wiki Kit)",
  });
  useFooterHelp("↑↓=navigate • Esc=back");

  useEscape("help", () => {
    onClose();
  });

  useInput((input, key) => {
    if (input === "h" || input === "q") {
      onClose();
      return;
    }

    if (key.upArrow) {
      setSelectedIndex((prev) => Math.max(0, prev - 1));
    } else if (key.downArrow) {
      setSelectedIndex((prev) => Math.min(COMMANDS.length - 1, prev + 1));
    }
  });

  const selectedCommand = COMMANDS[selectedIndex];

  return (
    <Box flexDirection="column" padding={1} flexGrow={1}>
      <Box flexDirection="row" gap={2} flexGrow={1}>
        {/* Left panel: Command list */}
        <Box
          flexDirection="column"
          width="40%"
          borderStyle="single"
          borderColor={theme.colors.primary}
          padding={1}
        >
          <Box marginBottom={1}>
            <Text color={theme.colors.warning} bold>
              Commands
            </Text>
          </Box>
          <VirtualizedList
            items={COMMANDS}
            selectedIndex={selectedIndex}
            itemHeight={1}
            renderItem={(cmd, index, isHighlighted) => (
              <Text
                color={
                  isHighlighted ? theme.colors.background : theme.colors.text
                }
                bold={isHighlighted}
                backgroundColor={
                  isHighlighted ? theme.colors.primary : undefined
                }
              >
                {isHighlighted ? "> " : "  "}
                {cmd.command}
              </Text>
            )}
            getItemKey={(cmd, index) => cmd.command}
          />
        </Box>

        {/* Right panel: Command details */}
        <Box
          flexDirection="column"
          width="60%"
          borderStyle="single"
          borderColor={theme.colors.success}
          padding={1}
        >
          {selectedCommand && (
            <Box flexDirection="column">
              <Box marginBottom={1}>
                <Text color={theme.colors.success} bold>
                  {selectedCommand.command}
                </Text>
              </Box>

              <Box marginBottom={1}>
                <Text color={theme.colors.accent} bold>
                  Category:{" "}
                </Text>
                <Text color={theme.colors.text}>
                  {selectedCommand.category}
                </Text>
              </Box>

              <Box marginBottom={1}>
                <Text color={theme.colors.secondary} bold>
                  Description:
                </Text>
              </Box>
              <Box marginBottom={1} paddingLeft={2}>
                <Text color={theme.colors.text}>{selectedCommand.details}</Text>
              </Box>

              {selectedCommand.examples &&
                selectedCommand.examples.length > 0 && (
                  <Box flexDirection="column">
                    <Text color={theme.colors.warning} bold>
                      Examples:
                    </Text>
                    {selectedCommand.examples.map((example, i) => (
                      <Box key={i} paddingLeft={2}>
                        <Text color={theme.colors.accent}>{example}</Text>
                      </Box>
                    ))}
                  </Box>
                )}
            </Box>
          )}
        </Box>
      </Box>

      {/* Keyboard shortcuts */}
      <Box
        flexDirection="column"
        marginTop={1}
        borderStyle="single"
        borderColor={theme.colors.secondary}
        padding={1}
      >
        <Box marginBottom={1}>
          <Text color={theme.colors.secondary} bold>
            Keyboard Shortcuts
          </Text>
        </Box>
        <Box flexDirection="column">
          {KEYBOARD_SHORTCUTS.map((shortcut, i) => (
            <Box key={i}>
              <Text color={theme.colors.accent}>{shortcut.key.padEnd(10)}</Text>
              <Text color={theme.colors.muted}> - {shortcut.description}</Text>
            </Box>
          ))}
        </Box>
      </Box>

      {/* UI Components */}
      <Box
        flexDirection="column"
        marginTop={1}
        borderStyle="single"
        borderColor={theme.colors.warning}
        padding={1}
      >
        <Box marginBottom={1}>
          <Text color={theme.colors.warning} bold>
            UI Components
          </Text>
        </Box>
        <Box flexDirection="column">
          {UI_COMPONENTS.map((component, i) => (
            <Box key={i} flexDirection="column" marginBottom={1}>
              <Text color={theme.colors.accent} bold>
                {component.name}
              </Text>
              <Box paddingLeft={2}>
                <Text color={theme.colors.muted}>{component.description}</Text>
              </Box>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
}

import React from "react";
import { Box } from "ink";
import { CommandInput } from "@comps/input/CommandInput/CommandInput.js";
import { HelpScreen } from "@comps/navigation/HelpScreen.js";
import { DeleteInterface } from "@comps/interfaces/delete/DeleteInterface.js";
import { PageCopyInterface } from "@comps/interfaces/pagecopy/PageCopyInterface.js";
import { CompareInterface } from "@comps/interfaces/compare/CompareInterface.js";
import { StatusInterface } from "@comps/interfaces/status/StatusInterface.js";
import { SyncInterface } from "@comps/interfaces/sync/SyncInterface.js";
import { ConfigInterface } from "@comps/interfaces/config/ConfigInterface.js";
import { SetupWizard } from "@comps/interfaces/config/SetupWizard.js";
import { NavInterface } from "@comps/interfaces/navigation/NavInterface.js";
import { UsersInterface } from "@comps/interfaces/users/UsersInterface.js";
import { GroupsInterface } from "@comps/interfaces/groups/GroupsInterface.js";
import { PagesInterface } from "@comps/interfaces/pages/PagesInterface.js";
import { AnalysisInterface } from "@comps/interfaces/analysis/AnalysisInterface.js";
import { ThemeSelector } from "@comps/ui/ThemeSelector.js";
import { NoInstanceMessage } from "./NoInstanceMessage";
import { getAvailableInstances } from "@/config/dynamicConfig";
import { useTheme } from "@/tui/contexts/ThemeContext";
import type { AppMode } from "@/tui/AppContent";

interface ModeRendererProps {
  currentMode: AppMode;
  currentInstance: string | null;
  handleCommand: (command: string, args?: string) => void;
  handleEscape: () => void;
  setCurrentMode: (mode: AppMode) => void;
  setCurrentInstance: (instance: string | null) => void;
}

export function ModeRenderer({
  currentMode,
  currentInstance,
  handleCommand,
  handleEscape,
  setCurrentMode,
  setCurrentInstance,
}: ModeRendererProps) {
  const { theme } = useTheme();

  // Modes that don't require an instance
  const noInstanceModes = ["command", "help", "config", "theme", "setup", "exports"];

  // Early return if mode requires instance but none available
  if (!noInstanceModes.includes(currentMode) && !currentInstance) {
    return <NoInstanceMessage />;
  }

  switch (currentMode) {
    case "command":
      return (
        <Box flexDirection="column" flexGrow={1}>
          <CommandInput onCommand={handleCommand} />
        </Box>
      );

    case "pages":
      return (
        <PagesInterface
          instance={currentInstance!}
          onEsc={handleEscape}
        />
      );

    case "deletepages":
      return (
        <DeleteInterface
          instance={currentInstance!}
          onEsc={handleEscape}
        />
      );

    case "copypages":
      return (
        <PageCopyInterface
          instance={currentInstance!}
          onEsc={handleEscape}
        />
      );

    case "help":
      return <HelpScreen onClose={handleEscape} />;

    case "compare":
      return (
        <CompareInterface
          instance={currentInstance!}
          onEsc={handleEscape}
        />
      );

    case "status":
      return (
        <StatusInterface
          instance={currentInstance!}
          onEsc={handleEscape}
        />
      );

    case "sync":
      return (
        <SyncInterface
          instance={currentInstance!}
          onEsc={handleEscape}
        />
      );

    case "config":
      return (
        <ConfigInterface
          onEsc={() => setCurrentMode("command" as AppMode)}
        />
      );

    case "navigation":
      return (
        <NavInterface
          instance={currentInstance!}
          onEsc={() => setCurrentMode("command" as AppMode)}
        />
      );

    case "users":
      return (
        <UsersInterface
          instance={currentInstance!}
          onEsc={handleEscape}
        />
      );

    case "groups":
      return (
        <GroupsInterface
          instance={currentInstance!}
          onEsc={handleEscape}
        />
      );

    case "exports":
      // Always render AnalysisInterface - it handles everything internally
      return (
        <AnalysisInterface
          instance={currentInstance ?? undefined}
          onEsc={handleEscape}
        />
      );

    case "theme":
      return (
        <Box flexDirection="column" flexGrow={1}>
          <ThemeSelector
            onSelect={() => {
              setCurrentMode("command" as AppMode);
            }}
            onCancel={() => {
              setCurrentMode("command" as AppMode);
            }}
          />
        </Box>
      );

    case "setup":
      return (
        <SetupWizard
          onComplete={async (success, instanceId) => {
            if (success) {
              // Set the newly created instance as current
              if (instanceId) {
                setCurrentInstance(instanceId);
              } else {
                // Fallback: use first available instance
                const availableInstances = await getAvailableInstances();
                if (availableInstances.length > 0) {
                  setCurrentInstance(availableInstances[0] ?? null);
                }
              }
              setCurrentMode("command" as AppMode);
            } else {
              // User declined setup - exit the application
              process.exit(0);
            }
          }}
        />
      );

    default:
      return null;
  }
}

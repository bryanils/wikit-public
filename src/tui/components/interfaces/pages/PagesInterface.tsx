import React, { useState, useEffect } from "react";
import { Box, Text } from "ink";
import { useTheme } from "@/tui/contexts/ThemeContext";
import { useEscape } from "@/tui/contexts/EscapeContext";
import { useHeaderData } from "@/tui/contexts/HeaderContext";
import { useFooterHelp, useFooterStatus } from "@/tui/contexts/FooterContext";
import { useSearch } from "@/tui/hooks/useSearch";
import { getAllPages } from "@/api/pages";
import { getPages } from "@/commands/listPages";
import { exportPages } from "@/commands/pages";
import { logger } from "@/utils/logger";
import { AllPagesTab } from "./AllPagesTab";
import { ExportTab } from "./ExportTab";
import { PageDetails } from "./PageDetailsInterface/PageDetails";
import { usePagesKeyboard } from "./hooks/usePagesKeyboard";
import type { Page } from "@/types";

interface PagesInterfaceProps {
  instance: string | null;
  onEsc?: () => void;
}

type TabType = "pages" | "export";
type FocusArea = "fields" | "buttons";
type ActionButton = "export" | "browse" | "cancel";

export function PagesInterface({
  instance,
  onEsc,
}: PagesInterfaceProps) {
  const { theme } = useTheme();
  const [currentTab, setCurrentTab] = useState<TabType>("pages");
  const [statusMsg, setStatusMsg] = useState("");

  // Page details state (owned by this component)
  const [selectedPage, setSelectedPage] = useState<Page | null>(null);

  // Mode flags
  const [inPagesContent, setInPagesContent] = useState(false);
  const [inExportContent, setInExportContent] = useState(false);

  // Pages tab state (like UsersInterface)
  const [allPages, setAllPages] = useState<Page[]>([]);
  const [selectedPageIndex, setSelectedPageIndex] = useState(0);
  const [loadingPages, setLoadingPages] = useState(true);
  const [pagesError, setPagesError] = useState<string | null>(null);

  // Search state
  const [pageSearchQuery, setPageSearchQuery] = useState("");
  const [inSearchMode, setInSearchMode] = useState(false);

  // Filtered pages using search hook
  const filteredPages = useSearch(allPages, pageSearchQuery, ["title", "path"]);

  // Export tab state
  const [directory, setDirectory] = useState(".");
  const [filename, setFilename] = useState("");
  const [currentField, setCurrentField] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [focusArea, setFocusArea] = useState<FocusArea>("fields");
  const [selectedButton, setSelectedButton] = useState<ActionButton>("export");
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pages, setPages] = useState<Page[]>([]);
  const [showFileBrowser, setShowFileBrowser] = useState(false);

  useEffect(() => {
    const date = new Date().toISOString().split("T")[0];
    setFilename(`pages-export-${date}.json`);
    if (instance) {
      void loadBothPageSets();
    }
  }, [instance]);

  const loadBothPageSets = async () => {
    await Promise.all([loadPagesForList(), loadPagesForExport()]);
  };

  const loadPagesForList = async () => {
    if (!instance) return;
    try {
      setLoadingPages(true);
      setPagesError(null);
      setStatusMsg("Loading pages...");
      const pageList = await getPages("", {
        instance,
        recursive: true,
        limit: 500,
      });
      setAllPages(pageList);
      setSelectedPageIndex(0);
      setStatusMsg(`${pageList.length} pages loaded`);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setPagesError(errorMsg);
      setStatusMsg(`Error loading pages: ${errorMsg}`);
    } finally {
      setLoadingPages(false);
    }
  };

  const loadPagesForExport = async () => {
    if (!instance) return;
    try {
      setStatusMsg("Loading pages for export...");
      const exportPages = await getAllPages(instance);
      setPages(exportPages);
      setStatusMsg(`${exportPages.length} pages ready for export`);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setError(errorMsg);
      setStatusMsg(`Error: ${errorMsg}`);
    }
  };

  const handleSaveField = () => {
    if (currentField === 0) {
      setDirectory(inputValue);
    } else {
      setFilename(inputValue);
    }
    setIsEditing(false);
  };

  const handleExport = async () => {
    if (!instance) {
      logger.error("No instance configured for export");
      setError("No instance configured");
      setStatusMsg("Error: No instance configured");
      return;
    }

    setIsExporting(true);
    setError(null);
    setStatusMsg("Exporting pages...");

    try {
      const fs = await import("fs/promises");
      const path = await import("path");

      const fullPath = path.join(directory, filename);
      const dir = path.dirname(fullPath);

      try {
        await fs.mkdir(dir, { recursive: true });
      } catch (error) {
        logger.error({ dir, error }, "Failed to create directory");
        throw error;
      }

      const result = await exportPages(fullPath, { instance });

      if (result.success) {
        setStatusMsg(`Exported ${pages.length} pages to ${filename}`);
        setCurrentTab("pages");
        setInExportContent(false);
      } else {
        setError(result.message);
        setStatusMsg(`Export failed: ${result.message}`);
        setIsExporting(false);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setError(errorMsg);
      setStatusMsg(`Export error: ${errorMsg}`);
      setIsExporting(false);
    }
  };

  const handleBrowse = () => {
    logger.info({ directory }, "Browse button clicked - opening file browser");
    setShowFileBrowser(true);
  };

  const handleDirectorySelected = (selectedPath: string) => {
    logger.info({ selectedPath }, "Directory selected from browser");
    setDirectory(selectedPath);
    setShowFileBrowser(false);
  };

  const handleCancelExport = () => {
    setCurrentTab("pages");
    setInExportContent(false);
  };

  const handleNavigatePage = (direction: "up" | "down") => {
    if (direction === "up") {
      setSelectedPageIndex((prev) => Math.max(0, prev - 1));
    } else {
      setSelectedPageIndex((prev) => Math.min(allPages.length - 1, prev + 1));
    }
  };

  const handleSelectPage = (page: Page) => {
    setSelectedPage(page);
  };

  useFooterStatus(statusMsg);
  useHeaderData({ title: "Pages", metadata: instance ?? "No instance" });

  // Footer help text
  const footerHelpText = (() => {
    if (currentTab === "pages") {
      if (inSearchMode) {
        return "Type to search • ↓ enter results • Esc exit search";
      }
      if (inPagesContent) {
        return "Tab/1-2 switch tabs • s=search • ↑↓ navigate • Enter view • ↑ to tab bar • Esc back";
      }
      return "Tab/←→ switch tabs • 1-2 quick jump • s=search • ↓ enter list • Esc back";
    } else {
      if (inExportContent) {
        if (isEditing) {
          return "Type to edit • Enter confirm • Esc cancel";
        }
        if (focusArea === "fields") {
          return "Tab/1-2 switch tabs • ↑↓ navigate • Enter edit • ↑ to tab bar";
        }
        return "Tab/1-2 switch tabs • ←→ navigate buttons • Enter select • ↑ to fields";
      }
      return "Tab/←→ switch tabs • 1-2 quick jump • ↓ enter form • Esc back";
    }
  })();

  useFooterHelp(footerHelpText);

  // Escape handler
  useEscape("pages", () => {
    // Check for page details modal first (highest priority)
    if (selectedPage) {
      setSelectedPage(null);
      return;
    }

    // Handle search mode - exit search mode first
    if (currentTab === "pages" && inSearchMode) {
      setInSearchMode(false);
      return;
    }

    // Handle search - clear search if query exists (before exiting)
    if (currentTab === "pages" && pageSearchQuery) {
      setPageSearchQuery("");
      return;
    }

    if (showFileBrowser) {
      setShowFileBrowser(false);
    } else if (isEditing) {
      setIsEditing(false);
      setInputValue(currentField === 0 ? directory : filename);
    } else if (currentTab === "export") {
      setCurrentTab("pages");
      setInExportContent(false);
    } else if (currentTab === "pages") {
      onEsc?.();
    }
  });

  // Keyboard navigation hook
  usePagesKeyboard({
    currentTab,
    setCurrentTab,
    inPagesContent,
    setInPagesContent,
    inExportContent,
    setInExportContent,
    // Pages tab state
    allPages: filteredPages,
    selectedPageIndex,
    setSelectedPageIndex,
    onNavigatePage: handleNavigatePage,
    onSelectPage: handleSelectPage,
    // Search state
    pageSearchQuery,
    setPageSearchQuery,
    inSearchMode,
    setInSearchMode,
    // Export tab state
    currentField,
    setCurrentField,
    isEditing,
    setIsEditing,
    inputValue,
    setInputValue,
    focusArea,
    setFocusArea,
    selectedButton,
    setSelectedButton,
    isExporting,
    showFileBrowser,
    directory,
    filename,
    onSaveField: handleSaveField,
    onExport: handleExport,
    onBrowse: handleBrowse,
    onCancel: handleCancelExport,
  });

  if (!instance) {
    return (
      <Box flexDirection="column">
        <Text color={theme.colors.error}>
          No instance configured. Please run setup first.
        </Text>
      </Box>
    );
  }

  // If viewing page details, render ONLY the modal (component stays mounted, preserves state)
  if (selectedPage) {
    return (
      <PageDetails
        page={selectedPage}
        instance={instance}
        onClose={() => setSelectedPage(null)}
      />
    );
  }

  // Otherwise render the normal interface
  return (
    <Box flexDirection="column" flexGrow={1}>
      {/* Tab Navigation */}
      <Box
        paddingX={1}
        borderStyle="single"
        borderColor={
          currentTab === "pages" ? theme.colors.primary : theme.colors.success
        }
        flexShrink={0}
      >
        <Text
          color={
            currentTab === "pages"
              ? theme.colors.background
              : theme.colors.primary
          }
          backgroundColor={
            currentTab === "pages" ? theme.colors.primary : undefined
          }
          bold={currentTab === "pages"}
        >
          1. All Pages
        </Text>
        <Text> | </Text>
        <Text
          color={
            currentTab === "export"
              ? theme.colors.background
              : theme.colors.success
          }
          backgroundColor={
            currentTab === "export" ? theme.colors.success : undefined
          }
          bold={currentTab === "export"}
        >
          2. Export
        </Text>
      </Box>

      {/* Tab Content */}
      <Box flexGrow={1} flexDirection="column" overflow="hidden">
        {currentTab === "pages" && (
          <AllPagesTab
            pages={filteredPages}
            selectedIndex={selectedPageIndex}
            loading={loadingPages}
            error={pagesError}
            inPagesContent={inPagesContent}
            searchQuery={pageSearchQuery}
            isSearchActive={inSearchMode}
            totalCount={allPages.length}
          />
        )}

        {currentTab === "export" && (
          <ExportTab
            instance={instance}
            directory={directory}
            filename={filename}
            currentField={currentField}
            isEditing={isEditing}
            inputValue={inputValue}
            focusArea={focusArea}
            selectedButton={selectedButton}
            isExporting={isExporting}
            error={error}
            pages={pages}
            showFileBrowser={showFileBrowser}
            inExportContent={inExportContent}
            onDirectorySelected={handleDirectorySelected}
            onCloseFileBrowser={() => setShowFileBrowser(false)}
          />
        )}
      </Box>
    </Box>
  );
}

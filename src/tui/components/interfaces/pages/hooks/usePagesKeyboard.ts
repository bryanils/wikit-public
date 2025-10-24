import { useInput } from "ink";
import { logger } from "@/utils/logger";
import type { Page } from "@/types";

type TabType = "pages" | "export";
type FocusArea = "fields" | "buttons";
type ActionButton = "export" | "browse" | "cancel";

interface UsePagesKeyboardProps {
  currentTab: TabType;
  setCurrentTab: (tab: TabType) => void;
  inPagesContent: boolean;
  setInPagesContent: (value: boolean) => void;
  inExportContent: boolean;
  setInExportContent: (value: boolean) => void;

  // Pages tab state
  allPages: Page[];
  selectedPageIndex: number;
  setSelectedPageIndex: (value: number | ((prev: number) => number)) => void;
  onNavigatePage: (direction: "up" | "down") => void;
  onSelectPage: (page: Page) => void;

  // Search state
  pageSearchQuery: string;
  setPageSearchQuery: (value: string | ((prev: string) => string)) => void;
  inSearchMode: boolean;
  setInSearchMode: (value: boolean) => void;

  // Export tab state
  currentField: number;
  setCurrentField: (value: number) => void;
  isEditing: boolean;
  setIsEditing: (value: boolean) => void;
  inputValue: string;
  setInputValue: (value: string | ((prev: string) => string)) => void;
  focusArea: FocusArea;
  setFocusArea: (value: FocusArea) => void;
  selectedButton: ActionButton;
  setSelectedButton: (value: ActionButton) => void;
  isExporting: boolean;
  showFileBrowser: boolean;
  directory: string;
  filename: string;

  // Export tab actions
  onSaveField: () => void;
  onExport: () => void;
  onBrowse: () => void;
  onCancel: () => void;
}

const FORM_FIELDS_COUNT = 2; // directory and filename

export function usePagesKeyboard({
  currentTab,
  setCurrentTab,
  inPagesContent,
  setInPagesContent,
  inExportContent,
  setInExportContent,
  allPages,
  selectedPageIndex,
  setSelectedPageIndex,
  onNavigatePage,
  onSelectPage,
  pageSearchQuery,
  setPageSearchQuery,
  inSearchMode,
  setInSearchMode,
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
  onSaveField,
  onExport,
  onBrowse,
  onCancel,
}: UsePagesKeyboardProps) {
  useInput((input, key) => {
    // Block input when exporting or file browser is open
    if (isExporting || showFileBrowser) {
      return;
    }

    // Tab key ALWAYS works - exits content modes and switches tabs
    if (key.tab) {
      setInPagesContent(false);
      setInExportContent(false);
      setIsEditing(false);
      setCurrentTab(currentTab === "pages" ? "export" : "pages");
      return;
    }

    // Arrow keys for tab navigation - ONLY when NOT in content
    if (key.rightArrow && !inPagesContent && !inExportContent) {
      setCurrentTab("export");
      return;
    }
    if (key.leftArrow && !inPagesContent && !inExportContent) {
      setCurrentTab("pages");
      return;
    }

    // Quick tab keys - ALWAYS work
    if (input === "1") {
      setCurrentTab("pages");
      setInPagesContent(false);
      setInExportContent(false);
      setIsEditing(false);
      return;
    }
    if (input === "2") {
      setCurrentTab("export");
      setInPagesContent(false);
      setInExportContent(false);
      setIsEditing(false);
      return;
    }

    // PAGES TAB: 's' key enters search mode from tab bar or content
    if (currentTab === "pages" && input === "s" && !inSearchMode) {
      setInSearchMode(true);
      return;
    }

    // PAGES TAB: Search mode handling
    if (currentTab === "pages" && inSearchMode) {
      // All typing goes to search (including numbers 1-4)
      if (!key.upArrow && !key.downArrow && !key.return && input && input.length === 1) {
        setPageSearchQuery((prev) => prev + input);
        return;
      }

      // Backspace edits search
      if (key.backspace) {
        setPageSearchQuery((prev) => prev.slice(0, -1));
        return;
      }

      // Down arrow exits search mode and enters content
      if (key.downArrow) {
        setInSearchMode(false);
        setInPagesContent(true);
        return;
      }
    }

    // PAGES TAB: Enter content (down arrow when NOT in content and NOT in search)
    if (currentTab === "pages" && !inPagesContent && !inSearchMode && key.downArrow) {
      setInPagesContent(true);
      return;
    }

    // PAGES TAB: Exit content (up arrow at position 0 when IN content) - like UsersInterface line 177
    if (currentTab === "pages" && inPagesContent && key.upArrow && selectedPageIndex === 0) {
      setInPagesContent(false);
      return;
    }

    // PAGES TAB: Content navigation (when IN content) - like UsersInterface line 189
    if (currentTab === "pages" && inPagesContent) {
      if (key.upArrow) {
        onNavigatePage("up");
        return;
      }
      if (key.downArrow) {
        onNavigatePage("down");
        return;
      }
      if (key.return) {
        const selectedPage = allPages[selectedPageIndex];
        if (selectedPage) {
          // Clear search when selecting a page
          setPageSearchQuery("");
          setInSearchMode(false);
          onSelectPage(selectedPage);
        }
        return;
      }
    }

    // EXPORT TAB: Enter content (down arrow when NOT in content)
    if (currentTab === "export" && !inExportContent && key.downArrow) {
      setInExportContent(true);
      return;
    }

    // EXPORT TAB: Exit content (up arrow at top when IN content and NOT editing)
    if (currentTab === "export" && inExportContent && !isEditing && key.upArrow) {
      if (focusArea === "fields" && currentField === 0) {
        setInExportContent(false);
        return;
      }
    }

    // EXPORT TAB: Content navigation (only when IN content)
    if (currentTab === "export" && inExportContent) {
      // Editing mode
      if (isEditing) {
        if (key.return) {
          onSaveField();
        } else if (key.backspace || key.delete) {
          setInputValue((prev) => prev.slice(0, -1));
        } else if (input) {
          setInputValue((prev) => prev + input);
        }
        return;
      }

      // Field navigation
      if (focusArea === "fields") {
        if (key.upArrow) {
          const newField = Math.max(0, currentField - 1);
          setCurrentField(newField);
        } else if (key.downArrow) {
          const newField = Math.min(FORM_FIELDS_COUNT - 1, currentField + 1);
          if (newField === FORM_FIELDS_COUNT - 1 && currentField === FORM_FIELDS_COUNT - 1) {
            // At last field, pressing down moves to buttons
            setFocusArea("buttons");
          } else {
            setCurrentField(newField);
          }
        } else if (key.return) {
          setIsEditing(true);
          setInputValue(currentField === 0 ? directory : filename);
        }
        return;
      }

      // Button navigation
      if (focusArea === "buttons") {
        if (key.upArrow) {
          setFocusArea("fields");
          setCurrentField(FORM_FIELDS_COUNT - 1);
        } else if (key.leftArrow) {
          const buttons: ActionButton[] = ["export", "browse", "cancel"];
          const currentIndex = buttons.indexOf(selectedButton);
          const newIndex = Math.max(0, currentIndex - 1);
          setSelectedButton(buttons[newIndex] as ActionButton);
        } else if (key.rightArrow) {
          const buttons: ActionButton[] = ["export", "browse", "cancel"];
          const currentIndex = buttons.indexOf(selectedButton);
          const newIndex = Math.min(buttons.length - 1, currentIndex + 1);
          setSelectedButton(buttons[newIndex] as ActionButton);
        } else if (key.return) {
          logger.info({ selectedButton }, "Button action triggered in export");
          if (selectedButton === "export") {
            onExport();
          } else if (selectedButton === "browse") {
            onBrowse();
          } else if (selectedButton === "cancel") {
            onCancel();
          }
        }
        return;
      }
    }
  });
}

import { useInput } from "ink";
import type { NavigationItem } from "@/types";

type DeleteTabType = "select" | "review";

interface FlatNavigationItem extends NavigationItem {
  depth: number;
  isExpanded?: boolean;
}

interface UseNavDeleteKeyboardProps {
  currentTab: DeleteTabType;
  setCurrentTab: (tab: DeleteTabType | ((prev: DeleteTabType) => DeleteTabType)) => void;
  selectedIndex: number;
  setSelectedIndex: (index: number | ((prev: number) => number)) => void;
  reviewSelectedIndex: number;
  setReviewSelectedIndex: (index: number | ((prev: number) => number)) => void;
  selectedButton: "cancel" | "confirm";
  setSelectedButton: (button: "cancel" | "confirm") => void;
  markedForDeletion: Set<string>;
  setMarkedForDeletion: (marked: Set<string> | ((prev: Set<string>) => Set<string>)) => void;
  expandedItems: Set<string>;
  setExpandedItems: (expanded: Set<string> | ((prev: Set<string>) => Set<string>)) => void;
  flatItems: FlatNavigationItem[];
  markedItems: NavigationItem[];
  showDeleteConfirm: boolean;
  inSelectMode: boolean;
  setInSelectMode: (value: boolean) => void;
  inReviewMode: boolean;
  setInReviewMode: (value: boolean) => void;
  onProceedToConfirm: () => void;
}

export function useNavDeleteKeyboard({
  currentTab,
  setCurrentTab,
  selectedIndex,
  setSelectedIndex,
  reviewSelectedIndex,
  setReviewSelectedIndex,
  selectedButton,
  setSelectedButton,
  markedForDeletion,
  setMarkedForDeletion,
  expandedItems,
  setExpandedItems,
  flatItems,
  markedItems,
  showDeleteConfirm,
  inSelectMode,
  setInSelectMode,
  inReviewMode,
  setInReviewMode,
  onProceedToConfirm,
}: UseNavDeleteKeyboardProps) {
  useInput((input, key) => {
    // Block input when dialogs are open (like PageDetailsModal)
    if (showDeleteConfirm) {
      return;
    }

    // Tab navigation (ALWAYS works, exits modes, cycles tabs)
    if (key.tab) {
      setSelectedIndex(0);
      setReviewSelectedIndex(0);
      setSelectedButton("cancel");
      setInSelectMode(false);
      setInReviewMode(false);
      setCurrentTab((prev) => (prev === "select" ? "review" : "select"));
      return;
    }

    // Arrow navigation for tabs (ONLY when NOT in mode - like PageDetailsModal)
    if (key.rightArrow && !inSelectMode && !inReviewMode) {
      setSelectedIndex(0);
      setReviewSelectedIndex(0);
      setSelectedButton("cancel");
      setCurrentTab("review");
      return;
    }
    if (key.leftArrow && !inSelectMode && !inReviewMode) {
      setSelectedIndex(0);
      setReviewSelectedIndex(0);
      setSelectedButton("cancel");
      setCurrentTab("select");
      return;
    }

    // Quick tab keys (ALWAYS work, exit modes)
    if (input === "1") {
      setCurrentTab("select");
      setInSelectMode(false);
      setInReviewMode(false);
      setSelectedIndex(0);
      return;
    }
    if (input === "2") {
      setCurrentTab("review");
      setInSelectMode(false);
      setInReviewMode(false);
      setReviewSelectedIndex(0);
      setSelectedButton("cancel");
      return;
    }

    // SELECT TAB: Enter mode (down arrow when NOT in mode)
    if (currentTab === "select" && !inSelectMode && key.downArrow) {
      setInSelectMode(true);
      return;
    }

    // SELECT TAB: Exit mode (up arrow at index 0 when IN mode)
    if (currentTab === "select" && inSelectMode && key.upArrow && selectedIndex === 0) {
      setInSelectMode(false);
      return;
    }

    // SELECT TAB: In-mode navigation
    if (currentTab === "select" && inSelectMode) {
      // Up/Down navigation
      if (key.upArrow) {
        setSelectedIndex((prev) => Math.max(0, prev - 1));
        return;
      }
      if (key.downArrow) {
        setSelectedIndex((prev) => Math.min(flatItems.length - 1, prev + 1));
        return;
      }

      // Right arrow: Expand
      if (key.rightArrow) {
        const currentItem = flatItems[selectedIndex];
        if (currentItem?.children && currentItem.children.length > 0) {
          if (!expandedItems.has(currentItem.id)) {
            setExpandedItems((prev) => new Set([...prev, currentItem.id]));
          }
        }
        return;
      }

      // Left arrow: Collapse
      if (key.leftArrow) {
        const currentItem = flatItems[selectedIndex];
        if (currentItem?.children && currentItem.children.length > 0) {
          if (expandedItems.has(currentItem.id)) {
            setExpandedItems((prev) => {
              const newSet = new Set(prev);
              newSet.delete(currentItem.id);
              return newSet;
            });
          }
        }
        return;
      }

      // Space: Toggle marking
      if (input === " ") {
        const currentItem = flatItems[selectedIndex];
        if (currentItem) {
          setMarkedForDeletion((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(currentItem.id)) {
              newSet.delete(currentItem.id);
            } else {
              newSet.add(currentItem.id);
            }
            return newSet;
          });
        }
        return;
      }

      // c: Clear all marks
      if (input === "c") {
        setMarkedForDeletion(new Set());
        return;
      }
    }

    // REVIEW TAB: Enter mode (down arrow when NOT in mode)
    if (currentTab === "review" && !inReviewMode && key.downArrow) {
      setInReviewMode(true);
      return;
    }

    // REVIEW TAB: Exit mode (up arrow at top when IN mode)
    if (currentTab === "review" && inReviewMode && key.upArrow && reviewSelectedIndex === 0) {
      setInReviewMode(false);
      return;
    }

    // REVIEW TAB: In-mode navigation
    if (currentTab === "review" && inReviewMode) {
      // Up/Down navigation through list (if there are items)
      if (markedItems.length > 0) {
        if (key.upArrow) {
          setReviewSelectedIndex((prev) => Math.max(0, prev - 1));
          return;
        }
        if (key.downArrow) {
          setReviewSelectedIndex((prev) => Math.min(markedItems.length - 1, prev + 1));
          return;
        }
      }

      // Left/Right: Select button
      if (key.leftArrow) {
        setSelectedButton("cancel");
        return;
      }
      if (key.rightArrow) {
        setSelectedButton("confirm");
        return;
      }

      // Enter: Execute button action
      if (key.return) {
        if (selectedButton === "confirm") {
          onProceedToConfirm();
        } else {
          // Cancel button: go back to select tab
          setCurrentTab("select");
          setInReviewMode(false);
          setSelectedButton("cancel");
        }
        return;
      }
    }
  });
}

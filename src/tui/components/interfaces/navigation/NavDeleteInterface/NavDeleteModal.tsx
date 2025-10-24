import { useState, useMemo } from "react";
import { Box, Text } from "ink";
import { ConfirmationDialog } from "@comps/modals/ConfirmationDialog";
import { useTheme } from "@/tui/contexts/ThemeContext";
import { useEscape } from "@/tui/contexts/EscapeContext";
import { useFooterHelp } from "@/tui/contexts/FooterContext";
import { useHeaderData } from "@/tui/contexts/HeaderContext";
import type { NavigationTree, NavigationItem } from "@/types";
import { removeNavigationItem } from "@/commands/navigation";
import { logger } from "@/utils/logger";
import { SelectTab } from "./SelectTab";
import { ReviewTab } from "./ReviewTab";
import { useNavDeleteKeyboard } from "./hooks/useNavDeleteKeyboard";

interface NavDeleteModalProps {
  tree: NavigationTree;
  instance: string;
  onClose: () => void;
  onSuccess: () => void;
  onStatusChange: (message: string) => void;
}

interface FlatNavigationItem extends NavigationItem {
  depth: number;
  isExpanded?: boolean;
}

export function NavDeleteModal({
  tree,
  instance,
  onClose,
  onSuccess,
  onStatusChange,
}: NavDeleteModalProps) {
  const [currentTab, setCurrentTab] = useState<"select" | "review">("select");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [markedForDeletion, setMarkedForDeletion] = useState<Set<string>>(new Set());
  const [reviewSelectedIndex, setReviewSelectedIndex] = useState(0);
  const [selectedButton, setSelectedButton] = useState<"cancel" | "confirm">("cancel");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [inSelectMode, setInSelectMode] = useState(false);
  const [inReviewMode, setInReviewMode] = useState(false);
  const { theme } = useTheme();

  // Flatten navigation tree items (memoized to prevent flashing on navigation)
  const flatItems = useMemo(() => {
    const flattenItems = (
      items: NavigationItem[],
      depth = 0
    ): FlatNavigationItem[] => {
      const result: FlatNavigationItem[] = [];

      for (const item of items) {
        result.push({ ...item, depth, isExpanded: expandedItems.has(item.id) });

        if (
          item.children &&
          item.children.length > 0 &&
          expandedItems.has(item.id)
        ) {
          result.push(...flattenItems(item.children, depth + 1));
        }
      }

      return result;
    };

    return tree?.items ? flattenItems(tree.items) : [];
  }, [tree?.items, expandedItems]);

  const markedItems = useMemo(
    () => flatItems.filter((item) => markedForDeletion.has(item.id)),
    [flatItems, markedForDeletion]
  );

  // Setup escape handling
  useEscape("nav-delete-modal", () => {
    if (showDeleteConfirm) {
      setShowDeleteConfirm(false);
    } else {
      onClose();
    }
  });

  // Use keyboard hook
  useNavDeleteKeyboard({
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
    onProceedToConfirm: () => {
      if (markedItems.length > 0) {
        setShowDeleteConfirm(true);
      }
    },
  });

  // Dynamic footer help text (memoized like PageDetailsModal)
  const footerHelpText = useMemo(() => {
    const baseHelp = "Tab/←→ switch tabs • 1-2 quick jump • Esc close";

    if (currentTab === "select") {
      if (inSelectMode) {
        return `${baseHelp} • ↑↓ navigate • →← expand/collapse • Space mark • c clear`;
      }
      return `${baseHelp} • ↓ enter select mode`;
    } else if (currentTab === "review") {
      if (inReviewMode) {
        return `${baseHelp} • ↑↓ navigate • →← select button • Enter confirm`;
      }
      return `${baseHelp} • ↓ enter review mode`;
    }
    return baseHelp;
  }, [currentTab, inSelectMode, inReviewMode]);

  useFooterHelp(footerHelpText);
  useHeaderData({ title: "Delete Navigation Items", metadata: `(${tree.locale})` });

  const handleDeleteItems = async () => {
    if (markedItems.length === 0) return;

    setIsDeleting(true);
    let successCount = 0;
    let errorCount = 0;

    onStatusChange(`Deleting ${markedItems.length} items...`);

    for (const item of markedItems) {
      try {
        await removeNavigationItem(item.id, { locale: tree.locale, instance });
        successCount++;
      } catch (error) {
        errorCount++;
        logger.error(
          { error, itemId: item.id, label: item.label, locale: tree.locale, instance },
          "Failed to delete navigation item"
        );
      }
    }

    logger.info({ successCount, errorCount, total: markedItems.length }, "Bulk delete completed");

    setIsDeleting(false);
    setShowDeleteConfirm(false);
    setMarkedForDeletion(new Set());

    onStatusChange(
      `Deleted ${successCount} item(s)${errorCount > 0 ? `, ${errorCount} failed` : ""}`
    );

    onSuccess();
    onClose();
  };

  const renderTabContent = () => {
    switch (currentTab) {
      case "select":
        return (
          <SelectTab
            flatItems={flatItems}
            selectedIndex={selectedIndex}
            markedForDeletion={markedForDeletion}
            inSelectMode={inSelectMode}
          />
        );
      case "review":
        return (
          <ReviewTab
            markedItems={markedItems}
            reviewSelectedIndex={reviewSelectedIndex}
            selectedButton={selectedButton}
            inReviewMode={inReviewMode}
          />
        );
      default:
        return null;
    }
  };

  if (showDeleteConfirm) {
    return (
      <ConfirmationDialog
        title="CONFIRM DELETION"
        message={`Delete ${markedItems.length} navigation item(s)?`}
        confirmText="Yes, delete them"
        cancelText="No, cancel"
        items={markedItems.slice(0, 5).map((item) => item.label ?? item.id)}
        onConfirm={() => void handleDeleteItems()}
        onCancel={() => setShowDeleteConfirm(false)}
        destructive={true}
      />
    );
  }

  return (
    <Box
      flexDirection="column"
      flexGrow={1}
    >
      {/* Tab Navigation */}
      <Box
        paddingX={1}
        borderStyle="single"
        borderColor={
          currentTab === "select" ? theme.colors.info : theme.colors.danger
        }
        flexShrink={0}
      >
        <Text
          color={currentTab === "select" ? theme.colors.background : theme.colors.info}
          backgroundColor={currentTab === "select" ? theme.colors.info : undefined}
          bold={currentTab === "select"}
        >
          1. Select Items
        </Text>
        <Text> | </Text>
        <Text
          color={currentTab === "review" ? theme.colors.background : theme.colors.danger}
          backgroundColor={currentTab === "review" ? theme.colors.danger : undefined}
          bold={currentTab === "review"}
        >
          2. Review & Confirm ({markedForDeletion.size})
        </Text>
      </Box>

      {/* Content Area */}
      <Box flexGrow={1} flexDirection="column" overflow="hidden">
        {renderTabContent()}
      </Box>
    </Box>
  );
}

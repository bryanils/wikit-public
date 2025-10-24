import React, { useState, useEffect } from "react";
import { Box, Text, useInput } from "ink";
import { ConfirmationDialog } from "@comps/modals/ConfirmationDialog";
import { getPages } from "@/commands/listPages";
import { type Page } from "@/types";
import { deletePage } from "@/api/pages";
import { logger } from "@/utils/logger";
import { useTheme } from "@/tui/contexts/ThemeContext";
import { useEscape } from "@/tui/contexts/EscapeContext";
import { useHeaderData } from "@/tui/contexts/HeaderContext";
import { useFooterStatus } from "@/tui/contexts/FooterContext";
import { DeletePageSelector } from "./DeletePageSelector.js";
import { MarkedPagesForDeletion } from "./MarkedPagesForDeletion.js";

interface DeleteInterfaceProps {
  instance?: string;
  onEsc?: () => void;
}

export function DeleteInterface({
  instance,
  onEsc,
}: DeleteInterfaceProps) {
  // Setup escape handling
  useEscape("delete", () => {
    onEsc?.();
  });
  const { theme } = useTheme();
  const [pages, setPages] = useState<Page[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [markedForDeletion, setMarkedForDeletion] = useState<Set<string>>(
    new Set()
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmMode, setConfirmMode] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");

  useFooterStatus(statusMsg);
  useHeaderData({
    title: "Delete Pages",
    metadata: `${markedForDeletion.size} marked`
  });

  useEffect(() => {
    void loadPages();
  }, [instance]);

  const loadPages = async () => {
    try {
      setLoading(true);
      setError(null);

      const pages = await getPages("", {
        instance,
        recursive: true,
        limit: 500,
      });

      setPages(pages);
      setSelectedIndex(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load pages");
    } finally {
      setLoading(false);
    }
  };

  const executeDeletes = async () => {
    if (markedForDeletion.size === 0) return;

    setDeleting(true);
    const pagesToDelete = pages.filter((p) => markedForDeletion.has(p.id));
    let successCount = 0;
    let errorCount = 0;

    setStatusMsg(`Deleting ${pagesToDelete.length} pages...`);

    for (const page of pagesToDelete) {
      try {
        const result = await deletePage(page.id, instance);
        if (result.succeeded) {
          successCount++;
        } else {
          errorCount++;
          logger.error({ pageId: page.id, path: page.path, message: result.message, instance }, "Failed to delete page");
        }
      } catch (error) {
        errorCount++;
        logger.error({ err: error, pageId: page.id, path: page.path, instance }, "Error deleting page");
      }
    }

    setDeleting(false);
    setConfirmMode(false);
    void setMarkedForDeletion(new Set());

    setStatusMsg(
      `✅ Deleted ${successCount} pages${
        errorCount > 0 ? `, ❌ ${errorCount} failed` : ""
      }`
    );

    // Reload pages
    await loadPages();
  };

  useInput((input, key) => {
    if (loading || deleting || confirmMode) return;

    if (key.upArrow) {
      setSelectedIndex((prev) => Math.max(0, prev - 1));
    } else if (key.downArrow) {
      setSelectedIndex((prev) => Math.min(pages.length - 1, prev + 1));
    } else if (input === " ") {
      // Toggle marking for deletion
      const currentPage = pages[selectedIndex];
      if (currentPage) {
        setMarkedForDeletion((prev) => {
          const newSet = new Set(prev);
          if (newSet.has(currentPage.id)) {
            newSet.delete(currentPage.id);
          } else {
            newSet.add(currentPage.id);
          }
          return newSet;
        });
      }
    } else if (key.return && markedForDeletion.size > 0) {
      setConfirmMode(true);
    } else if (input === "c") {
      // Clear all marked pages
      setMarkedForDeletion(new Set());
    }
  });

  if (loading) {
    return (
      <Box>
        <Text color={theme.colors.warning}>Loading pages...</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Text color={theme.colors.error}>Error: {error}</Text>
      </Box>
    );
  }

  if (confirmMode) {
    const pagesToDelete = pages.filter((p) => markedForDeletion.has(p.id));
    return (
      <ConfirmationDialog
        title="⚠️ CONFIRM DELETION"
        message={`Are you sure you want to delete ${pagesToDelete.length} page(s)?`}
        confirmText="Yes, delete them"
        cancelText="No, cancel"
        items={pagesToDelete.map((page) => `• ${page.path} - ${page.title}`)}
        onConfirm={() => void executeDeletes()}
        onCancel={() => setConfirmMode(false)}
        destructive={true}
      />
    );
  }

  const markedPages = pages.filter((p) => markedForDeletion.has(p.id));

  return (
    <Box flexDirection="row" flexGrow={1}>
      <DeletePageSelector
        pages={pages}
        selectedIndex={selectedIndex}
        markedForDeletion={markedForDeletion}
      />

      <MarkedPagesForDeletion
        markedPages={markedPages}
        markedForDeletionSize={markedForDeletion.size}
      />
    </Box>
  );
}

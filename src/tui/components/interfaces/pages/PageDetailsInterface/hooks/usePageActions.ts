import { copyToClipboard } from "@/utils/clipboard";
import { deletePage } from "@/api/pages";
import type { Page } from "@/types";

interface UsePageActionsProps {
  page: Page;
  instance?: string;
  onClose: () => void;
  setCopyStatus: (status: string) => void;
  loadPageDetails: () => Promise<void>;
}

export function usePageActions({
  page,
  instance,
  onClose,
  setCopyStatus,
  loadPageDetails,
}: UsePageActionsProps) {
  const handleCopyPath = async (pathOverride?: string) => {
    try {
      const pathToCopy = pathOverride ?? page.path;
      copyToClipboard(pathToCopy);
      setCopyStatus(`Copied to clipboard: ${pathToCopy}`);
      setTimeout(() => setCopyStatus(""), 3000);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      setCopyStatus(`Failed to copy: ${errorMsg}`);
      setTimeout(() => setCopyStatus(""), 3000);
    }
  };

  const handleDelete = async () => {
    try {
      const result = await deletePage(page.id, instance);

      if (result.succeeded) {
        onClose();
      }
    } catch (error) {
      // Error handling can be done in the component if needed
    }
  };

  const handleMove = async (destinationPath: string, locale: string) => {
    try {
      const { movePage } = await import("@/api/pages");
      const result = await movePage(parseInt(page.id), destinationPath, locale, instance);

      if (result.succeeded) {
        onClose();
      }
    } catch (error) {
      // Error handling can be done in the component if needed
    }
  };

  const handleConvert = async (editor: string) => {
    try {
      const { convertPage } = await import("@/api/pages");
      const result = await convertPage(parseInt(page.id), editor, instance);

      if (result.succeeded) {
        await loadPageDetails();
      }
    } catch (error) {
      // Error handling can be done in the component if needed
    }
  };

  const handleRender = async () => {
    try {
      const { renderPage } = await import("@/api/pages");
      const result = await renderPage(parseInt(page.id), instance);

      if (result.succeeded) {
        await loadPageDetails();
      }
    } catch (error) {
      // Error handling can be done in the component if needed
    }
  };

  return {
    handleCopyPath,
    handleDelete,
    handleMove,
    handleConvert,
    handleRender,
  };
}

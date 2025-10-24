import * as pageApi from "@/api/pages";
import { getAllPages } from "@/api/pages";
import type { PageExportData } from "@/types";
import { logger } from "@/utils/logger";

export async function exportPagesCommand(
  filePath: string,
  options: { instance?: string }
) {
  console.log(`Exporting pages to ${filePath}...`);

  try {
    const pages = await getAllPages(options.instance);

    const exportData: PageExportData = {
      pages,
      exportedAt: new Date().toISOString(),
      instanceId: options.instance,
      summary: {
        totalPages: pages.length,
        publishedPages: pages.filter((p) => p.isPublished).length,
        unpublishedPages: pages.filter((p) => !p.isPublished).length,
      },
    };

    await import("fs/promises").then((fs) =>
      fs.writeFile(filePath, JSON.stringify(exportData, null, 2))
    );

    console.log(`✅ Successfully exported ${pages.length} pages to ${filePath}`);
  } catch (error) {
    console.error(
      `Failed to export pages: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
    process.exit(1);
  }
}

export async function exportPages(
  filePath: string,
  options: { instance?: string; onProgress?: (msg: string) => void }
): Promise<{ success: boolean; message: string; pageCount?: number }> {
  try {
    options.onProgress?.("Loading pages...");
    logger.info({ filePath, instance: options.instance }, "Exporting pages");

    const pages = await getAllPages(options.instance);

    options.onProgress?.(`Exporting ${pages.length} pages...`);

    const exportData: PageExportData = {
      pages,
      exportedAt: new Date().toISOString(),
      instanceId: options.instance,
      summary: {
        totalPages: pages.length,
        publishedPages: pages.filter((p) => p.isPublished).length,
        unpublishedPages: pages.filter((p) => !p.isPublished).length,
      },
    };

    await import("fs/promises").then((fs) =>
      fs.writeFile(filePath, JSON.stringify(exportData, null, 2))
    );

    logger.info({ pageCount: pages.length, filePath }, "Pages exported successfully");

    return {
      success: true,
      message: `Successfully exported ${pages.length} pages to ${filePath}`,
      pageCount: pages.length,
    };
  } catch (error) {
    logger.error({ error, filePath }, "Failed to export pages");
    return {
      success: false,
      message: `Failed to export pages: ${
        error instanceof Error ? error.message : String(error)
      }`,
    };
  }
}

export async function movePageCommand(
  id: number,
  destinationPath: string,
  options: { locale?: string; instance?: string }
) {
  console.log(`Moving page ${id} to ${destinationPath}${options.locale ? ` (${options.locale})` : ""}...`);

  const result = await pageApi.movePage(
    id,
    destinationPath,
    options.locale ?? "en",
    options.instance
  );

  if (result.succeeded) {
    console.log(`Page ${id} moved successfully to ${destinationPath}`);
  } else {
    console.error(`Failed to move page: ${result.message}`);
    process.exit(1);
  }
}

export async function convertPageCommand(
  id: number,
  editor: string,
  options: { instance?: string }
) {
  console.log(`Converting page ${id} to ${editor} editor...`);

  const result = await pageApi.convertPage(id, editor, options.instance);

  if (result.succeeded) {
    console.log(`Page ${id} converted successfully to ${editor}`);
  } else {
    console.error(`Failed to convert page: ${result.message}`);
    process.exit(1);
  }
}

export async function renderPageCommand(
  id: number,
  options: { instance?: string }
) {
  console.log(`Rendering page ${id}...`);

  const result = await pageApi.renderPage(id, options.instance);

  if (result.succeeded) {
    console.log(`Page ${id} rendered successfully`);
  } else {
    console.error(`Failed to render page: ${result.message}`);
    process.exit(1);
  }
}

export async function migrateLocaleCommand(
  sourceLocale: string,
  targetLocale: string,
  options: { instance?: string }
) {
  console.log(`Migrating pages from ${sourceLocale} to ${targetLocale}...`);

  const result = await pageApi.migrateLocale(
    sourceLocale,
    targetLocale,
    options.instance
  );

  if (result.responseResult.succeeded) {
    console.log(
      `Successfully migrated ${result.count ?? 0} page(s) from ${sourceLocale} to ${targetLocale}`
    );
  } else {
    console.error(`Failed to migrate locale: ${result.responseResult.message}`);
    process.exit(1);
  }
}

export async function rebuildTreeCommand(options: { instance?: string }) {
  console.log("Rebuilding page tree...");

  const result = await pageApi.rebuildTree(options.instance);

  if (result.succeeded) {
    console.log("Page tree rebuilt successfully");
  } else {
    console.error(`Failed to rebuild tree: ${result.message}`);
    process.exit(1);
  }
}

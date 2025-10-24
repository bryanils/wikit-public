import type { Command } from "commander";
import { listPages } from "@/commands/listPages";
import { deletePages } from "@/commands/deletePages";
import {
  exportPagesCommand,
  movePageCommand,
  convertPageCommand,
  renderPageCommand,
  migrateLocaleCommand,
  rebuildTreeCommand,
} from "@/commands/pages";
import type { GlobalOptions, ListOptions, DeleteOptions } from "@/types";

export function register(program: Command) {
  const pagesCommand = program
    .command("pages")
    .description("Page operations");

  pagesCommand
    .command("list")
    .description("List pages under a prefix")
    .argument("[prefix]", "Path prefix (e.g. /en/tls) - optional if using --search")
    .option("-l, --limit <number>", "Limit number of results (0 = all)", "0")
    .option("--all", "Show all pages if no matches found")
    .option(
      "-r, --recursive",
      "Include nested pages (default: only direct children)"
    )
    .option("-s, --search <query>", "Search pages by title or path")
    .action(async (prefix: string | undefined, options: ListOptions & { search?: string }) => {
      const globalOptions = program.opts<GlobalOptions>();
      await listPages(prefix ?? "", {
        instance: globalOptions.instance,
        limit: parseInt(options.limit),
        showAll: Boolean(options.all),
        recursive: Boolean(options.recursive),
        search: options.search,
      });
    });

  pagesCommand
    .command("delete")
    .description("Delete pages under a prefix")
    .argument("<prefix>", "Path prefix (e.g. /en/tls)")
    .option("-f, --force", "Skip confirm prompt")
    .action(async (prefix: string, options: DeleteOptions) => {
      const globalOptions = program.opts<GlobalOptions>();
      await deletePages(prefix, { ...options, instance: globalOptions.instance });
    });

  pagesCommand
    .command("move")
    .description("Move page to different path/locale")
    .argument("<id>", "Page ID")
    .argument("<destination>", "Destination path")
    .option("-l, --locale <locale>", "Destination locale", "en")
    .action(async (id: string, destination: string, options: { locale?: string }) => {
      const globalOptions = program.opts<GlobalOptions>();
      await movePageCommand(parseInt(id), destination, {
        locale: options.locale,
        instance: globalOptions.instance,
      });
    });

  pagesCommand
    .command("convert")
    .description("Convert page to different editor")
    .argument("<id>", "Page ID")
    .argument("<editor>", "Editor type (markdown, wysiwyg, etc.)")
    .action(async (id: string, editor: string) => {
      const globalOptions = program.opts<GlobalOptions>();
      await convertPageCommand(parseInt(id), editor, {
        instance: globalOptions.instance,
      });
    });

  pagesCommand
    .command("render")
    .description("Force re-render of page")
    .argument("<id>", "Page ID")
    .action(async (id: string) => {
      const globalOptions = program.opts<GlobalOptions>();
      await renderPageCommand(parseInt(id), {
        instance: globalOptions.instance,
      });
    });

  pagesCommand
    .command("migrate-locale")
    .description("Bulk migrate pages between locales")
    .argument("<source>", "Source locale")
    .argument("<target>", "Target locale")
    .action(async (source: string, target: string) => {
      const globalOptions = program.opts<GlobalOptions>();
      await migrateLocaleCommand(source, target, {
        instance: globalOptions.instance,
      });
    });

  pagesCommand
    .command("rebuild-tree")
    .description("Rebuild navigation tree")
    .action(async () => {
      const globalOptions = program.opts<GlobalOptions>();
      await rebuildTreeCommand({
        instance: globalOptions.instance,
      });
    });

  pagesCommand
    .command("export")
    .description("Export all pages to JSON file")
    .argument("<file>", "Output file path")
    .action(async (file: string) => {
      const globalOptions = program.opts<GlobalOptions>();
      await exportPagesCommand(file, {
        instance: globalOptions.instance,
      });
    });
}

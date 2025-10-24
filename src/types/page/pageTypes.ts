export interface Page {
  id: string;
  path: string;
  title: string;
  locale: string;
  isPublished: boolean;
}

export interface PageSummary {
  totalPages: number;
  publishedPages: number;
  pagesByLocale: Record<string, number>;
  topLevelPaths: string[];
  [key: string]: unknown;
}

export interface PageExportData {
  pages: Page[];
  exportedAt: string;
  instanceId?: string;
  summary: {
    totalPages: number;
    publishedPages: number;
    unpublishedPages: number;
  };
}

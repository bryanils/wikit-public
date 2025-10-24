import { graphql } from "@/api";
import { type Page } from "@/types";

export async function getAllPages(instance?: string): Promise<Page[]> {
  const query = `query {
    pages {
      list(limit: 500, orderBy: PATH) {
        id
        path
        title
        isPublished
        locale
      }
    }
  }`;

  const result = await graphql<{ pages: { list: Page[] } }>(
    query,
    undefined,
    instance
  );
  return result.pages.list;
}

export async function deletePage(pageId: string, instance?: string) {
  const mutation = `mutation ($id: Int!) {
    pages {
      delete(id: $id) {
        responseResult {
          succeeded
          errorCode
          message
        }
      }
    }
  }`;

  const result = await graphql<{
    pages: {
      delete: {
        responseResult: {
          succeeded: boolean;
          errorCode: number;
          message?: string;
        };
      };
    };
  }>(mutation, { id: parseInt(pageId) }, instance);

  return result.pages.delete.responseResult;
}

export async function getPageContent(path: string, instance?: string, locale = "en") {
  const query = `query ($path: String!, $locale: String!) {
    pages {
      singleByPath(path: $path, locale: $locale) {
        id
        path
        title
        content
        contentType
        description
        isPublished
        isPrivate
        locale
        tags {
          id
          title
        }
        editor
        createdAt
        updatedAt
        hash
      }
    }
  }`;

  const result = await graphql<{
    pages: {
      singleByPath: {
        id: string;
        path: string;
        title: string;
        content: string;
        contentType: string;
        description?: string;
        isPublished: boolean;
        isPrivate: boolean;
        locale: string;
        tags?: { id: string; title: string }[];
        editor: string;
        createdAt?: string;
        updatedAt?: string;
        hash?: string;
      } | null;
    };
  }>(query, { path, locale }, instance);

  return result.pages.singleByPath;
}

export async function createPage(
  pageData: {
    path: string;
    title: string;
    content: string;
    description?: string;
    editor?: string;
    locale?: string;
    isPublished?: boolean;
    isPrivate?: boolean;
    tags?: string[];
  },
  instance?: string
) {
  const mutation = `mutation ($content: String!, $description: String!, $editor: String!, $isPublished: Boolean!, $isPrivate: Boolean!, $locale: String!, $path: String!, $tags: [String]!, $title: String!) {
    pages {
      create(
        content: $content
        description: $description
        editor: $editor
        isPublished: $isPublished
        isPrivate: $isPrivate
        locale: $locale
        path: $path
        tags: $tags
        title: $title
      ) {
        responseResult {
          succeeded
          errorCode
          message
        }
        page {
          id
          path
          title
        }
      }
    }
  }`;

  const variables = {
    content: pageData.content,
    description: pageData.description ?? "",
    editor: pageData.editor ?? "markdown",
    isPublished: pageData.isPublished ?? true,
    isPrivate: pageData.isPrivate ?? false,
    locale: pageData.locale ?? "en",
    path: pageData.path,
    tags: pageData.tags ?? [],
    title: pageData.title,
  };

  const result = await graphql<{
    pages: {
      create: {
        responseResult: {
          succeeded: boolean;
          errorCode: number;
          message?: string;
        };
        page?: {
          id: string;
          path: string;
          title: string;
        };
      };
    };
  }>(mutation, variables, instance);

  return result.pages.create;
}

export async function movePage(
  id: number,
  destinationPath: string,
  destinationLocale: string,
  instance?: string
) {
  const mutation = `mutation ($id: Int!, $destinationPath: String!, $destinationLocale: String!) {
    pages {
      move(id: $id, destinationPath: $destinationPath, destinationLocale: $destinationLocale) {
        responseResult {
          succeeded
          errorCode
          message
        }
      }
    }
  }`;

  const result = await graphql<{
    pages: {
      move: {
        responseResult: {
          succeeded: boolean;
          errorCode: number;
          message?: string;
        };
      };
    };
  }>(mutation, { id, destinationPath, destinationLocale }, instance);

  return result.pages.move.responseResult;
}

export async function convertPage(
  id: number,
  editor: string,
  instance?: string
) {
  const mutation = `mutation ($id: Int!, $editor: String!) {
    pages {
      convert(id: $id, editor: $editor) {
        responseResult {
          succeeded
          errorCode
          message
        }
      }
    }
  }`;

  const result = await graphql<{
    pages: {
      convert: {
        responseResult: {
          succeeded: boolean;
          errorCode: number;
          message?: string;
        };
      };
    };
  }>(mutation, { id, editor }, instance);

  return result.pages.convert.responseResult;
}

export async function renderPage(id: number, instance?: string) {
  const mutation = `mutation ($id: Int!) {
    pages {
      render(id: $id) {
        responseResult {
          succeeded
          errorCode
          message
        }
      }
    }
  }`;

  const result = await graphql<{
    pages: {
      render: {
        responseResult: {
          succeeded: boolean;
          errorCode: number;
          message?: string;
        };
      };
    };
  }>(mutation, { id }, instance);

  return result.pages.render.responseResult;
}

export async function migrateLocale(
  sourceLocale: string,
  targetLocale: string,
  instance?: string
) {
  const mutation = `mutation ($sourceLocale: String!, $targetLocale: String!) {
    pages {
      migrateToLocale(sourceLocale: $sourceLocale, targetLocale: $targetLocale) {
        responseResult {
          succeeded
          errorCode
          message
        }
        count
      }
    }
  }`;

  const result = await graphql<{
    pages: {
      migrateToLocale: {
        responseResult: {
          succeeded: boolean;
          errorCode: number;
          message?: string;
        };
        count?: number;
      };
    };
  }>(mutation, { sourceLocale, targetLocale }, instance);

  return result.pages.migrateToLocale;
}

export async function rebuildTree(instance?: string) {
  const mutation = `mutation {
    pages {
      rebuildTree {
        responseResult {
          succeeded
          errorCode
          message
        }
      }
    }
  }`;

  const result = await graphql<{
    pages: {
      rebuildTree: {
        responseResult: {
          succeeded: boolean;
          errorCode: number;
          message?: string;
        };
      };
    };
  }>(mutation, undefined, instance);

  return result.pages.rebuildTree.responseResult;
}

import { getDynamicConfig } from "@/config/dynamicConfig";
import type { PageLinkItem } from "@/types/analysis/analysisTypes";
import type { Page } from "@/types/page/pageTypes";

interface GraphQLError {
  message: string;
}

interface GraphQLResponse<T> {
  data: T;
  errors?: GraphQLError[];
}

export async function graphql<TData, TVars = Record<string, unknown>>(
  query: string,
  variables?: TVars,
  instance?: string
): Promise<TData> {
  const config = await getDynamicConfig(instance);
  const res = await fetch(config.url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.key}`,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!res.ok) {
    throw new Error(`GraphQL error ${res.status}: ${await res.text()}`);
  }

  // 👇 Cast result into GraphQLResponse<T>
  const json = (await res.json()) as GraphQLResponse<TData>;

  if (json.errors?.length) {
    throw new Error(
      `GraphQL errors:\n${json.errors.map((e) => e.message).join("\n")}`
    );
  }

  return json.data;
}

export async function getPageLinks(instance?: string): Promise<PageLinkItem[]> {
  const query = `
    query {
      pages {
        links(locale: "en") {
          id
          path
          title
          links
        }
      }
    }
  `;

  const data = await graphql<{ pages: { links: PageLinkItem[] } }>(query, {}, instance);
  return data.pages.links;
}

export async function getAllPages(instance?: string): Promise<Page[]> {
  const query = `
    query {
      pages {
        list {
          id
          path
          title
          isPublished
          isPrivate
          locale
          contentType
          createdAt
          updatedAt
        }
      }
    }
  `;

  const data = await graphql<{ pages: { list: Page[] } }>(query, {}, instance);
  return data.pages.list;
}

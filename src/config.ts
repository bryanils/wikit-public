import "dotenv/config";
import { logger } from "@/utils/logger";

interface WikiConfig {
  url: string;
  key: string;
}

const configs: Record<string, WikiConfig> = {
  rmwiki: {
    url: process.env.WIKIJS_API_URL!,
    key: process.env.WIKIJS_API_KEY!,
  },
  tlwiki: {
    url: process.env.TLWIKI_API_URL!,
    key: process.env.TLWIKI_API_KEY!,
  },
};

export const instanceLabels: Record<string, string> = {
  rmwiki: "RM Wiki",
  tlwiki: "TL Wiki",
};

export function getConfig(instance = "rmwiki"): WikiConfig {
  const config = configs[instance];
  if (!config) {
    logger.error({ instance, available: Object.keys(configs) }, "Unknown instance");
    process.exit(1);
  }

  if (!config.url || !config.key) {
    logger.error({ instance }, "Missing API_URL or API_KEY for instance");
    process.exit(1);
  }

  return config;
}

export function getAllInstanceNames(): string[] {
  return Object.keys(configs);
}

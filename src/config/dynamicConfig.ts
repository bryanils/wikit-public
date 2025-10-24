import "dotenv/config";
import { configManager, type IConfigManager } from "@/config/configManager";
import { logger } from "@/utils/logger";

interface WikiConfig {
  url: string;
  key: string;
}

// Legacy .env-based configs for backwards compatibility
const legacyConfigs: Record<string, WikiConfig> = {
  rmwiki: {
    url: process.env.WIKIJS_API_URL ?? "",
    key: process.env.WIKIJS_API_KEY ?? "",
  },
  tlwiki: {
    url: process.env.TLWIKI_API_URL ?? "",
    key: process.env.TLWIKI_API_KEY ?? "",
  },
};

// Initialize config manager
let configInitialized = false;

async function ensureConfigInitialized(): Promise<void> {
  if (configInitialized) return;

  try {
    await configManager.initialize();
    configInitialized = true;
  } catch (error) {
    logger.error({ err: error }, "Failed to initialize config manager");
  }
}

export async function getDynamicConfig(instance?: string): Promise<WikiConfig> {
  // If no instance specified, try to use the default from environment
  if (!instance) {
    instance = process.env.WIKIJS_DEFAULT_INSTANCE;
    // If still no instance, use the first available one
    if (!instance) {
      const availableInstances = await getAvailableInstances();
      if (availableInstances.length > 0) {
        instance = availableInstances[0];
        logger.debug({ instance, availableInstances }, "Auto-selected instance");
      } else {
        logger.error("No instances configured");
        process.exit(1);
      }
    }
  }
  await ensureConfigInitialized();

  // At this point, instance is guaranteed to be defined
  const instanceId = instance as string;

  // Try to get from encrypted config first
  try {
    const configInstance = await configManager.getInstance(instanceId);
    if (configInstance) {
      return {
        url: configInstance.url,
        key: configInstance.key
      };
    }
  } catch {
    // Fallback to legacy config
  }

  // Fallback to legacy .env config
  const legacyConfig = legacyConfigs[instanceId];
  if (legacyConfig && legacyConfig.url && legacyConfig.key) {
    return legacyConfig;
  }

  // No valid config found
  const availableInstances = await getAvailableInstances();
  if (availableInstances.length === 0) {
    logger.error("No instances configured");
    process.exit(1);
  }

  logger.error({ instanceId, availableInstances }, "Unknown or unconfigured instance");
  process.exit(1);
}

export async function getAvailableInstances(): Promise<string[]> {
  await ensureConfigInitialized();

  const encryptedInstances = configManager.getInstanceIds();

  // For backwards compatibility with existing users, only include legacy
  // instances if there are no encrypted instances configured
  if (encryptedInstances.length > 0) {
    return encryptedInstances;
  }

  const legacyInstances = Object.keys(legacyConfigs).filter(
    id => {
      const config = legacyConfigs[id];
      return config && config.url && config.key;
    }
  );

  return legacyInstances;
}

export async function getInstanceLabels(): Promise<Record<string, string>> {
  await ensureConfigInitialized();

  const labels: Record<string, string> = {};

  // Add encrypted config instances
  for (const instanceId of configManager.getInstanceIds()) {
    const info = configManager.getInstanceInfo(instanceId);
    if (info) {
      labels[instanceId] = info.name;
    }
  }

  // Add legacy instances with default labels
  const legacyLabels: Record<string, string> = {
    rmwiki: "RM Wiki",
    tlwiki: "TL Wiki",
  };

  for (const [id, config] of Object.entries(legacyConfigs)) {
    if (config.url && config.key && !labels[id]) {
      labels[id] = legacyLabels[id] ?? id;
    }
  }

  return labels;
}

export function getConfigManager(): IConfigManager {
  return configManager;
}

export async function hasAnyInstances(): Promise<boolean> {
  await ensureConfigInitialized();
  const instances = await getAvailableInstances();
  return instances.length > 0;
}

export async function needsSetup(): Promise<boolean> {
  await ensureConfigInitialized();

  // Only check for encrypted config - ignore legacy for setup purposes
  const hasEncrypted = configManager.getInstanceIds().length > 0;

  // Need setup if we have no encrypted configurations
  return !hasEncrypted;
}

export async function getDefaultTheme(): Promise<string | null> {
  await ensureConfigInitialized();
  return configManager.getDefaultTheme();
}

export async function setDefaultTheme(theme: string): Promise<void> {
  await ensureConfigInitialized();
  configManager.setDefaultTheme(theme);
}
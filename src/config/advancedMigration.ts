import "dotenv/config";
import { getConfigManager } from "./dynamicConfig";
import type { WikiInstance } from "./configManager";

export interface ConfigStatus {
  hasEncryptedConfig: boolean;
  hasEnvConfig: boolean;
  encryptedInstances: Array<{ id: string; name: string; url: string }>;
  envInstances: Array<{ id: string; name: string; url: string }>;
  configPath: string;
}

export async function getConfigStatus(): Promise<ConfigStatus> {
  const configManager = getConfigManager();
  await configManager.initialize();

  const envInstances = getEnvInstances();
  const encryptedInstances = configManager.getAllInstances();

  return {
    hasEncryptedConfig: encryptedInstances.length > 0,
    hasEnvConfig: envInstances.length > 0,
    encryptedInstances,
    envInstances,
    configPath: configManager.getConfigPath(),
  };
}

export async function migrateToEncrypted(options: { overwrite?: boolean } = {}): Promise<{ migrated: number; skipped: number; errors: number }> {
  const configManager = getConfigManager();
  await configManager.initialize();

  const envInstances = getEnvInstances();

  if (envInstances.length === 0) {
    throw new Error("No .env configuration found to migrate");
  }

  let migrated = 0;
  let skipped = 0;
  let errors = 0;

  for (const instance of envInstances) {
    try {
      const existingInfo = configManager.getInstanceInfo(instance.id);

      if (existingInfo && !options.overwrite) {
        skipped++;
        continue;
      }

      if (existingInfo && options.overwrite) {
        await configManager.updateInstance(instance.id, instance);
      } else {
        await configManager.addInstance(instance);
      }

      migrated++;
    } catch {
      errors++;
    }
  }

  return { migrated, skipped, errors };
}

export async function resetEncryptedConfig(): Promise<void> {
  const configManager = getConfigManager();
  await configManager.resetConfig();
}

export async function generateEnvFromEncrypted(): Promise<string[]> {
  const configManager = getConfigManager();
  await configManager.initialize();

  const instanceIds = configManager.getInstanceIds();

  if (instanceIds.length === 0) {
    throw new Error("No encrypted instances found to export");
  }

  const envLines: string[] = [];
  envLines.push("# Generated from encrypted Wiki.js configuration");
  envLines.push("# Copy these lines to your .env file");
  envLines.push("");

  for (const instanceId of instanceIds) {
    try {
      const instance = await configManager.getInstance(instanceId);
      if (!instance) continue;

      const envVarPrefix = getEnvVarPrefix(instanceId);

      envLines.push(`# ${instance.name}`);
      envLines.push(`${envVarPrefix}_API_URL=${instance.url}`);
      envLines.push(`${envVarPrefix}_API_KEY=${instance.key}`);
      envLines.push("");

    } catch (error) {
      envLines.push(`# Error exporting ${instanceId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      envLines.push("");
    }
  }

  return envLines;
}

export function getEnvInstances(): WikiInstance[] {
  const instances: WikiInstance[] = [];

  // Check for rmwiki instance
  if (process.env.WIKIJS_API_URL && process.env.WIKIJS_API_KEY) {
    instances.push({
      id: "rmwiki",
      name: "RM Wiki",
      url: process.env.WIKIJS_API_URL,
      key: process.env.WIKIJS_API_KEY,
    });
  }

  // Check for tlwiki instance
  if (process.env.TLWIKI_API_URL && process.env.TLWIKI_API_KEY) {
    instances.push({
      id: "tlwiki",
      name: "TL Wiki",
      url: process.env.TLWIKI_API_URL,
      key: process.env.TLWIKI_API_KEY,
    });
  }

  // Check for other common patterns
  // This could be expanded to detect more env var patterns

  return instances;
}

function getEnvVarPrefix(instanceId: string): string {
  // Map instance IDs to env var prefixes
  const prefixMap: Record<string, string> = {
    "rmwiki": "WIKIJS",
    "tlwiki": "TLWIKI",
  };

  return prefixMap[instanceId] ?? instanceId.toUpperCase();
}

export interface MigrationSummary {
  action: string;
  source: "env" | "encrypted";
  target: "env" | "encrypted";
  instances: Array<{ id: string; name: string; status: "success" | "skipped" | "error"; message?: string }>;
  configPath?: string;
}

export async function previewMigration(direction: "to-encrypted" | "to-env"): Promise<MigrationSummary> {
  const status = await getConfigStatus();

  if (direction === "to-encrypted") {
    const instances = status.envInstances.map(env => {
      const existing = status.encryptedInstances.find(enc => enc.id === env.id);
      return {
        id: env.id,
        name: env.name,
        status: existing ? "skipped" as const : "success" as const,
        message: existing ? "Already exists in encrypted config" : undefined,
      };
    });

    return {
      action: "Migrate to encrypted configuration",
      source: "env",
      target: "encrypted",
      instances,
      configPath: status.configPath,
    };
  } else {
    const instances = status.encryptedInstances.map(enc => ({
      id: enc.id,
      name: enc.name,
      status: "success" as const,
    }));

    return {
      action: "Generate .env configuration",
      source: "encrypted",
      target: "env",
      instances,
    };
  }
}
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const workspaceRoot = path.resolve(appRoot, '..', '..');

function normalizeConfiguredDir(configuredDir: string): string {
  return configuredDir
    .replace(/\\/g, '/')
    .replace(/^\.\/+/, '');
}

export function resolveStorageDir(configuredDir: string): string {
  if (path.isAbsolute(configuredDir)) {
    return configuredDir;
  }

  const normalized = normalizeConfiguredDir(configuredDir);
  if (normalized === 'apps/api' || normalized.startsWith('apps/api/')) {
    return path.resolve(workspaceRoot, normalized);
  }

  return path.resolve(appRoot, normalized);
}

export function resolveLegacyStorageDir(configuredDir: string): string | undefined {
  if (path.isAbsolute(configuredDir)) {
    return undefined;
  }

  const normalized = normalizeConfiguredDir(configuredDir);
  if (normalized === 'apps/api' || normalized.startsWith('apps/api/')) {
    return path.resolve(appRoot, normalized);
  }

  return undefined;
}

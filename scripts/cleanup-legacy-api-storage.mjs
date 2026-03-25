import { access, cp, mkdir, readdir, rm } from 'node:fs/promises';
import path from 'node:path';

const dryRun = process.argv.includes('--dry-run');
const workspaceRoot = process.cwd();
const apiRoot = path.join(workspaceRoot, 'apps', 'api');
const legacyBase = path.join(apiRoot, 'apps', 'api');
const legacyTargets = [
  path.join(legacyBase, 'data'),
  path.join(legacyBase, 'uploads'),
];
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupRoot = path.join(apiRoot, 'legacy-backup', timestamp);

async function exists(targetPath) {
  try {
    await access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function hasEntries(targetPath) {
  const entries = await readdir(targetPath);
  return entries.length > 0;
}

async function copyWithBackup(sourcePath, destinationPath) {
  await mkdir(path.dirname(destinationPath), { recursive: true });
  await cp(sourcePath, destinationPath, {
    recursive: true,
    force: true,
    errorOnExist: false,
  });
}

async function removeIfEmpty(targetPath) {
  if (!(await exists(targetPath))) {
    return;
  }

  const entries = await readdir(targetPath);
  if (entries.length > 0) {
    return;
  }

  await rm(targetPath, { recursive: false, force: true });
}

async function main() {
  const failures = [];
  let backupUsed = false;
  const modeLabel = dryRun ? 'DRY-RUN' : 'APPLY';

  console.log(`[cleanup-legacy-api-storage] mode=${modeLabel}`);

  for (const legacyTarget of legacyTargets) {
    const relativeLegacyTarget = path.relative(workspaceRoot, legacyTarget);
    if (!(await exists(legacyTarget))) {
      console.log(`- skip missing: ${relativeLegacyTarget}`);
      continue;
    }

    try {
      if (await hasEntries(legacyTarget)) {
        const backupTarget = path.join(backupRoot, relativeLegacyTarget);
        if (dryRun) {
          console.log(
            `- would backup: ${relativeLegacyTarget} -> ${path.relative(workspaceRoot, backupTarget)}`,
          );
        } else {
          await copyWithBackup(legacyTarget, backupTarget);
          backupUsed = true;
          console.log(
            `- backup done: ${relativeLegacyTarget} -> ${path.relative(workspaceRoot, backupTarget)}`,
          );
        }
      }

      if (dryRun) {
        console.log(`- would remove: ${relativeLegacyTarget}`);
      } else {
        await rm(legacyTarget, { recursive: true, force: true });
        console.log(`- removed: ${relativeLegacyTarget}`);
      }
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      failures.push(`${relativeLegacyTarget}: ${reason}`);
      console.error(`- failed: ${relativeLegacyTarget} (${reason})`);
    }
  }

  if (!dryRun) {
    const pruneTargets = [legacyBase, path.join(apiRoot, 'apps')];
    for (const pruneTarget of pruneTargets) {
      try {
        await removeIfEmpty(pruneTarget);
      } catch (error) {
        const reason = error instanceof Error ? error.message : String(error);
        failures.push(`${path.relative(workspaceRoot, pruneTarget)}: ${reason}`);
      }
    }
  }

  if (dryRun) {
    console.log('[cleanup-legacy-api-storage] dry-run complete');
    return;
  }

  if (backupUsed) {
    console.log(
      `[cleanup-legacy-api-storage] backup saved at ${path.relative(workspaceRoot, backupRoot)}`,
    );
  } else {
    console.log('[cleanup-legacy-api-storage] no backup required');
  }

  if (failures.length > 0) {
    console.error('[cleanup-legacy-api-storage] completed with failures:');
    for (const failure of failures) {
      console.error(`  * ${failure}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log('[cleanup-legacy-api-storage] completed successfully');
}

await main();

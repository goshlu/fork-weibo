import assert from 'node:assert/strict';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { buildApp } from './app.js';
import { env } from './config/env.js';
import { resolveLegacyStorageDir, resolveStorageDir } from './utils/storage-paths.js';

const uploadRoot = resolveStorageDir(env.UPLOAD_DIR);
const legacyUploadRoot = resolveLegacyStorageDir(env.UPLOAD_DIR);

async function removeBestEffort(targetPath: string, recursive = false): Promise<void> {
  try {
    await rm(targetPath, { recursive, force: true });
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException;
    if (nodeError.code === 'EPERM') {
      return;
    }
    throw error;
  }
}

async function verifyStaticServingFromUploadRoot(): Promise<void> {
  const relativePath = `__test-static-${Date.now()}.txt`;
  const absolutePath = path.join(uploadRoot, relativePath);
  const content = `static-ok-${Date.now()}`;

  await mkdir(path.dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, content, 'utf8');

  const app = await buildApp();

  try {
    const response = await app.inject({
      method: 'GET',
      url: `/uploads/${relativePath}`,
    });

    assert.equal(response.statusCode, 200);
    assert.equal(response.body, content);
  } finally {
    await app.close();
    await removeBestEffort(absolutePath);
  }
}

async function verifyLegacyUploadMigration(): Promise<void> {
  if (!legacyUploadRoot) {
    return;
  }

  const folder = `__test-migration-${Date.now()}`;
  const fileName = 'legacy.txt';
  const relativePath = `${folder}/${fileName}`;
  const legacyAbsolutePath = path.join(legacyUploadRoot, folder, fileName);
  const currentAbsolutePath = path.join(uploadRoot, folder, fileName);
  const content = `legacy-ok-${Date.now()}`;

  await mkdir(path.dirname(legacyAbsolutePath), { recursive: true });
  await writeFile(legacyAbsolutePath, content, 'utf8');
  await rm(currentAbsolutePath, { force: true });

  const app = await buildApp();

  try {
    const response = await app.inject({
      method: 'GET',
      url: `/uploads/${relativePath}`,
    });

    assert.equal(response.statusCode, 200);
    assert.equal(response.body, content);
    const migrated = await readFile(currentAbsolutePath, 'utf8');
    assert.equal(migrated, content);
  } finally {
    await app.close();
    await removeBestEffort(path.join(uploadRoot, folder), true);
    await removeBestEffort(path.join(legacyUploadRoot, folder), true);
  }
}

async function main(): Promise<void> {
  await verifyStaticServingFromUploadRoot();
  await verifyLegacyUploadMigration();
  process.stdout.write('media regression checks passed\n');
}

await main();

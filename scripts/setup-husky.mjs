import { existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

if (!existsSync('.git')) {
  process.exit(0);
}

try {
  execFileSync('git', ['config', 'core.hooksPath', '.husky'], {
    stdio: 'ignore',
  });
} catch (error) {
  console.warn('Skipping husky setup:', error instanceof Error ? error.message : error);
}

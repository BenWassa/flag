import { createStorageGuard } from './storage-guard.js';

export const INSTALL_PROMPT_STORAGE_KEY = 'flag-atlas:install-prompt-dismissed:v1';

const guard = createStorageGuard();

export function isInstallPromptDismissed(): boolean {
  return guard.readRaw(INSTALL_PROMPT_STORAGE_KEY) === 'true';
}

export function dismissInstallPrompt(): void {
  guard.writeRaw(INSTALL_PROMPT_STORAGE_KEY, 'true');
}

import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { app, safeStorage } from 'electron';

// The session token is encrypted with the OS keychain (DPAPI on Windows) before it touches disk.
const file = () => join(app.getPath('userData'), 'session.bin');

export function saveToken(token: string): void {
  if (!safeStorage.isEncryptionAvailable()) throw new Error('OS encryption is not available');
  writeFileSync(file(), safeStorage.encryptString(token));
}

export function loadToken(): string | null {
  if (!existsSync(file())) return null;
  try {
    return safeStorage.decryptString(readFileSync(file()));
  } catch {
    return null;
  }
}

export function clearToken(): void {
  rmSync(file(), { force: true });
}

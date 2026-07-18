/**
 * Single source of truth for the user-facing application identity.
 *
 * Change `productName` when producing a differently branded distribution. The
 * package and Windows identity deliberately stay stable for a release line so
 * updates and persisted state continue to target the same application.
 */
export const APP_CONFIG = {
  productName: 'WinAgent Terminal',
  packageName: 'winagent-terminal',
  appUserModelId: 'io.winagent.terminal',
  cliCommand: 'winagent',
} as const;

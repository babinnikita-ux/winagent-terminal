import { afterEach, describe, expect, it } from 'vitest';
import os from 'node:os';
import path from 'node:path';
import { APP_CONFIG } from '../../src/shared/app-config';
import { getAppDataDir } from '../../src/shared/instance';

const originalAppData = process.env.APPDATA;
const originalInstance = process.env.WMUX_INSTANCE;

afterEach(() => {
  if (originalAppData === undefined) delete process.env.APPDATA;
  else process.env.APPDATA = originalAppData;
  if (originalInstance === undefined) delete process.env.WMUX_INSTANCE;
  else process.env.WMUX_INSTANCE = originalInstance;
});

describe('instance storage identity', () => {
  it('keeps WinAgent state out of the upstream wmux application directory', () => {
    process.env.APPDATA = path.join(os.tmpdir(), 'winagent-appdata');
    delete process.env.WMUX_INSTANCE;

    expect(getAppDataDir()).toBe(path.join(process.env.APPDATA, APP_CONFIG.packageName));
  });

  it('retains instance suffix isolation for development builds', () => {
    process.env.APPDATA = path.join(os.tmpdir(), 'winagent-appdata');
    process.env.WMUX_INSTANCE = 'test';

    expect(getAppDataDir()).toBe(path.join(process.env.APPDATA, `${APP_CONFIG.packageName}-test`));
  });
});

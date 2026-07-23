import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const appSource = readFileSync('src/renderer/App.tsx', 'utf8');
const tutorialSource = readFileSync('src/renderer/components/Tutorial/Tutorial.tsx', 'utf8');

describe('production application shell', () => {
  it('renders the real terminal workspace instead of the mock workbench', () => {
    expect(appSource).not.toContain("from './workbench/");
    expect(appSource).toContain('className="workspace-shell"');
  });

  it('ships the onboarding flow in Russian', () => {
    expect(tutorialSource).toContain('Добро пожаловать');
    expect(tutorialSource).not.toContain('Welcome to');
    expect(tutorialSource).not.toContain('Get Started');
  });
});

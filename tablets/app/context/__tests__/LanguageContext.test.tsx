import React from 'react';
import { render, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { LanguageProvider, useLanguage } from '../LanguageContext';

// ── Helpers ─────────────────────────────────────────────────────────────────

/** Simple consumer that exposes context values via data-testid attributes. */
function Consumer() {
  const { language, t } = useLanguage();
  return (
    <>
      <span data-testid="lang">{language}</span>
      {/* Valid key path */}
      <span data-testid="valid">{t('theme.toggle')}</span>
      {/* Missing key — should return the key itself as fallback */}
      <span data-testid="missing">{t('does.not.exist')}</span>
      {/* Key that resolves to a non-string (object) — should return key */}
      <span data-testid="nonstring">{t('payback')}</span>
    </>
  );
}

/** Component that calls useLanguage outside a provider — should throw. */
function Orphan() {
  useLanguage();
  return null;
}

// Silence the expected error output from the throw test
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: unknown[]) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('useLanguage must be used')
    )
      return;
    originalError(...args);
  };
});
afterAll(() => {
  console.error = originalError;
});

// ── Tests ────────────────────────────────────────────────────────────────────

describe('LanguageContext', () => {
  beforeEach(() => {
    localStorage.clear();
    // Reset navigator.language to a known value
    Object.defineProperty(navigator, 'language', {
      value: 'en-US',
      configurable: true,
    });
  });

  it('defaults to "en" when localStorage and browser language are not a supported locale', () => {
    Object.defineProperty(navigator, 'language', {
      value: 'fr-FR', // not a supported lang in our locales
      configurable: true,
    });
    render(
      <LanguageProvider>
        <Consumer />
      </LanguageProvider>
    );
    expect(screen.getByTestId('lang').textContent).toBe('en');
  });

  it('restores language from localStorage on mount', async () => {
    localStorage.setItem('language', 'ja');

    await act(async () => {
      render(
        <LanguageProvider>
          <Consumer />
        </LanguageProvider>
      );
    });

    expect(screen.getByTestId('lang').textContent).toBe('ja');
  });

  it('t() returns the key when the path does not exist in translations', () => {
    render(
      <LanguageProvider>
        <Consumer />
      </LanguageProvider>
    );
    expect(screen.getByTestId('missing').textContent).toBe('does.not.exist');
  });

  it('t() returns the key when the resolved value is a non-string (object)', () => {
    render(
      <LanguageProvider>
        <Consumer />
      </LanguageProvider>
    );
    // "payback" resolves to an object in the locale — should fall back to the key
    expect(screen.getByTestId('nonstring').textContent).toBe('payback');
  });

  it('throws when useLanguage is called outside a LanguageProvider', () => {
    expect(() => render(<Orphan />)).toThrow(
      'useLanguage must be used within a LanguageProvider'
    );
  });
});

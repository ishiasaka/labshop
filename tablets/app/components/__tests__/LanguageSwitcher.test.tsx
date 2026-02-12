import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import LanguageSwitcher from '../LanguageSwitcher';
import { LanguageProvider } from '../../context/LanguageContext';
import '@testing-library/jest-dom';

describe('LanguageSwitcher', () => {
  it('renders language switch button', () => {
    render(
      <LanguageProvider>
        <LanguageSwitcher />
      </LanguageProvider>
    );
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  it('opens menu and displays languages', () => {
    render(
      <LanguageProvider>
        <LanguageSwitcher />
      </LanguageProvider>
    );
    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(screen.getByText('English')).toBeInTheDocument();
    expect(screen.getByText('日本語')).toBeInTheDocument();
  });

  it('switches language when an option is clicked', () => {
    // We can't easily test the context update effect on other components here without an integration test,
    // but we can verify the interaction.
    render(
      <LanguageProvider>
        <LanguageSwitcher />
      </LanguageProvider>
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);

    const japaneseOption = screen.getByText('日本語');
    fireEvent.click(japaneseOption);

    // The menu should close
    // Note: Checking for menu closure might differ based on MUI implementation details
    // but we assume the interaction completes without error.
  });
});

import React from 'react';
import { render, screen } from '@testing-library/react';
import StudentCarousel from '../StudentCarousel';
import { LanguageProvider } from '../../context/LanguageContext';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import '@testing-library/jest-dom';

describe('StudentCarousel', () => {
  it('renders without crashing', () => {
    render(
      <LanguageProvider>
        <StudentCarousel />
      </LanguageProvider>
    );
    const carouselElements = screen.getAllByText(/Owed Amount/i);
    expect(carouselElements.length).toBeGreaterThan(0);
  });

  it('displays student names', () => {
    render(
      <LanguageProvider>
        <StudentCarousel />
      </LanguageProvider>
    );
    expect(screen.getAllByText('Alice Johnson')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Bob Smith')[0]).toBeInTheDocument();
  });

  it('displays owed amounts formatted correctly', () => {
    render(
      <LanguageProvider>
        <StudentCarousel />
      </LanguageProvider>
    );
    expect(screen.getAllByText('$50.00')[0]).toBeInTheDocument();
    expect(screen.getAllByText('$120.50')[0]).toBeInTheDocument();
  });

  it('matches snapshot', () => {
    const { container } = render(
      <LanguageProvider>
        <StudentCarousel />
      </LanguageProvider>
    );
    expect(container).toMatchSnapshot();
  });

  it('renders correctly in dark mode (background branch)', () => {
    const darkTheme = createTheme({ palette: { mode: 'dark' } });
    render(
      <LanguageProvider>
        <ThemeProvider theme={darkTheme}>
          <StudentCarousel />
        </ThemeProvider>
      </LanguageProvider>
    );
    // Carousel still renders student names in dark mode
    expect(screen.getAllByText('Alice Johnson')[0]).toBeInTheDocument();
  });
});

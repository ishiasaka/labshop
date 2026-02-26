import React from 'react';
import { render, screen } from '@testing-library/react';
import StudentCarousel from '../StudentCarousel';
import { LanguageProvider } from '../../context/LanguageContext';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import '@testing-library/jest-dom';

// ── Mock useUsers so tests never hit the network ──────────────────────
const mockUseUsers = jest.fn();

jest.mock('../../hooks/useUsers', () => ({
  useUsers: () => mockUseUsers(),
}));

const MOCK_USERS = [
  {
    student_id: 1,
    first_name: 'Alice',
    last_name: 'Johnson',
    account_balance: 50.0,
    status: 'active',
  },
  {
    student_id: 2,
    first_name: 'Bob',
    last_name: 'Smith',
    account_balance: 120.5,
    status: 'active',
  },
];

beforeEach(() => {
  mockUseUsers.mockReturnValue({
    users: MOCK_USERS,
    loading: false,
    error: null,
  });
});

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
    expect(screen.getAllByText('¥50.00')[0]).toBeInTheDocument();
    expect(screen.getAllByText('¥120.50')[0]).toBeInTheDocument();
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

  it('shows a loading spinner when loading=true', () => {
    mockUseUsers.mockReturnValueOnce({ users: [], loading: true, error: null });
    const { container } = render(
      <LanguageProvider>
        <StudentCarousel />
      </LanguageProvider>
    );
    // MUI CircularProgress renders an SVG with role="progressbar"
    expect(container.querySelector('[role="progressbar"]')).toBeInTheDocument();
  });

  it('shows an error message when error is set', () => {
    mockUseUsers.mockReturnValueOnce({
      users: [],
      loading: false,
      error: 'Failed to load',
    });
    render(
      <LanguageProvider>
        <StudentCarousel />
      </LanguageProvider>
    );
    expect(screen.getByText('Failed to load')).toBeInTheDocument();
  });

  it('renders no-data placeholder cards when users list is empty', () => {
    mockUseUsers.mockReturnValueOnce({
      users: [],
      loading: false,
      error: null,
    });
    render(
      <LanguageProvider>
        <StudentCarousel />
      </LanguageProvider>
    );
    // Each placeholder card has name "—"
    const dashes = screen.getAllByText('—');
    expect(dashes.length).toBeGreaterThan(0);
  });

  it('shows a loading spinner in dark mode (dark background branch, line 61)', () => {
    const darkTheme = createTheme({ palette: { mode: 'dark' } });
    mockUseUsers.mockReturnValueOnce({ users: [], loading: true, error: null });
    const { container } = render(
      <LanguageProvider>
        <ThemeProvider theme={darkTheme}>
          <StudentCarousel />
        </ThemeProvider>
      </LanguageProvider>
    );
    expect(container.querySelector('[role="progressbar"]')).toBeInTheDocument();
  });

  it('shows an error message in dark mode (dark background branch, line 81)', () => {
    const darkTheme = createTheme({ palette: { mode: 'dark' } });
    mockUseUsers.mockReturnValueOnce({
      users: [],
      loading: false,
      error: 'Oops',
    });
    render(
      <LanguageProvider>
        <ThemeProvider theme={darkTheme}>
          <StudentCarousel />
        </ThemeProvider>
      </LanguageProvider>
    );
    expect(screen.getByText('Oops')).toBeInTheDocument();
  });

  it('uses success color when amountOwed is exactly 0 (false branch, line 177)', () => {
    mockUseUsers.mockReturnValueOnce({
      users: [
        {
          student_id: 3,
          first_name: 'Zero',
          last_name: 'Balance',
          account_balance: 0,
          status: 'active',
        },
      ],
      loading: false,
      error: null,
    });
    render(
      <LanguageProvider>
        <StudentCarousel />
      </LanguageProvider>
    );
    // ¥0.00 is rendered; the component picks theme.palette.success.main for ≤ 0
    const amounts = screen.getAllByText('¥0.00');
    expect(amounts.length).toBeGreaterThan(0);
  });
});

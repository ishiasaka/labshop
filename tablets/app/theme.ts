import { createTheme } from '@mui/material/styles';
import { Poppins } from 'next/font/google';

declare module '@mui/material/Button' {
  interface ButtonPropsVariantOverrides {
    ghost: true;
  }
}

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

const theme = createTheme({
  palette: {
    primary: {
      // The main "Jungle Green" used for the "Upgrade Now" button and Logo
      main: '#059669',
      900: '#064E3B', // Very dark green (Logo text / Headings)
      800: '#065F46',
      700: '#047857',
      600: '#059669', // Main Button Color
      500: '#10B981', // Brighter Green (Active Toggles)
      400: '#34D399',
      light: '#D1FAE5', // Very light mint (Sidebar "Settings" active state)
      dark: '#064E3B',
      contrastText: '#FFFFFF',
      A700: '#064E3B',
      A100: '#ECFDF5', // Ultra light green (API Box background)
    },
    secondary: {
      // Replaces the monochrome white.
      // Used for "Learn More" or "Settings" buttons inside cards.
      main: '#FFFFFF',
      900: '#111827',
      800: '#1F2937',
      700: '#374151',
      600: '#4B5563',
      500: '#6B7280',
      dark: '#E5E7EB', // Border color for secondary buttons
      light: '#F9FAFB',
      contrastText: '#374151', // Dark Grey text on White buttons
    },
    success: {
      // Often the same as primary in Green themes, but we can make it distinct
      main: '#10B981', // Bright Emerald
      A200: '#6EE7B7',
    },
    error: {
      // The "Remove" text color (Soft Red/Pink)
      main: '#EF4444',
      A100: '#FEE2E2',
      A200: '#F87171',
    },
    warning: {
      main: '#F59E0B',
      A100: '#FEF3C7',
      A200: '#FBBF24',
    },
    info: {
      main: '#3B82F6', // Standard Blue for links (if any)
      A200: '#60A5FA',
    },
    grey: {
      // Neutral greys for the main dashboard background
      100: '#F3F4F6', // Main Dashboard Background (Light Grey)
      200: '#E5E7EB', // Card Borders / Dividers
      300: '#D1D5DB', // Disabled Toggles
      400: '#9CA3AF',
      500: '#6B7280', // Subtitles / "Menu", "General" labels
      600: '#4B5563', // Body text
      700: '#374151', // Card Headings
      800: '#1F2937',
      A100: '#F9FAFB', // Sidebar Background
      A200: '#E5E7EB',
    },
    text: {
      primary: '#111827', // Almost Black for main page titles
      secondary: '#6B7280', // Grey for descriptions
    },
    divider: '#E5E7EB', // Subtle card borders
  },
  typography: {
    fontFamily: poppins.style.fontFamily,
    body1: { baseColor: '#1C1C1E', color: '#1C1C1E' },
    body2: { baseColor: '#6E6E73', color: '#6E6E73' },
    h6: { fontSize: '1.5rem' },
    h5: { fontSize: '1.75rem' },
    h4: { fontSize: '2rem' },
    // ... other typography styles if needed
  },
  components: {
    MuiTypography: {
      styleOverrides: {
        body1: {
          lineHeight: '20px',
        },
      },
    },
    MuiButtonBase: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          textTransform: 'none',
          height: '40px',
          fontWeight: '500',
          lineHeight: '20px',
          ':disabled': {
            opacity: 0.6,
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: 'white',
        },
        rounded: {
          borderRadius: '8px',
        },
      },
    },
    MuiInputBase: {
      styleOverrides: {
        root: {
          height: '40px',
          paddingLeft: 0,
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: ({ theme }) => ({
          '&:hover:not(.Mui-disabled) .MuiOutlinedInput-notchedOutline': {
            borderColor: theme.palette.primary[700],
            borderWidth: '1px',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: theme.palette.primary[700],
            borderWidth: '1px',
            boxShadow: '0 0 1px 2px rgba(41, 116, 255, 0.15)',
          },
        }),
      },
    },
  },
});

export default theme;

import { createTheme, PaletteMode } from '@mui/material/styles';
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

const getDesignTokens = (mode: PaletteMode) => ({
  palette: {
    mode,
    ...(mode === 'light'
      ? {
          // Light mode colors
          primary: {
            main: '#059669',
            900: '#064E3B',
            800: '#065F46',
            700: '#047857',
            600: '#059669',
            500: '#10B981',
            400: '#34D399',
            light: '#D1FAE5',
            dark: '#064E3B',
            contrastText: '#FFFFFF',
            A700: '#064E3B',
            A100: '#ECFDF5',
          },
          secondary: {
            main: '#FFFFFF',
            900: '#111827',
            800: '#1F2937',
            700: '#374151',
            600: '#4B5563',
            500: '#6B7280',
            dark: '#E5E7EB',
            light: '#F9FAFB',
            contrastText: '#374151',
          },
          success: {
            main: '#10B981',
            A200: '#6EE7B7',
          },
          error: {
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
            main: '#3B82F6',
            A200: '#60A5FA',
          },
          grey: {
            100: '#F3F4F6',
            200: '#E5E7EB',
            300: '#D1D5DB',
            400: '#9CA3AF',
            500: '#6B7280',
            600: '#4B5563',
            700: '#374151',
            800: '#1F2937',
            A100: '#F9FAFB',
            A200: '#E5E7EB',
          },
          text: {
            primary: '#111827',
            secondary: '#6B7280',
          },
          divider: '#E5E7EB',
          background: {
            default: '#FFFFFF',
            paper: '#FFFFFF',
          },
        }
      : {
          // Dark mode colors
          primary: {
            main: '#10B981', // Brighter green for dark mode
            900: '#064E3B',
            800: '#065F46',
            700: '#047857',
            600: '#059669',
            500: '#10B981',
            400: '#34D399',
            light: '#064E3B',
            dark: '#D1FAE5',
            contrastText: '#000000',
            A700: '#34D399',
            A100: '#064E3B',
          },
          secondary: {
            main: '#1F2937',
            900: '#F9FAFB',
            800: '#F3F4F6',
            700: '#E5E7EB',
            600: '#D1D5DB',
            500: '#9CA3AF',
            dark: '#374151',
            light: '#111827',
            contrastText: '#F3F4F6',
          },
          success: {
            main: '#10B981',
            A200: '#6EE7B7',
          },
          error: {
            main: '#F87171',
            A100: '#7F1D1D',
            A200: '#EF4444',
          },
          warning: {
            main: '#FBBF24',
            A100: '#78350F',
            A200: '#F59E0B',
          },
          info: {
            main: '#60A5FA',
            A200: '#3B82F6',
          },
          grey: {
            100: '#1F2937',
            200: '#374151',
            300: '#4B5563',
            400: '#6B7280',
            500: '#9CA3AF',
            600: '#D1D5DB',
            700: '#E5E7EB',
            800: '#F3F4F6',
            A100: '#111827', // Sidebar background in dark mode
            A200: '#374151',
          },
          text: {
            primary: '#F9FAFB',
            secondary: '#D1D5DB',
          },
          divider: '#374151',
          background: {
            default: '#111827', // Dark background
            paper: '#1F2937', // Darker paper
          },
        }),
  },
  typography: {
    fontFamily: poppins.style.fontFamily,
    body1: {
        fontSize: '1rem',
    },
    body2: {
        fontSize: '0.875rem',
    },
    h6: { fontSize: '1.5rem' },
    h5: { fontSize: '1.75rem' },
    h4: { fontSize: '2rem' },
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
        root: ({ theme }: { theme: any }) => ({
           borderRadius: '8px',
           backgroundImage: 'none', // Remove default gradient in dark mode
        }),
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
        root: ({ theme }: { theme: any }) => ({
          '&:hover:not(.Mui-disabled) .MuiOutlinedInput-notchedOutline': {
            borderColor: theme.palette.primary.main, // Use main for hover in both modes roughly
            borderWidth: '1px',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: theme.palette.primary.main,
            borderWidth: '1px',
            boxShadow: `0 0 1px 2px ${mode === 'dark' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(41, 116, 255, 0.15)'}`,
          },
        }),
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: mode === 'dark' ? '#F9FAFB' : '#111827',
          color: mode === 'dark' ? '#111827' : '#F9FAFB',
          fontSize: '0.75rem',
        },
      },
    },
    // Fix icons color in dark mode if needed
    MuiSvgIcon: {
        styleOverrides: {
            root: {
                // Default icon color behavior should be fine, but can override if needed
            }
        }
    }
  },
});

export default getDesignTokens;

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
      main: '#442EBA',
      900: '#2E1A95',
      800: '#442EBA',
      700: '#583FE0',
      600: '#8B75FF',
      500: '#DCD6F9',
      400: '#F6F4FF',
      light: '#938CB6',
      dark: '#442EBA',
      contrastText: '#FFFFFF', // Use contrastText for text on primary backgrounds
      A700: '#321DA0',
    },
    secondary: {
      main: '#78DFC9',
      900: '#2FA78D',
      800: '#78DFC9',
      700: '#42CDB0',
      600: '#A5F6E5',
      500: '#CFF7EF',
      dark: '#72B0A2',
      light: '#78DFC9',
      contrastText: '#1C1C1E',
    },
    success: {
      main: '#3BDD84',
      A200: '#28C76F80',
    },
    error: {
      main: '#F95152',
      A100: '#ea545427',
      A200: '#EA545580',
    },
    warning: {
      main: '#FBBD41',
      A100: '#FFFAF0',
      A200: '#FFAB0080',
    },
    info: {
      main: '#005FCC',
      A200: '#005FCC80',
    },
    grey: {
      100: '#F8F7FC',
      200: '#ECECEE',
      300: '#D1D1D6',
      400: '#B2B2B9',
      500: '#9D9DA7',
      600: '#6E6E73',
      700: '#3D3D41',
      800: '#2E2E32',
      A100: '#FBFBFF',
      A200: '#C5D0DE',
    },
    text: {
      primary: '#1C1C1E',
    },
    divider: '#C5D0DE',
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
          variants: [
            {
              props: { variant: 'contained', color: 'primary' },
              style: ({ theme }) => ({
                textTransform: 'none',
                baseColor: theme.palette.primary.contrastText,
                color: theme.palette.text.primary,
                backgroundColor: theme.palette.primary[500],
                gap: '4px',
                '&:hover': {
                  backgroundColor: theme.palette.primary[600],
                  color: theme.palette.primary.contrastText,
                },
                '&:active': {
                  border: `1px solid ${theme.palette.primary[700]}`,
                },
                '&:focus, &:focus-visible, &:focus-within': {
                  backgroundColor: theme.palette.primary[700],
                  color: theme.palette.primary.contrastText,
                  boxShadow: `0 0 1px 2px ${theme.palette.primary[500]}`,
                },
                ':disabled': {
                  color: theme.palette.primary.contrastText,
                  opacity: 0.4,
                  backgroundColor: theme.palette.primary[700],
                },
              }),
            },
            {
              props: { variant: 'contained', color: 'secondary' },
              style: ({ theme }) => ({
                textTransform: 'none',
                gap: '4px',
                baseColor: theme.palette.secondary.contrastText,
                ':disabled': {
                  color: 'inherit',
                  backgroundColor: theme.palette.secondary.main,
                },
              }),
            },
            {
              props: { variant: 'outlined', color: 'primary' },
              style: ({ theme }) => ({
                gap: '4px',
                color: theme.palette.text.primary,
                borderColor: theme.palette.primary[700],
                '&:hover': {
                  backgroundColor: theme.palette.primary[400],
                  borderColor: theme.palette.primary[900],
                },
                '&:active': {
                  backgroundColor: theme.palette.primary[500],
                  borderColor: theme.palette.primary[900],
                },
                '&:focus, &:focus-visible, &:focus-within': {
                  borderWidth: '2px',
                },
                '&:disabled': {
                  backgroundColor: 'transparent',
                  opacity: 0.4,
                },
              }),
            },
          ],
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

'use client';

import { ThemeProvider as MUIThemeProvider } from '@mui/material/styles';
import theme from './theme';

export default function RootLayout(props: { children: React.ReactNode }) {

  return (
    <MUIThemeProvider theme={theme}>
      {props.children}
    </MUIThemeProvider>
  );
}

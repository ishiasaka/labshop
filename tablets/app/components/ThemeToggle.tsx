'use client';

import * as React from 'react';
import IconButton from '@mui/material/IconButton';
import Box from '@mui/material/Box';
import { useTheme } from '@mui/material/styles';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import { ColorModeContext } from '../provider';

export default function ThemeToggle() {
  const theme = useTheme();
  const colorMode = React.useContext(ColorModeContext);

  return (
    <Box
      sx={{
        position: 'absolute',
        top: 16,
        right: 16,
        zIndex: 1100, // Ensure it sits above other content
        bgcolor: 'background.paper',
        borderRadius: '50%',
        boxShadow: 1,
      }}
    >
      <IconButton onClick={colorMode.toggleColorMode} color="inherit">
        {theme.palette.mode === 'dark' ? (
          <Brightness7Icon />
        ) : (
          <Brightness4Icon />
        )}
      </IconButton>
    </Box>
  );
}

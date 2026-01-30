'use client';
import Button from '@/app/shared/components/Button';
import { Stack, Typography } from '@mui/material';

export default function Home() {
  return (
    <Stack
      sx={{
        alignItems: 'center',
        width: '100%',
      }}
    >
      <Typography variant="h4">Welcome to the Tablets App!</Typography>

      <Stack
        sx={{
          marginTop: 4,
          width: '300px',
          gap: 2
        }}
      >
        {(['primary', 'secondary'] as const).map((color) => (
          <>
            <Button key={color} variant="contained" color={color}>
              {color.charAt(0).toUpperCase() + color.slice(1)} Contained
            </Button>
            <Button key={color} variant="outlined" color={color}>
              {color.charAt(0).toUpperCase() + color.slice(1)} Outlined
            </Button>
          </>
        ))}
      </Stack>
    </Stack>
  );
}

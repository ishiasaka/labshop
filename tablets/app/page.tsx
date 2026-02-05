'use client';
import StudentCarousel from '@/app/components/StudentCarousel';
import ThemeToggle from '@/app/components/ThemeToggle';
import { Box } from '@mui/material';

export default function Home() {
  return (
    <Box
      sx={{
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
      }}
    >
      <ThemeToggle />
      <StudentCarousel />
    </Box>
  );
}

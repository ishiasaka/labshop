'use client';
import StudentCarousel from '@/app/components/StudentCarousel';
import ThemeToggle from '@/app/components/ThemeToggle';
import LanguageSwitcher from '@/app/components/LanguageSwitcher';
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
      <Box sx={{ position: 'absolute', top: 16, right: 80, zIndex: 1100 }}>
        <LanguageSwitcher />
      </Box>
      <ThemeToggle />
      <StudentCarousel />
    </Box>
  );
}

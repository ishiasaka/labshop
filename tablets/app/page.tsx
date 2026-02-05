'use client';
import StudentCarousel from '@/app/components/StudentCarousel';
import ThemeToggle from '@/app/components/ThemeToggle';
import LanguageSwitcher from '@/app/components/LanguageSwitcher';
import PaybackModal from '@/app/components/PaybackModal';
import { Box } from '@mui/material';
import { useState } from 'react';

export default function Home() {
  const [paybackData, setPaybackData] = useState<{
    name: string;
    id: string;
    owedAmount: number;
  } | null>(null);

  const handleSimulatePayback = () => {
    setPaybackData({
      name: 'Test User',
      id: '123',
      owedAmount: 3000,
    });
  };

  return (
    <Box
      sx={{
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
      }}
      suppressHydrationWarning
    >
      <Box sx={{ position: 'absolute', top: 16, right: 80, zIndex: 1100 }}>
        <LanguageSwitcher />
      </Box>
      <ThemeToggle />
      <StudentCarousel />

      {/* Temporary Trigger Button */}
      <Box sx={{ position: 'absolute', bottom: 16, right: 16, zIndex: 2000 }}>
        <button
          onClick={handleSimulatePayback}
          style={{ padding: '8px 16px', cursor: 'pointer' }}
        >
          Simulate Payback
        </button>
      </Box>

      {paybackData && (
        <PaybackModal
          open={!!paybackData}
          onClose={() => setPaybackData(null)}
          userData={paybackData}
        />
      )}
    </Box>
  );
}

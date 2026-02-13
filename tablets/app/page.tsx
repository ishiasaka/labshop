'use client';
import StudentCarousel from '@/app/components/StudentCarousel';
import ThemeToggle from '@/app/components/ThemeToggle';
import LanguageSwitcher from '@/app/components/LanguageSwitcher';
import PaybackModal from '@/app/components/PaybackModal';
import { useWebSocket } from '@/app/hooks/useWebSocket';
import { Box } from '@mui/material';
import { useCallback, useState } from 'react';

interface PaybackPayload {
  name: string;
  id: string;
  owedAmount: number;
}

function isPaybackPayload(data: unknown): data is PaybackPayload {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof (data as PaybackPayload).name === 'string' &&
    typeof (data as PaybackPayload).id === 'string' &&
    typeof (data as PaybackPayload).owedAmount === 'number'
  );
}

export default function Home() {
  const [paybackData, setPaybackData] = useState<PaybackPayload | null>(null);

  const handleWsMessage = useCallback((data: unknown) => {
    if (isPaybackPayload(data)) {
      setPaybackData(data);
    }
  }, []);

  const { status } = useWebSocket({ onMessage: handleWsMessage });

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

      {/* WebSocket connection status indicator */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 16,
          right: 16,
          zIndex: 2000,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        <Box
          data-testid="ws-status"
          sx={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            backgroundColor:
              status === 'connected'
                ? 'success.main'
                : status === 'connecting'
                  ? 'warning.main'
                  : 'error.main',
            transition: 'background-color 0.3s ease',
          }}
        />
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

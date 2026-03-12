'use client';
import StudentCarousel from '@/app/components/StudentCarousel';
import ThemeToggle from '@/app/components/ThemeToggle';
import LanguageSwitcher from '@/app/components/LanguageSwitcher';
import PaybackModal from '@/app/components/PaybackModal';
import { useWebSocket } from '@/app/hooks/useWebSocket';
import { useUsers } from '@/app/hooks/useUsers';
import { Box } from '@mui/material';
import { useCallback, useState } from 'react';
import RegisterNewCardModal from './components/RegisterNewCardModal';
import WebSocketStatus from './components/WebSocketStatus';

interface PaybackPayload {
  student_name: string;
  student_id: string;
  debt_amount: number;
  action: "PAY_BACK";
}

interface BuyPayload {
  action: "BUY";
}

interface NewCardPayload {
  action: "NEW_CARD";
  card_uid: string
}

function isPaybackPayload(data: unknown): data is PaybackPayload {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof (data as PaybackPayload).student_name === 'string' &&
    typeof (data as PaybackPayload).student_id === 'string' &&
    typeof (data as PaybackPayload).debt_amount === 'number' &&
    (data as PaybackPayload).action === 'PAY_BACK'
  );
}

function isBuyPayload(data: unknown): data is BuyPayload {
  return (
    typeof data === 'object' &&
    data !== null &&
    (data as BuyPayload).action === 'BUY'
  );
}

function isNewCardPayload(data: unknown): data is NewCardPayload {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof (data as NewCardPayload).card_uid === 'string' &&
    (data as NewCardPayload).action === 'NEW_CARD'
  );
}


export default function Home() {
  const [paybackData, setPaybackData] = useState<PaybackPayload | null>(null);
  const [newCardData, setNewCardData] = useState<NewCardPayload | null>(null);
  const { mutate } = useUsers();

  const handleWsMessage = useCallback((data: unknown) => {
    if (isPaybackPayload(data)) {
      setPaybackData(data);
    } else if (isBuyPayload(data)) {
      mutate();
    } else if (isNewCardPayload(data)) {
      setNewCardData(data);
    }
  }, [mutate]);

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
        }}
      >
        <WebSocketStatus status={status} />
      </Box>

      {paybackData && (
        <PaybackModal
          open={!!paybackData}
          onClose={() => setPaybackData(null)}
          onSuccess={() => mutate()}
          userData={{
            name: paybackData.student_name,
            id: paybackData.student_id,
            owedAmount: paybackData.debt_amount,
          }}
        />
      )}
      {newCardData && (
        <RegisterNewCardModal 
          open={!!newCardData}
          onClose={() => setNewCardData(null)}
          onSuccess={() => mutate()}
          userData={{
            card_uid: newCardData.card_uid,
          }}
        />
      )}
    </Box>
  );
}

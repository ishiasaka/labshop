'use client';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  Typography,
  Button,
  Stack,
  TextField,
  Box,
  IconButton,
  CircularProgress,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { translations } from '../locales';

interface PaybackModalProps {
  open: boolean;
  onClose: () => void;
  userData: {
    name: string;
    id: string;
    owedAmount: number;
  };
}

type PaymentStatus = 'idle' | 'processing' | 'success';

export default function PaybackModal({
  open,
  onClose,
  userData,
}: PaybackModalProps) {
  const { language } = useLanguage();
  const t = translations[language];
  const [showOtherInput, setShowOtherInput] = useState(false);
  const [otherAmount, setOtherAmount] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('idle');

  const handleClose = () => {
    if (paymentStatus === 'processing') return; // Prevent closing while processing
    setShowOtherInput(false);
    setOtherAmount('');
    setPaymentStatus('idle');
    onClose();
  };

  const simulatePayment = (amount: number | string) => {
    setPaymentStatus('processing');
    console.log(`Processing payment: ${amount}`);

    setTimeout(() => {
      setPaymentStatus('success');
      console.log('Payment successful');

      setTimeout(() => {
        handleClose();
      }, 2000);
    }, 1500);
  };

  const handlePresetClick = (amount: number) => {
    simulatePayment(amount);
  };

  const handleOtherSubmit = () => {
    simulatePayment(otherAmount);
  };

  const renderContent = () => {
    if (paymentStatus === 'processing') {
      return (
        <Stack spacing={3} alignItems="center" py={4}>
          <CircularProgress
            size={60}
            thickness={4}
            sx={{ color: 'primary.main' }}
          />
          <Typography variant="h6" fontWeight={500}>
            {t.payback.processing}
          </Typography>
        </Stack>
      );
    }

    if (paymentStatus === 'success') {
      return (
        <Stack spacing={3} alignItems="center" py={4}>
          <CheckCircleIcon sx={{ fontSize: 80, color: 'success.main' }} />
          <Typography variant="h5" fontWeight="bold" color="success.main">
            {t.payback.success}
          </Typography>
        </Stack>
      );
    }

    // Idle state content
    return (
      <Stack spacing={3}>
        <Box>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            {t.payback.user}
          </Typography>
          <Typography variant="body1" fontWeight={500}>
            {userData.name}
          </Typography>
        </Box>

        <Box>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            {t.payback.totalOwed}
          </Typography>
          <Typography variant="h4" fontWeight="bold">
            ¥{userData.owedAmount.toLocaleString()}
          </Typography>
        </Box>

        {!showOtherInput ? (
          <Stack spacing={2}>
            <Typography variant="subtitle1" fontWeight={500}>
              {t.payback.selectAmount}
            </Typography>
            <Stack direction="row" spacing={1.5}>
              {[100, 200, 500].map((amount) => (
                <Button
                  key={amount}
                  variant="outlined"
                  color="inherit"
                  onClick={() => handlePresetClick(amount)}
                  sx={{
                    flex: 1,
                    py: 1.5,
                  }}
                >
                  ¥{amount}
                </Button>
              ))}
            </Stack>

            <Button
              variant="contained"
              onClick={() => setShowOtherInput(true)}
              fullWidth
            >
              {t.payback.otherAmount}
            </Button>
          </Stack>
        ) : (
          <Stack spacing={3}>
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                {t.payback.enterAmount} *
              </Typography>
              <TextField
                placeholder={t.payback.enterAmount}
                type="number"
                value={otherAmount}
                onChange={(e) => setOtherAmount(e.target.value)}
                autoFocus
                fullWidth
              />
            </Box>

            <Stack spacing={1}>
              <Button
                variant="contained"
                onClick={handleOtherSubmit}
                disabled={!otherAmount}
                fullWidth
              >
                {t.payback.confirmPayment}
              </Button>
              <Button
                onClick={() => setShowOtherInput(false)}
                fullWidth
                sx={{
                  textTransform: 'none',
                  color: 'text.secondary',
                  fontWeight: 500,
                }}
              >
                {t.payback.backToPresets}
              </Button>
            </Stack>
          </Stack>
        )}
      </Stack>
    );
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            borderRadius: 4,
            padding: 6,
            boxShadow: '0px 8px 24px rgba(0,0,0,0.1)',
          },
        },
      }}
    >
      <Box sx={{ position: 'absolute', right: 16, top: 16 }}>
        <IconButton
          onClick={handleClose}
          size="small"
          disabled={paymentStatus === 'processing'}
        >
          <CloseIcon />
        </IconButton>
      </Box>

      <DialogTitle sx={{ p: 0, mb: 3, mt: 1 }}>
        <Typography variant="h5" fontWeight="bold">
          {paymentStatus === 'idle' ? t.payback.title : ''}
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>{renderContent()}</DialogContent>
    </Dialog>
  );
}

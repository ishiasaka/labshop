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
  Alert,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { translations } from '../locales';
import { useRegisterCard } from '../hooks/useRegisterCard';

interface RegisterNewCardModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  userData: {
    card_uid: string;
  };
}

type RegisterStatus = 'idle' | 'processing' | 'success';

const AUTO_CLOSE_SECONDS = 5;

const RegisterNewCardModal: React.FC<RegisterNewCardModalProps> = ({
  open,
  onClose,
  onSuccess,
  userData,
}) => {
  const { language } = useLanguage();
  const t = translations[language];
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [registerStatus, setRegisterStatus] = useState<RegisterStatus>('idle');
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(AUTO_CLOSE_SECONDS);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { register } = useRegisterCard();

  const resetForm = () => {
    setFirstName('');
    setLastName('');
    setStudentId('');
    setRegisterStatus('idle');
    setRegisterError(null);
    setCountdown(AUTO_CLOSE_SECONDS);
  };

  const handleClose = () => {
    if (registerStatus === 'processing') return;
    if (countdownRef.current) clearInterval(countdownRef.current);
    resetForm();
    onClose();
  };

  // Start countdown when success state is entered
  useEffect(() => {
    if (registerStatus !== 'success') return;

    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    const closeTimer = setTimeout(() => {
      resetForm();
      onClose();
    }, AUTO_CLOSE_SECONDS * 1000);

    return () => {
      clearInterval(countdownRef.current!);
      clearTimeout(closeTimer);
    };
  }, [registerStatus]); // eslint-disable-line react-hooks/exhaustive-deps

  const processRegister = async () => {
    setRegisterError(null);
    setRegisterStatus('processing');
    try {
      await register({
        uid: userData.card_uid,
        student_id: studentId,
        first_name: firstName,
        last_name: lastName,
      });
      setRegisterStatus('success');
      if (onSuccess) onSuccess();
    } catch {
      setRegisterStatus('idle');
      setRegisterError(t.registerNewCard.error);
    }
  };

  const handleSubmit = () => {
    if (!firstName.trim() || !lastName.trim() || !studentId.trim()) {
      setRegisterError(t.registerNewCard.error);
      return;
    }
    processRegister();
  };

  const renderContent = () => {
    if (registerStatus === 'processing') {
      return (
        <Stack spacing={3} alignItems="center" py={4}>
          <CircularProgress size={60} thickness={4} sx={{ color: 'primary.main' }} />
          <Typography variant="h6" fontWeight={500}>
            {t.registerNewCard.processing}
          </Typography>
        </Stack>
      );
    }

    if (registerStatus === 'success') {
      return (
        <Stack spacing={3} alignItems="center" py={4}>
          <CheckCircleIcon sx={{ fontSize: 80, color: 'success.main' }} />
          <Typography variant="h5" fontWeight="bold" color="success.main">
            {t.registerNewCard.success}
          </Typography>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 56,
              height: 56,
              borderRadius: '50%',
              bgcolor: 'grey.100',
            }}
          >
            <Typography variant="h5" fontWeight="bold" color="text.secondary">
              {countdown}
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">
            {language === 'ja'
              ? `${countdown}秒後に自動的に閉じます`
              : `Closing automatically in ${countdown} second${countdown !== 1 ? 's' : ''}…`}
          </Typography>
        </Stack>
      );
    }

    return (
      <Stack spacing={3}>
        {registerError && (
          <Alert severity="error" onClose={() => setRegisterError(null)}>
            {registerError}
          </Alert>
        )}

        <Box>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            {t.registerNewCard.iccardId}
          </Typography>
          <TextField
            fullWidth
            placeholder={t.registerNewCard.iccardId}
            value={userData.card_uid}
            disabled
          />
        </Box>

        <Box>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            {t.registerNewCard.firstName}
          </Typography>
          <TextField
            fullWidth
            placeholder={t.registerNewCard.firstName}
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
        </Box>

        <Box>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            {t.registerNewCard.lastName}
          </Typography>
          <TextField
            fullWidth
            placeholder={t.registerNewCard.lastName}
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
        </Box>

        <Box>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            {t.registerNewCard.studentId}
          </Typography>
          <TextField
            fullWidth
            placeholder={t.registerNewCard.studentId}
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
          />
        </Box>

        <Button
          variant="contained"
          color="primary"
          fullWidth
          onClick={handleSubmit}
        >
          {t.registerNewCard.submit}
        </Button>
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
          disabled={registerStatus === 'processing'}
        >
          <CloseIcon />
        </IconButton>
      </Box>

      <DialogTitle sx={{ p: 0, mb: 3, mt: 1 }}>
        <Typography variant="h5" component="div" fontWeight="bold">
          {t.registerNewCard.title}
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>{renderContent()}</DialogContent>
    </Dialog>
  );
};

export default RegisterNewCardModal;
'use client';

import { useEffect, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import { adminJson } from '../_hooks/useAdminApi';

interface Props {
  onLinked?: () => void;
}

export default function CardLinkCapture({ onLinked }: Props) {
  const [uid, setUid] = useState('');
  const [studentId, setStudentId] = useState('');
  const [statusMsg, setStatusMsg] = useState('Scanning for new card taps…');
  const [linking, setLinking] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let active = true;

    async function poll() {
      try {
        const res = await fetch('/api/admin/ic_cards/captured');
        if (res.ok) {
          const card = (await res.json()) as { uid?: string };
          if (card?.uid && active) {
            setUid(card.uid);
            setStatusMsg(`New card detected: ${card.uid}`);
          }
        }
      } catch {
        // silent – backend may be temporarily unreachable
      } finally {
        if (active) {
          pollRef.current = setTimeout(poll, 2000);
        }
      }
    }

    poll();
    return () => {
      active = false;
      if (pollRef.current) clearTimeout(pollRef.current);
    };
  }, []);

  async function handleLink() {
    const sid = parseInt(studentId.trim(), 10);
    if (!uid.trim()) {
      setError('No UID detected. Tap a card first.');
      return;
    }
    if (!sid) {
      setError('Please enter a valid Student ID.');
      return;
    }
    setLinking(true);
    setError('');
    setSuccess('');
    try {
      await adminJson(`/ic_cards/${encodeURIComponent(uid)}/register`, {
        method: 'POST',
        body: JSON.stringify({ student_id: sid }),
      });
      setSuccess('Card linked successfully!');
      setUid('');
      setStudentId('');
      setStatusMsg('Scanning for new card taps…');
      onLinked?.();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLinking(false);
    }
  }

  return (
    <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
      <Typography variant="h6" mb={1}>
        Link IC Card
      </Typography>
      <Box display="flex" alignItems="center" gap={1} mb={2}>
        <FiberManualRecordIcon
          fontSize="small"
          sx={{ color: uid ? 'success.main' : 'text.disabled', animation: uid ? 'none' : 'pulse 1.5s infinite' }}
        />
        <Typography variant="body2" color="text.secondary">
          {statusMsg}
        </Typography>
      </Box>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="flex-start">
        <TextField
          label="Detected UID"
          size="small"
          value={uid}
          InputProps={{ readOnly: true }}
          placeholder="Tap card on reader…"
          sx={{ width: 220 }}
        />
        <TextField
          label="Student ID"
          type="number"
          size="small"
          value={studentId}
          onChange={(e) => setStudentId(e.target.value)}
          sx={{ width: 160 }}
        />
        <Button
          variant="contained"
          onClick={handleLink}
          disabled={linking}
          startIcon={linking ? <CircularProgress size={16} /> : undefined}
        >
          Connect Card
        </Button>
      </Stack>
      {error && (
        <Alert severity="error" sx={{ mt: 1 }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mt: 1 }}>
          {success}
        </Alert>
      )}
    </Paper>
  );
}

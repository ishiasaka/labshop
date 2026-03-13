'use client';

import { useState } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import { adminJson } from '../hooks/useAdminApi';

export default function SettingsSection() {
  const [maxDebt, setMaxDebt] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function handleUpdate() {
    const val = maxDebt.trim();
    if (!val || Number.isNaN(Number(val))) {
      setError('Please enter a valid number.');
      return;
    }
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await adminJson('/settings', {
        method: 'PUT',
        body: JSON.stringify({ key: 'max_debt_limit', value: val }),
      });
      setSuccess(`Max debt limit updated to ¥${val}`);
      setMaxDebt('');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Box>
      <Typography variant="h5" mb={3}>
        System Settings
      </Typography>
      <Paper variant="outlined" sx={{ p: 3, maxWidth: 480, borderTop: '4px solid', borderColor: 'warning.main' }}>
        <Typography variant="h6" mb={2}>
          Maximum Debt Limit
        </Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="flex-start">
          <TextField
            label="Max Debt (¥)"
            type="number"
            size="small"
            value={maxDebt}
            onChange={(e) => setMaxDebt(e.target.value)}
            sx={{ width: 180 }}
          />
          <Button
            variant="contained"
            color="warning"
            onClick={handleUpdate}
            disabled={saving}
            startIcon={saving ? <CircularProgress size={16} /> : undefined}
          >
            Update Limit
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
    </Box>
  );
}

'use client';
import { Box, Typography, Tooltip } from '@mui/material';
import WifiIcon from '@mui/icons-material/Wifi';
import WifiOffIcon from '@mui/icons-material/WifiOff';
import SyncIcon from '@mui/icons-material/Sync';
import type { ConnectionStatus } from '../hooks/useWebSocket';

interface WebSocketStatusProps {
  status: ConnectionStatus;
}

const config: Record<
  ConnectionStatus,
  { color: string; label: string; Icon: React.ElementType; pulse: boolean }
> = {
  connected: {
    color: 'success.main',
    label: 'Connected',
    Icon: WifiIcon,
    pulse: false,
  },
  connecting: {
    color: 'warning.main',
    label: 'Connecting…',
    Icon: SyncIcon,
    pulse: true,
  },
  disconnected: {
    color: 'error.main',
    label: 'Disconnected',
    Icon: WifiOffIcon,
    pulse: false,
  },
};

export default function WebSocketStatus({ status }: WebSocketStatusProps) {
  const { color, label, Icon, pulse } = config[status];

  return (
    <Tooltip title={`WebSocket: ${label}`} placement="top">
      <Box
        data-testid="ws-status"
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.75,
          px: 1.5,
          py: 0.75,
          borderRadius: 999,
          bgcolor: 'background.paper',
          boxShadow: 1,
          userSelect: 'none',
        }}
      >
        {/* Dot */}
        <Box
          sx={{
            position: 'relative',
            width: 10,
            height: 10,
            flexShrink: 0,
          }}
        >
          <Box
            sx={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              bgcolor: color,
              transition: 'background-color 0.3s ease',
            }}
          />
          {pulse && (
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                borderRadius: '50%',
                bgcolor: color,
                opacity: 0.5,
                animation: 'ws-ping 1.2s cubic-bezier(0,0,0.2,1) infinite',
                '@keyframes ws-ping': {
                  '0%': { transform: 'scale(1)', opacity: 0.6 },
                  '100%': { transform: 'scale(2.4)', opacity: 0 },
                },
              }}
            />
          )}
        </Box>

        {/* Icon */}
        <Icon
          sx={{
            fontSize: 16,
            color,
            transition: 'color 0.3s ease',
            ...(pulse && {
              animation: 'ws-spin 1s linear infinite',
              '@keyframes ws-spin': {
                from: { transform: 'rotate(0deg)' },
                to: { transform: 'rotate(360deg)' },
              },
            }),
          }}
        />

        {/* Label */}
        <Typography
          variant="caption"
          fontWeight={500}
          sx={{ color, transition: 'color 0.3s ease', lineHeight: 1 }}
        >
          {label}
        </Typography>
      </Box>
    </Tooltip>
  );
}

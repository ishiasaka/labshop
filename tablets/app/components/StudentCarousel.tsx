'use client';

import React from 'react';
import {
  Box,
  CircularProgress,
  Typography,
  Paper,
  useTheme,
} from '@mui/material';
import { keyframes } from '@emotion/react';
import { useLanguage } from '../context/LanguageContext';
import { useUsers } from '../hooks/useUsers';

export type Student = {
  id: string;
  name: string;
  amountOwed: number;
};

const scroll = keyframes`
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(-100%);
  }
`;

export default function StudentCarousel() {
  const theme = useTheme();
  const { t } = useLanguage();
  const { users, loading, error } = useUsers();

  const students: Student[] = users.map((u) => ({
    id: String(u.student_id),
    name: `${u.first_name} ${u.last_name}`,
    amountOwed: u.account_balance,
  }));

  // Duplicate the list dynamically to ensure it is wide enough to cover the screen
  const NO_DATA_PLACEHOLDER: Student[] = Array.from({ length: 6 }, (_, i) => ({
    id: `no-data-${i}`,
    name: '—',
    amountOwed: -1, // sentinel: rendered as "No Data"
  }));

  let baseStudents = students.length > 0 ? students : NO_DATA_PLACEHOLDER;
  // Ensure we have enough items so the width exceeds the screen (assume width of 6 is safe)
  while (baseStudents.length > 0 && baseStudents.length < 6) {
    baseStudents = [...baseStudents, ...students];
  }

  if (loading) {
    return (
      <Box
        sx={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor:
            theme.palette.mode === 'light'
              ? theme.palette.grey[100]
              : theme.palette.background.default,
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        sx={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor:
            theme.palette.mode === 'light'
              ? theme.palette.grey[100]
              : theme.palette.background.default,
        }}
      >
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  const scrollAnimation = `${scroll} 20s linear infinite`;

  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        position: 'relative',
        backgroundColor:
          theme.palette.mode === 'light'
            ? theme.palette.grey[100]
            : theme.palette.background.default,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          width: 'max-content',
          '&:hover > div': {
            animationPlayState: 'paused',
          },
        }}
      >
        <Box
          sx={{
            display: 'flex',
            gap: 4,
            pr: 4,
            animation: scrollAnimation,
          }}
        >
          {baseStudents.map((student, index) => (
            <Paper
              key={`set1-${student.id}-${index}`}
              elevation={3}
              sx={{
                width: 300,
                height: 400,
                borderRadius: 4,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                alignItems: 'center',
                p: 4,
                flexShrink: 0,
                backgroundColor: 'background.paper',
                transition: 'transform 0.3s ease',
                '&:hover': {
                  transform: 'scale(1.05)',
                },
              }}
            >
              <Typography
                variant="h4"
                component="div"
                sx={{
                  fontWeight: 600,
                  color: theme.palette.text.primary,
                  textAlign: 'center',
                }}
              >
                {student.name}
              </Typography>

              <Box sx={{ textAlign: 'center' }}>
                {student.amountOwed === -1 ? (
                  <Typography
                    variant="h4"
                    sx={{
                      fontWeight: 700,
                      color: theme.palette.text.disabled,
                      letterSpacing: 2,
                    }}
                  >
                    {t('noData')}
                  </Typography>
                ) : (
                  <>
                    <Typography
                      variant="h6"
                      color="text.secondary"
                      sx={{ mb: 1, fontWeight: 500 }}
                    >
                      {t('owedAmount')}
                    </Typography>
                    <Typography
                      variant="h3"
                      sx={{
                        fontWeight: 700,
                        color:
                          student.amountOwed > 0
                            ? theme.palette.error.main
                            : theme.palette.success.main,
                      }}
                    >
                      ¥{student.amountOwed.toFixed(2)}
                    </Typography>
                  </>
                )}
              </Box>
            </Paper>
          ))}
        </Box>

        <Box
          sx={{
            display: 'flex',
            gap: 4,
            pr: 4,
            animation: scrollAnimation,
          }}
        >
          {baseStudents.map((student, index) => (
            <Paper
              key={`set2-${student.id}-${index}`}
              elevation={3}
              sx={{
                width: 300,
                height: 400,
                borderRadius: 4,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                alignItems: 'center',
                p: 4,
                flexShrink: 0,
                backgroundColor: 'background.paper',
                transition: 'transform 0.3s ease',
                '&:hover': {
                  transform: 'scale(1.05)',
                },
              }}
            >
              <Typography
                variant="h4"
                component="div"
                sx={{
                  fontWeight: 600,
                  color: theme.palette.text.primary,
                  textAlign: 'center',
                }}
              >
                {student.name}
              </Typography>

              <Box sx={{ textAlign: 'center' }}>
                {student.amountOwed === -1 ? (
                  <Typography
                    variant="h4"
                    sx={{
                      fontWeight: 700,
                      color: theme.palette.text.disabled,
                      letterSpacing: 2,
                    }}
                  >
                    {t('noData')}
                  </Typography>
                ) : (
                  <>
                    <Typography
                      variant="h6"
                      color="text.secondary"
                      sx={{ mb: 1, fontWeight: 500 }}
                    >
                      {t('owedAmount')}
                    </Typography>
                    <Typography
                      variant="h3"
                      sx={{
                        fontWeight: 700,
                        color:
                          student.amountOwed > 0
                            ? theme.palette.error.main
                            : theme.palette.success.main,
                      }}
                    >
                      ¥{student.amountOwed.toFixed(2)}
                    </Typography>
                  </>
                )}
              </Box>
            </Paper>
          ))}
        </Box>
      </Box>
    </Box>
  );
}

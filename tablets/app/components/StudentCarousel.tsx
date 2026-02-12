'use client';

import React from 'react';
import { Box, Typography, Paper, useTheme } from '@mui/material';
import { keyframes } from '@emotion/react';
import { useLanguage } from '../context/LanguageContext';

// Mock Data
export type Student = {
  id: string;
  name: string;
  amountOwed: number;
};

const STUDENTS: Student[] = [
  { id: '1', name: 'Alice Johnson', amountOwed: 50.0 },
  { id: '2', name: 'Bob Smith', amountOwed: 120.5 },
  { id: '3', name: 'Charlie Brown', amountOwed: 0.0 },
  { id: '4', name: 'Diana Prince', amountOwed: 75.25 },
  { id: '5', name: 'Evan Wright', amountOwed: 210.0 },
  { id: '6', name: 'Fiona Gallagher', amountOwed: 15.0 },
  { id: '7', name: 'George Miller', amountOwed: 0.0 },
  { id: '8', name: 'Hannah Abbott', amountOwed: 45.0 },
  { id: '9', name: 'Ian Malcolm', amountOwed: 99.99 },
  { id: '10', name: 'Julia Stiles', amountOwed: 300.0 },
];

const scroll = keyframes`
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(-50%);
  }
`;

export default function StudentCarousel() {
  const theme = useTheme();
  const { t } = useLanguage();

  // Duplicate the list to ensure seamless scrolling
  const displayedStudents = [...STUDENTS, ...STUDENTS];

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
          gap: 4,
          paddingX: 2,
          animation: `${scroll} 60s linear infinite`,
          width: 'max-content',
          '&:hover': {
            animationPlayState: 'paused',
          },
        }}
      >
        {displayedStudents.map((student, index) => (
          <Paper
            key={`${student.id}-${index}`}
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
                ${student.amountOwed.toFixed(2)}
              </Typography>
            </Box>
          </Paper>
        ))}
      </Box>
    </Box>
  );
}

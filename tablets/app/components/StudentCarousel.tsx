'use client';

import React, { useRef, useEffect } from 'react';
import {
  Box,
  CircularProgress,
  Typography,
  Paper,
  useTheme,
} from '@mui/material';
import { useLanguage } from '../context/LanguageContext';
import { useUsers } from '../hooks/useUsers';

export type Student = {
  id: string;
  name: string;
  amountOwed: number;
};

const SCROLL_SPEED = 1.5; // px per frame

export default function StudentCarousel() {
  const theme = useTheme();
  const { t } = useLanguage();
  const { users, loading, error } = useUsers();
  const containerRef = useRef<HTMLDivElement>(null);
  const drag = useRef({ isDown: false, startX: 0, scrollLeft: 0 });

  const students: Student[] = users.map((u) => ({
    id: String(u.student_id),
    name: `${u.first_name} ${u.last_name}`,
    amountOwed: u.account_balance,
  }));

  const NO_DATA_PLACEHOLDER: Student[] = Array.from({ length: 6 }, (_, i) => ({
    id: `no-data-${i}`,
    name: '—',
    amountOwed: -1,
  }));

  let baseStudents = students.length > 0 ? students : NO_DATA_PLACEHOLDER;
  while (baseStudents.length < 6) {
    baseStudents = [...baseStudents, ...students];
  }

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let rafId: number;
    const animate = () => {
      if (!drag.current.isDown) {
        container.scrollLeft += SCROLL_SPEED;
        const half = container.scrollWidth / 2;
        if (half > 0 && container.scrollLeft >= half) {
          container.scrollLeft -= half;
        }
      }
      rafId = requestAnimationFrame(animate);
    };

    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, []);

  const onMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    drag.current = { isDown: true, startX: e.pageX, scrollLeft: containerRef.current?.scrollLeft ?? 0 };
  };
  const onMouseUp = () => { drag.current.isDown = false; };
  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!drag.current.isDown) return;
    e.preventDefault();
    if (containerRef.current) {
      containerRef.current.scrollLeft = drag.current.scrollLeft - (e.pageX - drag.current.startX);
    }
  };

  if (loading) {
    return (
      <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: theme.palette.mode === 'light' ? theme.palette.grey[100] : theme.palette.background.default }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: theme.palette.mode === 'light' ? theme.palette.grey[100] : theme.palette.background.default }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  const cardList = (prefix: string) =>
    baseStudents.map((student, index) => (
      <Paper
        key={`${prefix}-${student.id}-${index}`}
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
          '&:hover': { transform: 'scale(1.05)' },
        }}
      >
        <Typography variant="h4" component="div" sx={{ fontWeight: 600, color: theme.palette.text.primary, textAlign: 'center' }}>
          {student.name}
        </Typography>
        <Box sx={{ textAlign: 'center' }}>
          {student.amountOwed === -1 ? (
            <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.text.disabled, letterSpacing: 2 }}>
              {t('noData')}
            </Typography>
          ) : (
            <>
              <Typography variant="h6" color="text.secondary" sx={{ mb: 1, fontWeight: 500 }}>
                {t('owedAmount')}
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 700, color: student.amountOwed > 0 ? theme.palette.error.main : theme.palette.success.main }}>
                {student.amountOwed < 0 ? '+' : ''}¥{Math.abs(student.amountOwed)}
              </Typography>
            </>
          )}
        </Box>
      </Paper>
    ));

  return (
    <Box
      ref={containerRef}
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      onMouseMove={onMouseMove}
      sx={{
        width: '100%',
        height: '100%',
        overflowX: 'auto',
        overflowY: 'hidden',
        display: 'flex',
        alignItems: 'center',
        cursor: 'grab',
        '&:active': { cursor: 'grabbing' },
        '&::-webkit-scrollbar': { display: 'none' },
        scrollbarWidth: 'none',
        backgroundColor: theme.palette.mode === 'light' ? theme.palette.grey[100] : theme.palette.background.default,
      }}
    >
      <Box sx={{ display: 'flex', gap: 4, px: 2, flexShrink: 0 }}>
        {cardList('set1')}
      </Box>
      <Box sx={{ display: 'flex', gap: 4, px: 2, flexShrink: 0 }}>
        {cardList('set2')}
      </Box>
    </Box>
  );
}

'use client';

import { useMemo, useState } from 'react';
import useSWR from 'swr';
import Box from '@mui/material/Box';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TablePagination from '@mui/material/TablePagination';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import { adminSwrFetcher } from '../hooks/useAdminApi';
import type { Purchase, Payment, ActivityItem } from '../app/types';

interface PurchasesResponse {
  purchases: Purchase[];
}
interface PaymentsResponse {
  payments: Payment[];
}

export default function ActivityTable() {
  const { data: purchasesData, isLoading: pLoading, error: pError } = useSWR<PurchasesResponse>(
    '/purchases/',
    adminSwrFetcher,
    { refreshInterval: 10_000 }
  );
  const { data: paymentsData, isLoading: payLoading, error: payError } = useSWR<PaymentsResponse>(
    '/payments/',
    adminSwrFetcher,
    { refreshInterval: 10_000 }
  );

  const [page, setPage] = useState(0);
  const rowsPerPage = 10;

  const activity = useMemo<ActivityItem[]>(() => {
    const purchases = (purchasesData?.purchases ?? []).map<ActivityItem>((x) => ({
      time: x.created_at,
      student_id: x.student_id,
      type: 'PURCHASE',
      amount: x.price,
    }));
    const payments = (paymentsData?.payments ?? []).map<ActivityItem>((x) => ({
      time: x.created_at,
      student_id: x.student_id,
      type: 'PAYMENT',
      amount: x.amount_paid,
    }));
    return [...purchases, ...payments].sort(
      (a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()
    );
  }, [purchasesData, paymentsData]);

  const paged = activity.slice(page * rowsPerPage, (page + 1) * rowsPerPage);
  const isLoading = pLoading || payLoading;
  const error = pError ?? payError;

  return (
    <Box>
      <Typography variant="h6" mb={2}>
        Recent Activity
      </Typography>
      {isLoading && <CircularProgress size={24} />}
      {error && <Alert severity="error">Failed to load activity</Alert>}
      {!isLoading && !error && (
        <Paper variant="outlined">
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Time</TableCell>
                  <TableCell>Student</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell align="right">Amount</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paged.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      No recent activity
                    </TableCell>
                  </TableRow>
                ) : (
                  paged.map((a, i) => (
                    <TableRow key={i}>
                      <TableCell>{new Date(a.time).toLocaleString()}</TableCell>
                      <TableCell>ID: {a.student_id}</TableCell>
                      <TableCell>
                        <Chip
                          label={a.type}
                          color={a.type === 'PAYMENT' ? 'success' : 'warning'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">¥{a.amount}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={activity.length}
            page={page}
            rowsPerPage={rowsPerPage}
            rowsPerPageOptions={[10]}
            onPageChange={(_, p) => setPage(p)}
          />
        </Paper>
      )}
    </Box>
  );
}

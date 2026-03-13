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
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import { adminSwrFetcher } from '../hooks/useAdminApi';
import type { User } from '../app/types';

interface UsersResponse {
  users: User[];
}

export default function DebtTable() {
  const { data, error, isLoading } = useSWR<UsersResponse>('/users/', adminSwrFetcher, {
    refreshInterval: 10_000,
  });

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const rowsPerPage = 10;

  const debtUsers = useMemo(() => {
    const all = (data?.users ?? []).filter((u) => Number(u.account_balance ?? 0) > 0);
    const q = search.toLowerCase().trim();
    if (!q) return all;
    return all.filter((u) => {
      const name = `${u.first_name} ${u.last_name}`.toLowerCase();
      return name.includes(q) || String(u.student_id).includes(q);
    });
  }, [data, search]);

  const paged = debtUsers.slice(page * rowsPerPage, (page + 1) * rowsPerPage);

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
        <Typography variant="h6">Live Student Debt List</Typography>
      </Box>
      <TextField
        size="small"
        placeholder="Search name or ID…"
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setPage(0);
        }}
        sx={{ mb: 2, width: 280 }}
      />
      {isLoading && <CircularProgress size={24} />}
      {error && <Alert severity="error">Failed to load users</Alert>}
      {!isLoading && !error && (
        <Paper variant="outlined">
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell align="right">Debt</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paged.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} align="center">
                      No debt records
                    </TableCell>
                  </TableRow>
                ) : (
                  paged.map((u) => (
                    <TableRow key={u.student_id}>
                      <TableCell>{u.student_id}</TableCell>
                      <TableCell>
                        {u.first_name} {u.last_name}
                      </TableCell>
                      <TableCell align="right">
                        <Chip label={`¥${u.account_balance}`} color="error" size="small" />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={debtUsers.length}
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

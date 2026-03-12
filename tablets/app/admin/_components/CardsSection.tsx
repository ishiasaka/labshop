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
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import CardLinkCapture from './CardLinkCapture';
import { adminSwrFetcher, adminJson } from '../_hooks/useAdminApi';
import type { IcCard } from '../_types';

export default function CardsSection() {
  const { data, error, isLoading, mutate } = useSWR<IcCard[]>('/ic_cards/', adminSwrFetcher);

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const rowsPerPage = 10;

  const filtered = useMemo(() => {
    const all = Array.isArray(data) ? data : [];
    const q = search.toLowerCase().trim();
    if (!q) return all;
    return all.filter((c) => {
      return (
        c.uid.toLowerCase().includes(q) ||
        String(c.student_id ?? '').includes(q) ||
        c.status.toLowerCase().includes(q)
      );
    });
  }, [data, search]);

  const paged = filtered.slice(page * rowsPerPage, (page + 1) * rowsPerPage);

  async function handleAction(uid: string, action: string, method: 'POST' | 'PATCH') {
    try {
      await adminJson(`/ic_cards/${encodeURIComponent(uid)}/${action}`, { method });
      await mutate();
    } catch (e) {
      alert((e as Error).message);
    }
  }

  return (
    <Box>
      <Typography variant="h5" mb={3}>
        IC Cards Management
      </Typography>

      <CardLinkCapture onLinked={() => mutate()} />

      <Typography variant="h6" mb={1}>
        All IC Cards
      </Typography>
      <TextField
        size="small"
        placeholder="Search UID, student ID, or status…"
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setPage(0);
        }}
        sx={{ mb: 2, width: 300 }}
      />
      {isLoading && <CircularProgress size={24} />}
      {error && <Alert severity="error">Failed to load IC cards</Alert>}
      {!isLoading && !error && (
        <Paper variant="outlined">
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>UID</TableCell>
                  <TableCell>Student ID</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paged.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      No cards found
                    </TableCell>
                  </TableRow>
                ) : (
                  paged.map((c) => (
                    <TableRow key={c.uid}>
                      <TableCell sx={{ fontFamily: 'monospace' }}>{c.uid}</TableCell>
                      <TableCell>{c.student_id ?? '—'}</TableCell>
                      <TableCell>
                        <Chip
                          label={c.status}
                          color={c.status === 'active' ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1}>
                          {c.student_id != null && (
                            <Button
                              size="small"
                              variant="outlined"
                              color="warning"
                              onClick={() => handleAction(c.uid, 'unlink', 'POST')}
                            >
                              Unlink
                            </Button>
                          )}
                          {c.status === 'active' ? (
                            <Button
                              size="small"
                              variant="outlined"
                              color="error"
                              onClick={() => handleAction(c.uid, 'deactivate', 'PATCH')}
                            >
                              Deactivate
                            </Button>
                          ) : (
                            <Button
                              size="small"
                              variant="outlined"
                              color="success"
                              onClick={() => handleAction(c.uid, 'activate', 'PATCH')}
                            >
                              Activate
                            </Button>
                          )}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={filtered.length}
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

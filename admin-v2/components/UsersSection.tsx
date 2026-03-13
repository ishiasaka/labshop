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
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import Stack from '@mui/material/Stack';
import { adminSwrFetcher, adminJson } from '../hooks/useAdminApi';
import type { User } from '../app/types';

interface UsersResponse {
  users: User[];
}

export default function UsersSection() {
  const { data, error, isLoading, mutate } = useSWR<UsersResponse>(
    '/users?include_inactive=true',
    adminSwrFetcher
  );

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const rowsPerPage = 10;

  // Create user form
  const [sid, setSid] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  // Confirm dialog
  const [confirmUser, setConfirmUser] = useState<{ user: User; nextStatus: string } | null>(null);
  const [toggling, setToggling] = useState(false);

  const filtered = useMemo(() => {
    const all = data?.users ?? [];
    const q = search.toLowerCase().trim();
    if (!q) return all;
    return all.filter((u) => {
      const name = `${u.first_name} ${u.last_name}`.toLowerCase();
      return name.includes(q) || String(u.student_id).includes(q);
    });
  }, [data, search]);

  const paged = filtered.slice(page * rowsPerPage, (page + 1) * rowsPerPage);

  async function handleCreate() {
    const studentId = parseInt(sid.trim(), 10);
    if (!studentId || !firstName.trim() || !lastName.trim()) {
      setCreateError('Please fill in all fields.');
      return;
    }
    setCreating(true);
    setCreateError('');
    try {
      await adminJson('/users/', {
        method: 'POST',
        body: JSON.stringify({ student_id: studentId, first_name: firstName.trim(), last_name: lastName.trim() }),
      });
      setSid('');
      setFirstName('');
      setLastName('');
      await mutate();
    } catch (e) {
      setCreateError((e as Error).message);
    } finally {
      setCreating(false);
    }
  }

  async function handleToggleStatus() {
    if (!confirmUser) return;
    const { user, nextStatus } = confirmUser;
    setToggling(true);
    try {
      await adminJson(`/users/${user.student_id}/status?status=${encodeURIComponent(nextStatus)}`, {
        method: 'PATCH',
      });
      await mutate();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setToggling(false);
      setConfirmUser(null);
    }
  }

  return (
    <Box>
      <Typography variant="h5" mb={3}>
        Users Management
      </Typography>

      {/* Add New Student */}
      <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" mb={2}>
          Add New Student
        </Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="flex-start">
          <TextField
            label="Student ID"
            type="number"
            size="small"
            value={sid}
            onChange={(e) => setSid(e.target.value)}
            sx={{ width: 140 }}
          />
          <TextField
            label="First Name"
            size="small"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
          <TextField
            label="Last Name"
            size="small"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
          <Button
            variant="contained"
            onClick={handleCreate}
            disabled={creating}
            startIcon={creating ? <CircularProgress size={16} /> : undefined}
          >
            Save New Student
          </Button>
        </Stack>
        {createError && (
          <Alert severity="error" sx={{ mt: 1 }}>
            {createError}
          </Alert>
        )}
      </Paper>

      {/* All Users Table */}
      <Typography variant="h6" mb={1}>
        All Users
      </Typography>
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
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Balance</TableCell>
                  <TableCell>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paged.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  paged.map((u) => {
                    const isActive = u.status === 'active';
                    const nextStatus = isActive ? 'inactive' : 'active';
                    return (
                      <TableRow key={u.student_id}>
                        <TableCell>{u.student_id}</TableCell>
                        <TableCell>
                          {u.first_name} {u.last_name}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={u.status}
                            color={isActive ? 'success' : 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="right">¥{u.account_balance ?? 0}</TableCell>
                        <TableCell>
                          <Button
                            size="small"
                            variant="outlined"
                            color={isActive ? 'error' : 'success'}
                            onClick={() => setConfirmUser({ user: u, nextStatus })}
                          >
                            {isActive ? 'Deactivate' : 'Activate'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
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

      {/* Confirm toggle dialog */}
      <Dialog open={!!confirmUser} onClose={() => setConfirmUser(null)}>
        <DialogTitle>Confirm Status Change</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {confirmUser
              ? `Set ${confirmUser.user.first_name} ${confirmUser.user.last_name} to "${confirmUser.nextStatus}"?`
              : ''}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmUser(null)} disabled={toggling}>
            Cancel
          </Button>
          <Button
            onClick={handleToggleStatus}
            disabled={toggling}
            variant="contained"
            color={confirmUser?.nextStatus === 'inactive' ? 'error' : 'success'}
          >
            {toggling ? <CircularProgress size={16} /> : 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

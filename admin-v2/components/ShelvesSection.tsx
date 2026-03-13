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
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import { adminSwrFetcher, adminJson } from '../hooks/useAdminApi';
import type { Shelf } from '../app/types';

interface ShelvesResponse {
  shelves?: Shelf[];
}

export default function ShelvesSection() {
  const { data, error, isLoading, mutate } = useSWR<ShelvesResponse | Shelf[]>(
    '/shelves/',
    adminSwrFetcher
  );

  const shelves: Shelf[] = useMemo(() => {
    if (Array.isArray(data)) return data;
    return (data as ShelvesResponse)?.shelves ?? [];
  }, [data]);

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const rowsPerPage = 10;

  // Form state
  const [shelfId, setShelfId] = useState('');
  const [usbPort, setUsbPort] = useState('');
  const [price, setPrice] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return shelves;
    return shelves.filter(
      (s) =>
        s.shelf_id.toLowerCase().includes(q) || String(s.usb_port).includes(q)
    );
  }, [shelves, search]);

  const paged = filtered.slice(page * rowsPerPage, (page + 1) * rowsPerPage);

  function selectShelf(s: Shelf) {
    setShelfId(s.shelf_id);
    setUsbPort(String(s.usb_port));
    setPrice(String(s.price));
  }

  async function handleSave() {
    const port = parseInt(usbPort.trim(), 10);
    const pr = parseInt(price.trim(), 10);
    if (!shelfId.trim() || Number.isNaN(port) || Number.isNaN(pr)) {
      setFormError('Please fill Shelf ID, USB Port, and Price.');
      return;
    }
    setSaving(true);
    setFormError('');
    setFormSuccess('');
    try {
      // Try create; if 409 conflict try update
      let res = await fetch(`/api/admin/shelves/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shelf_id: shelfId.trim(), usb_port: port, price: pr }),
      });

      if (!res.ok && res.status === 409) {
        res = await fetch(`/api/admin/shelves/${encodeURIComponent(shelfId.trim())}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ usb_port: port, price: pr }),
        });
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: `HTTP ${res.status}` }));
        throw new Error(typeof err?.detail === 'string' ? err.detail : `HTTP ${res.status}`);
      }

      setFormSuccess('Shelf saved!');
      setShelfId('');
      setUsbPort('');
      setPrice('');
      await mutate();
    } catch (e) {
      setFormError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await adminJson(`/shelves/${encodeURIComponent(deleteTarget)}`, { method: 'DELETE' });
      await mutate();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  }

  return (
    <Box>
      <Typography variant="h5" mb={3}>
        Shelves Management
      </Typography>

      {/* Add / Edit form */}
      <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" mb={2}>
          Add / Update Shelf
        </Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="flex-start" flexWrap="wrap">
          <TextField
            label="Shelf ID"
            size="small"
            value={shelfId}
            onChange={(e) => setShelfId(e.target.value)}
            sx={{ width: 160 }}
          />
          <TextField
            label="USB Port"
            type="number"
            size="small"
            value={usbPort}
            onChange={(e) => setUsbPort(e.target.value)}
            sx={{ width: 120 }}
          />
          <TextField
            label="Price (¥)"
            type="number"
            size="small"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            sx={{ width: 120 }}
          />
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving}
            startIcon={saving ? <CircularProgress size={16} /> : undefined}
          >
            Save Shelf
          </Button>
        </Stack>
        {formError && (
          <Alert severity="error" sx={{ mt: 1 }}>
            {formError}
          </Alert>
        )}
        {formSuccess && (
          <Alert severity="success" sx={{ mt: 1 }}>
            {formSuccess}
          </Alert>
        )}
      </Paper>

      {/* Shelves table */}
      <Typography variant="h6" mb={1}>
        All Shelves
      </Typography>
      <TextField
        size="small"
        placeholder="Search Shelf ID or USB Port…"
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setPage(0);
        }}
        sx={{ mb: 2, width: 280 }}
      />
      {isLoading && <CircularProgress size={24} />}
      {error && <Alert severity="error">Failed to load shelves</Alert>}
      {!isLoading && !error && (
        <Paper variant="outlined">
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Shelf ID</TableCell>
                  <TableCell>USB Port</TableCell>
                  <TableCell align="right">Price</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paged.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      No shelves found
                    </TableCell>
                  </TableRow>
                ) : (
                  paged.map((s) => (
                    <TableRow key={s.shelf_id}>
                      <TableCell sx={{ fontFamily: 'monospace' }}>{s.shelf_id}</TableCell>
                      <TableCell>{s.usb_port}</TableCell>
                      <TableCell align="right">¥{s.price}</TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1}>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => selectShelf(s)}
                          >
                            Edit
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            color="error"
                            onClick={() => setDeleteTarget(s.shelf_id)}
                          >
                            Delete
                          </Button>
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

      {/* Delete confirm dialog */}
      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)}>
        <DialogTitle>Delete Shelf</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Delete shelf &quot;{deleteTarget}&quot;? This cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)} disabled={deleting}>
            Cancel
          </Button>
          <Button onClick={handleDelete} disabled={deleting} color="error" variant="contained">
            {deleting ? <CircularProgress size={16} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

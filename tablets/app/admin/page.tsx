'use client';

import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import DebtTable from './_components/DebtTable';
import ActivityTable from './_components/ActivityTable';

export default function AdminDashboardPage() {
  return (
    <>
      <Typography variant="h4" fontWeight={700} mb={3}>
        Dashboard
      </Typography>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <DebtTable />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <ActivityTable />
        </Grid>
      </Grid>
    </>
  );
}

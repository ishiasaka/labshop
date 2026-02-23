import React from 'react';
import AdminAppBar from '../components/Admin/AdminAppBar';
import { Container } from '@mui/material';

const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <div>
            <AdminAppBar />
            {/* Add margin top to create space below the AppBar */}
            <div style={{ marginTop: 32 }}>
                <Container>{children}</Container>
            </div>
        </div>
    )
}

export default AdminLayout;
"use client";

import React from "react";
import { useAuth } from "@/app/context/AuthContext";
import LoginForm from "@/app/components/Admin/LoginForm";
import { Box, Button, Typography } from "@mui/material";

const AdminPage: React.FC = () => {
    const { isAuthenticated, logout } = useAuth();

    return (
        <Box sx={{ mt: 4 }}>
            {isAuthenticated ? (
                <Box>
                    <Typography variant="h6">You are logged in as admin.</Typography>
                    <Button variant="outlined" color="secondary" onClick={logout} sx={{ mt: 2 }}>
                        Logout
                    </Button>
                </Box>
            ) : (
                <LoginForm />
            )}
        </Box>
    );
};

export default AdminPage;
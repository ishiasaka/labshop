"use client";

import React from "react";
import { useAuth } from "@/app/context/AuthContext";
import LoginForm from "@/app/components/Admin/LoginForm";

const TransactionPage: React.FC = () => {
    const { isAuthenticated } = useAuth();
    if (!isAuthenticated) return <LoginForm />;
    return (
        <div>
            This is the transaction page. Here you can view and manage transactions.
        </div>
    );
};

export default TransactionPage;
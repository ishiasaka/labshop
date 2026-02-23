"use client";

import React from "react";
import { useAuth } from "@/app/context/AuthContext";
import LoginForm from "@/app/components/Admin/LoginForm";

const UserPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <LoginForm />;
  return (
    <div>
      This is the user management page. Here you can view and manage users.
    </div>
  );
};

export default UserPage;

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import SettingsIcon from '@mui/icons-material/Settings';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import LogoutIcon from '@mui/icons-material/Logout';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';

import { AdminAuthProvider, useAdminAuth } from '../context/AdminAuthContext';
import AdminGuard from '../components/AdminGuard';
import { useRouter } from 'next/navigation';
import { Google_Sans, Google_Sans_Flex } from 'next/font/google';
import EmotionRegistry from './emotion-registry';
import Provider from './provider';

const DRAWER_WIDTH = 240;

const navItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, href: '/' },
  { text: 'Users', icon: <PeopleIcon />, href: '/users' },
  { text: 'IC Cards', icon: <CreditCardIcon />, href: '/cards' },
  { text: 'Shelves', icon: <Inventory2Icon />, href: '/shelves' },
  { text: 'Settings', icon: <SettingsIcon />, href: '/settings' },
];

const googleSans = Google_Sans_Flex({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-google-sans',
});

function AdminLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { adminInfo, logout } = useAdminAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const isLoginPage = pathname === '/login';
  const toggleDrawer = () => setDrawerOpen((prev) => !prev);

  const router = useRouter();

  if (isLoginPage) return <>{children}</>;

  const logoutHandler = async () => {
    await logout();
    // redirect to login page after logout
    router.push('/login');
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
      }}
    >
      {/* AppBar */}
      <AppBar
        position="fixed"
        sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}
      >
                <Toolbar>
                  <IconButton
                    size="large"
                    edge="start"
                    color="inherit"
                    aria-label="open navigation"
                    onClick={toggleDrawer}
                    sx={{ mr: 2 }}
                  >
                    <MenuIcon />
                  </IconButton>
                  <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                    Labshop Admin
                  </Typography>
                  {adminInfo && (
                    <Box display="flex" alignItems="center" gap={1}>
                      <AccountCircleIcon fontSize="small" />
                      <Typography variant="body2">
                        {adminInfo.admin_name}
                      </Typography>
                    </Box>
                  )}
                  <Tooltip title="Logout">
                    <IconButton
                      color="inherit"
                      onClick={logoutHandler}
                      sx={{ ml: 1 }}
                    >
                      <LogoutIcon />
                    </IconButton>
                  </Tooltip>
                </Toolbar>
              </AppBar>

              {/* Drawer */}
              <Drawer
                open={drawerOpen}
                onClose={toggleDrawer}
                sx={{
                  width: DRAWER_WIDTH,
                  flexShrink: 0,
                  '& .MuiDrawer-paper': {
                    width: DRAWER_WIDTH,
                    boxSizing: 'border-box',
                  },
                }}
              >
                <Toolbar />
                <List>
                  {navItems.map(({ text, icon, href }) => (
                    <ListItem key={text} disablePadding>
                      <ListItemButton
                        component={Link}
                        href={href}
                        selected={pathname === href}
                        onClick={() => setDrawerOpen(false)}
                      >
                        <ListItemIcon>{icon}</ListItemIcon>
                        <ListItemText primary={text} />
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
                <Divider />
                <List>
                  <ListItem disablePadding>
                    <ListItemButton onClick={logoutHandler}>
                      <ListItemIcon>
                        <LogoutIcon />
                      </ListItemIcon>
                      <ListItemText primary="Logout" />
                    </ListItemButton>
                  </ListItem>
                </List>
              </Drawer>

              {/* Content */}
              <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
                <Toolbar /> {/* spacer for fixed AppBar */}
                {children}
              </Box>

              {/* Footer */}
              <Box
                component="footer"
                sx={{
                  py: 2,
                  px: 3,
                  mt: 'auto',
                  backgroundColor: (theme) => theme.palette.grey[200],
                  textAlign: 'center',
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  © {new Date().getFullYear()} Admin Panel. All rights reserved.
                </Typography>
              </Box>
            </Box>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${googleSans.variable}`} suppressHydrationWarning>
        <EmotionRegistry>
          <Provider>
            <AdminAuthProvider>
              <AdminGuard>
                <AdminLayoutInner>{children}</AdminLayoutInner>
              </AdminGuard>
            </AdminAuthProvider>
          </Provider>
        </EmotionRegistry>
      </body>
    </html>
  );
}

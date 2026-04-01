import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { useRouter, usePathname } from 'next/navigation';
import AdminGuard from '../AdminGuard';
import { AdminAuthProvider } from '../../context/AdminAuthContext';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
}));

const mockReplace = jest.fn();

function renderWithProviders(pathname: string) {
  (useRouter as jest.Mock).mockReturnValue({ replace: mockReplace });
  (usePathname as jest.Mock).mockReturnValue(pathname);

  return render(
    <AdminAuthProvider>
      <AdminGuard>
        <div>Protected Content</div>
      </AdminGuard>
    </AdminAuthProvider>
  );
}

describe('AdminGuard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders children directly on the login page without auth check', async () => {
    // On the login page the guard skips the auth check and renders immediately
    renderWithProviders('/login');
    expect(await screen.findByText('Protected Content')).toBeInTheDocument();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('redirects to /login when /api/admin/me returns 401', async () => {
    (global.fetch as jest.Mock) = jest.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ detail: 'Not authenticated' }),
    });

    renderWithProviders('/admin');

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/login');
    });
  });

  it('renders children when /api/admin/me returns ok', async () => {
    (global.fetch as jest.Mock) = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ admin_name: 'Test Admin', admin_id: '1' }),
    });

    renderWithProviders('/admin');

    expect(await screen.findByText('Protected Content')).toBeInTheDocument();
    expect(mockReplace).not.toHaveBeenCalled();
  });
});

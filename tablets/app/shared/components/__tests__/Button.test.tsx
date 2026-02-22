import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Button from '../Button';

describe('Button (shared)', () => {
  it('renders children when not loading', () => {
    render(<Button>Pay Now</Button>);
    expect(screen.getByText('Pay Now')).toBeInTheDocument();
    // CircularProgress should NOT be present
    expect(screen.queryByRole('progressbar')).toBeNull();
  });

  it('renders a spinner instead of children when loading', () => {
    render(<Button loading>Pay Now</Button>);
    // MUI renders a CircularProgress with role="progressbar" when loading
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });
});
